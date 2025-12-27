// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title IVOTERC4804
 * @notice Interface for ERC-4804 web3:// URL support
 * @dev See https://eips.ethereum.org/EIPS/eip-4804
 */
interface IERC4804 {
    /**
     * @notice Determines the resolution mode for web3:// requests
     * @return mode The resolve mode: "auto", "manual", or a resource type like "5219"
     * @return uriScheme The URI scheme if mode is not "auto" (e.g., "ipfs://")
     */
    function resolveMode() external view returns (bytes32 mode, bytes32 uriScheme);
    
    /**
     * @notice Returns the resource for a web3:// URL path
     * @param path The URL path (e.g., "/builder/180")
     * @return mime MIME type (e.g., "text/html")
     * @return data The resource content
     */
    function resource(bytes calldata path) external view returns (bytes memory mime, bytes memory data);
}

/**
 * @title VOTRegistryERC4804
 * @author MCPVOT Team
 * @notice VOT Registry with ERC-4804 web3:// URL support
 * @dev Enables direct access via web3://votregistry.base.eth/builder/{tokenId}
 * 
 * ERC-4804 Architecture:
 * 1. Browser requests: web3://votregistry.base.eth/builder/180
 * 2. web3:// gateway calls resolveMode() → returns "manual"
 * 3. Gateway calls resource("/builder/180") → returns IPFS redirect
 * 4. Content fetched from IPFS and returned to browser
 * 
 * URL Patterns Supported:
 * - /builder/{tokenId} → Returns IPFS HTML page
 * - /metadata/{tokenId} → Returns JSON metadata
 * - /contenthash/{tokenId} → Returns raw contenthash bytes
 * - / → Returns index page with recent mints
 * 
 * @custom:security-contact security@mcpvot.xyz
 */
contract VOTRegistryERC4804 is Ownable, ReentrancyGuard, IERC4804 {
    using Strings for uint256;
    
    // =========================================================================
    // State Variables
    // =========================================================================
    
    /// @notice tokenId => IPFS contenthash (EIP-1577 encoded)
    mapping(uint256 => bytes) private _contenthash;
    
    /// @notice tokenId => JSON metadata URI
    mapping(uint256 => string) private _metadataURI;
    
    /// @notice tokenId => timestamp of last update
    mapping(uint256 => uint256) public lastUpdated;
    
    /// @notice VOT Machine NFT contract (ERC-1155)
    address public nftContract;
    
    /// @notice Treasury address for verification
    address public treasury;
    
    /// @notice Authorized minters (x402 facilitator, etc.)
    mapping(address => bool) public authorizedMinters;
    
    /// @notice Total registered contenthashes
    uint256 public totalRegistered;
    
    /// @notice IPFS gateway for ERC-4804 redirects
    string public ipfsGateway;
    
    /// @notice Base URL for metadata
    string public baseMetadataURL;
    
    // =========================================================================
    // Events
    // =========================================================================
    
    event ContenthashSet(
        uint256 indexed tokenId, 
        bytes contenthash, 
        address indexed setter,
        uint256 timestamp
    );
    
    event MetadataSet(uint256 indexed tokenId, string metadataURI);
    event ContenthashCleared(uint256 indexed tokenId, address indexed clearer);
    event MinterAuthorized(address indexed minter, bool authorized);
    event NFTContractUpdated(address indexed oldContract, address indexed newContract);
    event IPFSGatewayUpdated(string oldGateway, string newGateway);
    
    // =========================================================================
    // Errors
    // =========================================================================
    
    error NotTokenOwner(uint256 tokenId, address caller);
    error InvalidContenthash();
    error ContenthashTooLong(uint256 length, uint256 maxLength);
    error NotAuthorizedMinter(address caller);
    error ZeroAddress();
    error LengthMismatch(uint256 tokenIdsLength, uint256 contenthashesLength);
    error InvalidPath(bytes path);
    error TokenNotFound(uint256 tokenId);
    
    // =========================================================================
    // Constants
    // =========================================================================
    
    /// @notice Maximum contenthash length
    uint256 public constant MAX_CONTENTHASH_LENGTH = 128;
    
    /// @notice IPFS protocol identifier (EIP-1577)
    bytes1 public constant IPFS_PROTOCOL = 0xe3;
    
    /// @notice ERC-4804 resolve mode for manual resource handling
    bytes32 public constant RESOLVE_MODE_MANUAL = "manual";
    
    /// @notice Contract version
    string public constant VERSION = "2.0.0";
    
    // =========================================================================
    // Constructor
    // =========================================================================
    
    constructor(
        address _nftContract, 
        address _treasury,
        string memory _ipfsGateway
    ) Ownable(msg.sender) {
        if (_nftContract == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        
        nftContract = _nftContract;
        treasury = _treasury;
        ipfsGateway = _ipfsGateway;
        baseMetadataURL = "https://mcpvot.xyz/api/nft/metadata/";
        
        authorizedMinters[msg.sender] = true;
    }
    
    // =========================================================================
    // ERC-4804 Implementation
    // =========================================================================
    
    /**
     * @notice Returns the resolve mode for web3:// URL handling
     * @dev "manual" means we implement resource() to handle paths
     * @return mode "manual" for manual resource handling
     * @return uriScheme Empty (not using auto scheme)
     */
    function resolveMode() external pure override returns (bytes32 mode, bytes32 uriScheme) {
        return (RESOLVE_MODE_MANUAL, bytes32(0));
    }
    
    /**
     * @notice Handle web3:// URL paths and return content
     * @dev Supports: /builder/{id}, /metadata/{id}, /contenthash/{id}, /
     * @param path URL path (e.g., "/builder/180")
     * @return mime MIME type
     * @return data Content data
     */
    function resource(bytes calldata path) external view override returns (bytes memory mime, bytes memory data) {
        // Parse path: "/" + route + "/" + tokenId
        if (path.length == 0 || path[0] != "/") {
            // Root path - return index
            return _returnIndex();
        }
        
        // Parse route and tokenId
        (string memory route, uint256 tokenId) = _parsePath(path);
        
        if (_stringsEqual(route, "builder")) {
            return _returnBuilder(tokenId);
        } else if (_stringsEqual(route, "metadata")) {
            return _returnMetadata(tokenId);
        } else if (_stringsEqual(route, "contenthash")) {
            return _returnContenthash(tokenId);
        } else if (_stringsEqual(route, "") || _stringsEqual(route, "index")) {
            return _returnIndex();
        }
        
        revert InvalidPath(path);
    }
    
    /**
     * @notice Return builder page (redirect to IPFS)
     */
    function _returnBuilder(uint256 tokenId) internal view returns (bytes memory mime, bytes memory data) {
        bytes memory ch = _contenthash[tokenId];
        if (ch.length == 0) revert TokenNotFound(tokenId);
        
        // Convert contenthash to IPFS URL
        string memory ipfsUrl = _contenthashToURL(ch);
        
        // Return HTTP redirect
        mime = bytes("text/html");
        data = abi.encodePacked(
            '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=',
            ipfsUrl,
            '"><title>Redirecting to VOT Builder #',
            tokenId.toString(),
            '</title></head><body><p>Redirecting to <a href="',
            ipfsUrl,
            '">IPFS</a>...</p></body></html>'
        );
    }
    
    /**
     * @notice Return metadata JSON
     */
    function _returnMetadata(uint256 tokenId) internal view returns (bytes memory mime, bytes memory data) {
        string memory metaUri = _metadataURI[tokenId];
        bytes memory ch = _contenthash[tokenId];
        
        mime = bytes("application/json");
        
        if (bytes(metaUri).length > 0) {
            // Has custom metadata URI - redirect
            data = abi.encodePacked(
                '{"redirect":"', metaUri, '"}'
            );
        } else if (ch.length > 0) {
            // Generate metadata from contenthash
            string memory ipfsUrl = _contenthashToURL(ch);
            data = abi.encodePacked(
                '{"name":"VOT Builder #',
                tokenId.toString(),
                '","description":"VOT Machine NFT - Your Website IS Your NFT","external_url":"',
                ipfsUrl,
                '","animation_url":"',
                ipfsUrl,
                '","attributes":[{"trait_type":"Type","value":"Builder"},{"trait_type":"Token ID","value":"',
                tokenId.toString(),
                '"}]}'
            );
        } else {
            revert TokenNotFound(tokenId);
        }
    }
    
    /**
     * @notice Return raw contenthash bytes
     */
    function _returnContenthash(uint256 tokenId) internal view returns (bytes memory mime, bytes memory data) {
        bytes memory ch = _contenthash[tokenId];
        if (ch.length == 0) revert TokenNotFound(tokenId);
        
        mime = bytes("application/octet-stream");
        data = ch;
    }
    
    /**
     * @notice Return index page with stats
     */
    function _returnIndex() internal view returns (bytes memory mime, bytes memory data) {
        mime = bytes("text/html");
        data = abi.encodePacked(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>VOT Registry</title>',
            '<style>body{font-family:monospace;background:#000;color:#0f0;padding:20px;}</style></head>',
            '<body><h1>VOT Registry ERC-4804</h1>',
            '<p>Total Registered: ', totalRegistered.toString(), '</p>',
            '<p>NFT Contract: ', _addressToString(nftContract), '</p>',
            '<p>Version: ', VERSION, '</p>',
            '<h2>Endpoints:</h2>',
            '<ul><li>/builder/{tokenId} - View builder page</li>',
            '<li>/metadata/{tokenId} - Get JSON metadata</li>',
            '<li>/contenthash/{tokenId} - Get raw contenthash</li></ul>',
            '</body></html>'
        );
    }
    
    /**
     * @notice Parse URL path into route and tokenId
     */
    function _parsePath(bytes calldata path) internal pure returns (string memory route, uint256 tokenId) {
        // Skip leading "/"
        uint256 start = 1;
        uint256 end = path.length;
        
        // Find route (between first and second "/")
        uint256 secondSlash = start;
        while (secondSlash < end && path[secondSlash] != "/") {
            secondSlash++;
        }
        
        // Extract route
        bytes memory routeBytes = path[start:secondSlash];
        route = string(routeBytes);
        
        // Extract tokenId if present
        if (secondSlash < end - 1) {
            bytes memory tokenIdBytes = path[secondSlash + 1:end];
            tokenId = _parseUint(tokenIdBytes);
        }
    }
    
    /**
     * @notice Parse bytes to uint
     */
    function _parseUint(bytes memory b) internal pure returns (uint256 result) {
        for (uint256 i = 0; i < b.length; i++) {
            uint8 digit = uint8(b[i]);
            if (digit >= 48 && digit <= 57) {
                result = result * 10 + (digit - 48);
            }
        }
    }
    
    /**
     * @notice Convert EIP-1577 contenthash to IPFS gateway URL
     */
    function _contenthashToURL(bytes memory ch) internal view returns (string memory) {
        // EIP-1577 IPFS contenthash format:
        // 0xe3 0x01 0x70 <multihash>
        // We need to decode the multihash to CID
        
        if (ch.length < 4 || ch[0] != 0xe3) {
            // Not IPFS, return raw hex
            return string(abi.encodePacked(ipfsGateway, "/ipfs/", _bytesToHex(ch)));
        }
        
        // Extract multihash (skip e3 01 70 prefix)
        bytes memory multihash = new bytes(ch.length - 3);
        for (uint256 i = 3; i < ch.length; i++) {
            multihash[i - 3] = ch[i];
        }
        
        // For simplicity, return as hex (real impl would use base58/base32)
        return string(abi.encodePacked(ipfsGateway, "/ipfs/", _bytesToHex(multihash)));
    }
    
    /**
     * @notice Convert bytes to hex string
     */
    function _bytesToHex(bytes memory data) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory result = new bytes(data.length * 2);
        
        for (uint256 i = 0; i < data.length; i++) {
            result[i * 2] = hexChars[uint8(data[i]) >> 4];
            result[i * 2 + 1] = hexChars[uint8(data[i]) & 0x0f];
        }
        
        return string(result);
    }
    
    /**
     * @notice Convert address to string
     */
    function _addressToString(address addr) internal pure returns (string memory) {
        bytes memory result = new bytes(42);
        result[0] = "0";
        result[1] = "x";
        
        bytes memory hexChars = "0123456789abcdef";
        for (uint256 i = 0; i < 20; i++) {
            result[2 + i * 2] = hexChars[uint8(uint160(addr) >> (8 * (19 - i))) >> 4];
            result[3 + i * 2] = hexChars[uint8(uint160(addr) >> (8 * (19 - i))) & 0x0f];
        }
        
        return string(result);
    }
    
    /**
     * @notice Compare two strings
     */
    function _stringsEqual(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
    
    // =========================================================================
    // Public Functions (same as VOTRegistry)
    // =========================================================================
    
    function contenthash(uint256 tokenId) external view returns (bytes memory) {
        return _contenthash[tokenId];
    }
    
    function resolveENS(uint256 tokenId) external view returns (
        bytes memory contenthash_,
        bool exists
    ) {
        contenthash_ = _contenthash[tokenId];
        exists = contenthash_.length > 0;
    }
    
    function hasContenthash(uint256 tokenId) external view returns (bool) {
        return _contenthash[tokenId].length > 0;
    }
    
    function setContenthash(uint256 tokenId, bytes calldata _newContenthash) 
        external 
        nonReentrant 
    {
        if (_newContenthash.length == 0) revert InvalidContenthash();
        if (_newContenthash.length > MAX_CONTENTHASH_LENGTH) {
            revert ContenthashTooLong(_newContenthash.length, MAX_CONTENTHASH_LENGTH);
        }
        
        if (IERC1155(nftContract).balanceOf(msg.sender, tokenId) == 0) {
            revert NotTokenOwner(tokenId, msg.sender);
        }
        
        if (_contenthash[tokenId].length == 0) {
            totalRegistered++;
        }
        
        _contenthash[tokenId] = _newContenthash;
        lastUpdated[tokenId] = block.timestamp;
        
        emit ContenthashSet(tokenId, _newContenthash, msg.sender, block.timestamp);
    }
    
    function setContenthashOnMint(
        uint256 tokenId, 
        bytes calldata _newContenthash,
        address recipient
    ) external nonReentrant {
        if (!authorizedMinters[msg.sender]) {
            revert NotAuthorizedMinter(msg.sender);
        }
        
        if (_newContenthash.length == 0) revert InvalidContenthash();
        if (_newContenthash.length > MAX_CONTENTHASH_LENGTH) {
            revert ContenthashTooLong(_newContenthash.length, MAX_CONTENTHASH_LENGTH);
        }
        
        if (_contenthash[tokenId].length == 0) {
            totalRegistered++;
        }
        
        _contenthash[tokenId] = _newContenthash;
        lastUpdated[tokenId] = block.timestamp;
        
        emit ContenthashSet(tokenId, _newContenthash, recipient, block.timestamp);
    }
    
    function setMetadataURI(uint256 tokenId, string calldata metadataURI) external {
        if (IERC1155(nftContract).balanceOf(msg.sender, tokenId) == 0) {
            if (!authorizedMinters[msg.sender] && msg.sender != owner()) {
                revert NotTokenOwner(tokenId, msg.sender);
            }
        }
        
        _metadataURI[tokenId] = metadataURI;
        emit MetadataSet(tokenId, metadataURI);
    }
    
    function batchSetContenthash(
        uint256[] calldata tokenIds,
        bytes[] calldata contenthashes
    ) external nonReentrant {
        if (!authorizedMinters[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedMinter(msg.sender);
        }
        
        if (tokenIds.length != contenthashes.length) {
            revert LengthMismatch(tokenIds.length, contenthashes.length);
        }
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            bytes calldata ch = contenthashes[i];
            
            if (ch.length == 0) continue;
            if (ch.length > MAX_CONTENTHASH_LENGTH) {
                revert ContenthashTooLong(ch.length, MAX_CONTENTHASH_LENGTH);
            }
            
            if (_contenthash[tokenIds[i]].length == 0) {
                totalRegistered++;
            }
            
            _contenthash[tokenIds[i]] = ch;
            lastUpdated[tokenIds[i]] = block.timestamp;
            
            emit ContenthashSet(tokenIds[i], ch, msg.sender, block.timestamp);
        }
    }
    
    // =========================================================================
    // Admin Functions
    // =========================================================================
    
    function setMinterAuthorization(address minter, bool authorized) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }
    
    function setNFTContract(address _newNftContract) external onlyOwner {
        if (_newNftContract == address(0)) revert ZeroAddress();
        address oldContract = nftContract;
        nftContract = _newNftContract;
        emit NFTContractUpdated(oldContract, _newNftContract);
    }
    
    function setIPFSGateway(string calldata _gateway) external onlyOwner {
        string memory oldGateway = ipfsGateway;
        ipfsGateway = _gateway;
        emit IPFSGatewayUpdated(oldGateway, _gateway);
    }
    
    function setBaseMetadataURL(string calldata _url) external onlyOwner {
        baseMetadataURL = _url;
    }
    
    // =========================================================================
    // View Functions
    // =========================================================================
    
    function getContenthashes(uint256[] calldata tokenIds) 
        external 
        view 
        returns (bytes[] memory contenthashes) 
    {
        contenthashes = new bytes[](tokenIds.length);
        for (uint256 i = 0; i < tokenIds.length; i++) {
            contenthashes[i] = _contenthash[tokenIds[i]];
        }
    }
    
    function isIPFSContenthash(uint256 tokenId) external view returns (bool) {
        bytes memory ch = _contenthash[tokenId];
        if (ch.length == 0) return false;
        return ch[0] == IPFS_PROTOCOL;
    }
    
    /**
     * @notice Supports ERC-165 interface detection
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == type(IERC4804).interfaceId ||
               interfaceId == 0x01ffc9a7; // ERC-165
    }
}
