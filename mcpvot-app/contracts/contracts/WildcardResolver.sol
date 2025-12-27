// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MCPVOTWildcardResolver
 * @author MCPVOT Team
 * @notice ENS Wildcard Resolver for *.mcpvot.eth using CCIP-Read (EIP-3668)
 * @dev Deploys to Ethereum L1, resolves subdomains by querying Base L2 via CCIP-Read
 * 
 * Architecture:
 * 1. User queries {tokenId}.mcpvot.eth
 * 2. L1 resolver reverts with OffchainLookup → triggers CCIP-Read
 * 3. Client calls gateway (https://mcpvot.xyz/api/gateway)
 * 4. Gateway queries Base L2 VOTRegistry for contenthash
 * 5. Gateway returns signed response
 * 6. L1 resolver verifies signature and returns contenthash
 * 
 * @custom:security-contact security@mcpvot.xyz
 */
contract MCPVOTWildcardResolver is Ownable {
    // =========================================================================
    // EIP-3668 CCIP-Read Error
    // =========================================================================
    
    /**
     * @notice Revert with this error to trigger CCIP-Read
     * @param sender The address that made the call (this contract)
     * @param urls Array of gateway URLs to try
     * @param callData The original calldata to forward to gateway
     * @param callbackFunction The function selector for callback
     * @param extraData Additional data passed to callback
     */
    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );
    
    // =========================================================================
    // ENS Interface IDs (EIP-137, EIP-181, EIP-1577)
    // =========================================================================
    
    /// @notice EIP-165: supportsInterface
    bytes4 private constant INTERFACE_SUPPORTS_INTERFACE = 0x01ffc9a7;
    
    /// @notice EIP-137: ENS resolver
    bytes4 private constant INTERFACE_ENS_RESOLVER = 0x01ffc9a7;
    
    /// @notice EIP-181: addr(bytes32)
    bytes4 private constant INTERFACE_ADDR = 0x3b3b57de;
    
    /// @notice EIP-1577: contenthash(bytes32)
    bytes4 private constant INTERFACE_CONTENTHASH = 0xbc1c58d1;
    
    /// @notice EIP-181: Extended resolver (resolve(bytes,bytes))
    bytes4 private constant INTERFACE_EXTENDED_RESOLVER = 0x9061b923;
    
    // =========================================================================
    // State Variables
    // =========================================================================
    
    /// @notice Gateway URLs for CCIP-Read
    string[] public gatewayURLs;
    
    /// @notice Gateway signer address for signature verification
    address public gatewaySigner;
    
    /// @notice Whether to require signature verification (can be disabled for testing)
    bool public requireSignature;
    
    /// @notice Response validity period (in seconds)
    uint256 public responseValidityPeriod;
    
    /// @notice Contract version
    string public constant VERSION = "1.0.0";
    
    // =========================================================================
    // Events
    // =========================================================================
    
    event GatewayURLsUpdated(string[] urls);
    event GatewaySignerUpdated(address indexed oldSigner, address indexed newSigner);
    event SignatureRequirementUpdated(bool required);
    event ContenthashResolved(bytes32 indexed node, bytes contenthash);
    
    // =========================================================================
    // Errors
    // =========================================================================
    
    error InvalidSignature();
    error ResponseExpired(uint64 expiry, uint256 currentTime);
    error NoGatewayURLs();
    error InvalidCallbackData();
    
    // =========================================================================
    // Constructor
    // =========================================================================
    
    /**
     * @notice Initialize the wildcard resolver
     * @param _gatewayURLs Array of CCIP-Read gateway URLs
     * @param _gatewaySigner Address that signs gateway responses
     */
    constructor(
        string[] memory _gatewayURLs,
        address _gatewaySigner
    ) Ownable(msg.sender) {
        gatewayURLs = _gatewayURLs;
        gatewaySigner = _gatewaySigner;
        requireSignature = true;
        responseValidityPeriod = 3600; // 1 hour default
        
        emit GatewayURLsUpdated(_gatewayURLs);
    }
    
    // =========================================================================
    // EIP-165: Interface Support
    // =========================================================================
    
    /**
     * @notice Check if interface is supported
     * @param interfaceId The interface identifier
     * @return Whether the interface is supported
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == INTERFACE_SUPPORTS_INTERFACE ||
               interfaceId == INTERFACE_ADDR ||
               interfaceId == INTERFACE_CONTENTHASH ||
               interfaceId == INTERFACE_EXTENDED_RESOLVER;
    }
    
    // =========================================================================
    // Extended Resolver (EIP-181)
    // =========================================================================
    
    /**
     * @notice Main ENS resolution function - triggers CCIP-Read
     * @dev Always reverts with OffchainLookup to trigger client-side gateway fetch
     * @param name DNS-encoded name (e.g., "180.mcpvot.eth")
     * @param data Original resolver calldata
     * @return Never returns - always reverts
     */
    function resolve(bytes calldata name, bytes calldata data) 
        external 
        view 
        returns (bytes memory) 
    {
        if (gatewayURLs.length == 0) revert NoGatewayURLs();
        
        // Create the gateway request calldata
        // Gateway will parse the name and lookup tokenId on Base L2
        bytes memory gatewayCalldata = abi.encode(name, data);
        
        // Revert with OffchainLookup to trigger CCIP-Read
        revert OffchainLookup(
            address(this),
            gatewayURLs,
            gatewayCalldata,
            this.resolveWithProof.selector,
            gatewayCalldata // Pass original data for callback verification
        );
    }
    
    /**
     * @notice Callback function after gateway returns data
     * @dev Called by client after fetching from gateway
     * @param response ABI-encoded response from gateway
     * @param extraData Original calldata for verification
     * @return Decoded contenthash bytes
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        returns (bytes memory)
    {
        // Decode gateway response
        (bytes memory contenthash, uint64 expiry, bytes memory signature) = 
            abi.decode(response, (bytes, uint64, bytes));
        
        // Check expiry
        if (block.timestamp > expiry) {
            revert ResponseExpired(expiry, block.timestamp);
        }
        
        // Verify signature if required
        if (requireSignature && signature.length > 0) {
            bytes32 messageHash = keccak256(
                abi.encodePacked(
                    keccak256(extraData),
                    contenthash,
                    expiry
                )
            );
            
            bytes32 ethSignedMessageHash = keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
            );
            
            address recoveredSigner = recoverSigner(ethSignedMessageHash, signature);
            if (recoveredSigner != gatewaySigner) {
                revert InvalidSignature();
            }
        }
        
        // Emit event for indexing
        emit ContenthashResolved(bytes32(0), contenthash);
        
        // Return the contenthash (matches EIP-1577 contenthash() return type)
        return contenthash;
    }
    
    // =========================================================================
    // Direct Resolution Functions (for compatibility)
    // =========================================================================
    
    /**
     * @notice Direct contenthash query - triggers CCIP-Read
     * @dev For clients that call contenthash(bytes32) directly
     * @param node The namehash of the domain
     */
    function contenthash(bytes32 node) external view returns (bytes memory) {
        if (gatewayURLs.length == 0) revert NoGatewayURLs();
        
        bytes memory data = abi.encodeWithSelector(this.contenthash.selector, node);
        
        revert OffchainLookup(
            address(this),
            gatewayURLs,
            data,
            this.resolveWithProof.selector,
            data
        );
    }
    
    /**
     * @notice Direct addr query - triggers CCIP-Read
     * @dev For clients that call addr(bytes32) directly
     * @param node The namehash of the domain
     */
    function addr(bytes32 node) external view returns (address) {
        if (gatewayURLs.length == 0) revert NoGatewayURLs();
        
        bytes memory data = abi.encodeWithSelector(this.addr.selector, node);
        
        revert OffchainLookup(
            address(this),
            gatewayURLs,
            data,
            this.resolveAddrWithProof.selector,
            data
        );
    }
    
    /**
     * @notice Callback for addr resolution
     * @param response Gateway response
     * @param extraData Original data
     */
    function resolveAddrWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        returns (address)
    {
        // Decode address from response (gateway can return owner address)
        (address resolvedAddr, uint64 expiry, bytes memory signature) = 
            abi.decode(response, (address, uint64, bytes));
        
        // Check expiry
        if (block.timestamp > expiry) {
            revert ResponseExpired(expiry, block.timestamp);
        }
        
        // Verify signature if required
        if (requireSignature && signature.length > 0) {
            bytes32 messageHash = keccak256(
                abi.encodePacked(
                    keccak256(extraData),
                    resolvedAddr,
                    expiry
                )
            );
            
            bytes32 ethSignedMessageHash = keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
            );
            
            address recoveredSigner = recoverSigner(ethSignedMessageHash, signature);
            if (recoveredSigner != gatewaySigner) {
                revert InvalidSignature();
            }
        }
        
        return resolvedAddr;
    }
    
    // =========================================================================
    // Signature Verification
    // =========================================================================
    
    /**
     * @notice Recover signer address from signature
     * @param hash Message hash
     * @param signature ECDSA signature
     * @return Recovered signer address
     */
    function recoverSigner(bytes32 hash, bytes memory signature) 
        internal 
        pure 
        returns (address) 
    {
        if (signature.length != 65) return address(0);
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        
        // Version compatibility
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);
        
        return ecrecover(hash, v, r, s);
    }
    
    // =========================================================================
    // Admin Functions
    // =========================================================================
    
    /**
     * @notice Update gateway URLs
     * @param _urls New array of gateway URLs
     */
    function setGatewayURLs(string[] calldata _urls) external onlyOwner {
        gatewayURLs = _urls;
        emit GatewayURLsUpdated(_urls);
    }
    
    /**
     * @notice Add a gateway URL
     * @param _url Gateway URL to add
     */
    function addGatewayURL(string calldata _url) external onlyOwner {
        gatewayURLs.push(_url);
        emit GatewayURLsUpdated(gatewayURLs);
    }
    
    /**
     * @notice Update gateway signer
     * @param _signer New signer address
     */
    function setGatewaySigner(address _signer) external onlyOwner {
        address oldSigner = gatewaySigner;
        gatewaySigner = _signer;
        emit GatewaySignerUpdated(oldSigner, _signer);
    }
    
    /**
     * @notice Enable/disable signature verification
     * @param _required Whether signatures are required
     */
    function setRequireSignature(bool _required) external onlyOwner {
        requireSignature = _required;
        emit SignatureRequirementUpdated(_required);
    }
    
    /**
     * @notice Update response validity period
     * @param _period New validity period in seconds
     */
    function setResponseValidityPeriod(uint256 _period) external onlyOwner {
        responseValidityPeriod = _period;
    }
    
    // =========================================================================
    // View Functions
    // =========================================================================
    
    /**
     * @notice Get all gateway URLs
     * @return Array of gateway URLs
     */
    function getGatewayURLs() external view returns (string[] memory) {
        return gatewayURLs;
    }
    
    /**
     * @notice Get number of gateway URLs
     * @return Count of gateway URLs
     */
    function gatewayURLCount() external view returns (uint256) {
        return gatewayURLs.length;
    }
}
