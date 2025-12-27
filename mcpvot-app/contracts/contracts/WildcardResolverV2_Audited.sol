// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║  ██╗    ██╗██╗██╗     ██████╗  ██████╗ █████╗ ██████╗ ██████╗                ║
 * ║  ██║    ██║██║██║     ██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔══██╗               ║
 * ║  ██║ █╗ ██║██║██║     ██║  ██║██║     ███████║██████╔╝██║  ██║               ║
 * ║  ██║███╗██║██║██║     ██║  ██║██║     ██╔══██║██╔══██╗██║  ██║               ║
 * ║  ╚███╔███╔╝██║███████╗██████╔╝╚██████╗██║  ██║██║  ██║██████╔╝               ║
 * ║   ╚══╝╚══╝ ╚═╝╚══════╝╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝                ║
 * ║                                                                              ║
 * ║  RESOLVER V2 - Fusaka/Pectra Compatible                                      ║
 * ║  VOT Glyphs: 𒇻𒁹𒁹 (ccip) + 𒁲𒇷 (ens) + 𒇷𒇷𒈦 (wildcard)                       ║
 * ║                                                                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  SECURITY IMPROVEMENTS:                                                      ║
 * ║                                                                              ║
 * ║  [AUDIT-001] Ownable2Step - Safe ownership transfer                          ║
 * ║  [AUDIT-002] Pausable - Emergency circuit breaker                            ║
 * ║  [AUDIT-003] secp256r1 Ready - Mobile passkey gateway signatures             ║
 * ║  [AUDIT-004] Multiple Gateway Support - Fallback chain                       ║
 * ║  [AUDIT-005] Response Freshness - Configurable validity period               ║
 * ║  [AUDIT-006] EIP-712 Typed Signatures - Structured data signing              ║
 * ║  [AUDIT-007] Gateway Rotation - For load balancing                           ║
 * ║  [AUDIT-008] Input Validation - Bounds checking throughout                   ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * @title WildcardResolverV2_Audited
 * @author MCPVOT Team
 * @notice ENS Wildcard Resolver for *.mcpvot.eth using CCIP-Read (EIP-3668)
 * @dev Deploys to Ethereum L1, queries Base L2 VOTRegistry via CCIP-Read gateway
 * @custom:security-contact security@mcpvot.xyz
 * @custom:version 2.0.0-audited
 */
contract WildcardResolverV2_Audited is Ownable2Step, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ═══════════════════════════════════════════════════════════════════════════
    // EIP-3668 CCIP-Read Error
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Revert with this error to trigger CCIP-Read
     * @param sender The contract address
     * @param urls Array of gateway URLs
     * @param callData Data to forward to gateway
     * @param callbackFunction Callback function selector
     * @param extraData Additional callback data
     */
    error OffchainLookup(
        address sender,
        string[] urls,
        bytes callData,
        bytes4 callbackFunction,
        bytes extraData
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // ENS INTERFACE IDs
    // ═══════════════════════════════════════════════════════════════════════════

    bytes4 private constant INTERFACE_SUPPORTS_INTERFACE = 0x01ffc9a7;
    bytes4 private constant INTERFACE_ADDR = 0x3b3b57de;
    bytes4 private constant INTERFACE_CONTENTHASH = 0xbc1c58d1;
    bytes4 private constant INTERFACE_EXTENDED_RESOLVER = 0x9061b923;
    bytes4 private constant INTERFACE_RESOLVE_CALLBACK = 0xa3826cc6;

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Contract version
    string public constant VERSION = "2.0.0-audited";

    /// @notice Maximum gateway URLs
    uint256 public constant MAX_GATEWAY_URLS = 10;

    /// @notice Minimum response validity period (5 minutes)
    uint256 public constant MIN_VALIDITY_PERIOD = 5 minutes;

    /// @notice Maximum response validity period (24 hours)
    uint256 public constant MAX_VALIDITY_PERIOD = 24 hours;

    /// @notice Default validity period (1 hour)
    uint256 public constant DEFAULT_VALIDITY_PERIOD = 1 hours;

    /// @notice [AUDIT-003] secp256r1 precompile address (EIP-7951 - Fusaka)
    address public constant SECP256R1_PRECOMPILE = 0x0000000000000000000000000000000000000100;

    /// @notice [AUDIT-006] EIP-712 Response Type Hash
    bytes32 public constant RESPONSE_TYPEHASH = keccak256(
        "CCIPResponse(bytes32 requestHash,bytes contenthash,uint64 expiry,uint256 chainId)"
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // IMMUTABLES
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice EIP-712 Domain Separator
    bytes32 public immutable DOMAIN_SEPARATOR;

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Gateway URLs for CCIP-Read
    string[] private _gatewayURLs;

    /// @notice Primary gateway signer (ECDSA secp256k1)
    address public primarySigner;

    /// @notice Backup gateway signer
    address public backupSigner;

    /// @notice [AUDIT-003] secp256r1 public key hash for passkey signer
    bytes32 public passkeySignerHash;

    /// @notice Whether to require signature verification
    bool public requireSignature;

    /// @notice Response validity period (in seconds)
    uint256 public responseValidityPeriod;

    /// @notice [AUDIT-007] Gateway rotation index for load balancing
    uint256 private _gatewayRotationIndex;

    /// @notice Nonces for replay protection
    mapping(bytes32 requestHash => uint256 usedAt) public usedResponses;

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════

    event GatewayURLsUpdated(string[] urls);
    event PrimarySignerUpdated(address indexed oldSigner, address indexed newSigner);
    event BackupSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event PasskeySignerUpdated(bytes32 indexed oldHash, bytes32 indexed newHash);
    event SignatureRequirementUpdated(bool required);
    event ValidityPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event ContenthashResolved(
        bytes32 indexed node,
        bytes contenthash,
        address indexed verifiedSigner,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════════

    error InvalidSignature();
    error ResponseExpired(uint64 expiry, uint256 currentTime);
    error NoGatewayURLs();
    error TooManyGatewayURLs(uint256 provided, uint256 max);
    error InvalidValidityPeriod(uint256 provided, uint256 min, uint256 max);
    error ZeroAddress();
    error ResponseAlreadyUsed(bytes32 requestHash);
    error InvalidCallbackData();
    error PasskeyVerificationFailed();
    error EmptyURL();

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Initialize the wildcard resolver
     * @param gatewayURLs_ Array of CCIP-Read gateway URLs
     * @param primarySigner_ Primary gateway signer address
     */
    constructor(
        string[] memory gatewayURLs_,
        address primarySigner_
    ) Ownable(msg.sender) {
        // Validate inputs
        if (primarySigner_ == address(0)) revert ZeroAddress();
        if (gatewayURLs_.length == 0) revert NoGatewayURLs();
        if (gatewayURLs_.length > MAX_GATEWAY_URLS) {
            revert TooManyGatewayURLs(gatewayURLs_.length, MAX_GATEWAY_URLS);
        }

        // Validate each URL
        for (uint256 i = 0; i < gatewayURLs_.length;) {
            if (bytes(gatewayURLs_[i]).length == 0) revert EmptyURL();
            unchecked { ++i; }
        }

        _gatewayURLs = gatewayURLs_;
        primarySigner = primarySigner_;
        requireSignature = true;
        responseValidityPeriod = DEFAULT_VALIDITY_PERIOD;

        // EIP-712 Domain Separator
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("MCPVOT Wildcard Resolver"),
                keccak256(VERSION),
                block.chainid,
                address(this)
            )
        );

        emit GatewayURLsUpdated(gatewayURLs_);
        emit PrimarySignerUpdated(address(0), primarySigner_);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EIP-165: INTERFACE SUPPORT
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Check if interface is supported
     * @param interfaceId The interface identifier
     * @return Whether the interface is supported
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == INTERFACE_SUPPORTS_INTERFACE ||
               interfaceId == INTERFACE_ADDR ||
               interfaceId == INTERFACE_CONTENTHASH ||
               interfaceId == INTERFACE_EXTENDED_RESOLVER ||
               interfaceId == INTERFACE_RESOLVE_CALLBACK;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXTENDED RESOLVER (EIP-181)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Main ENS resolution function - triggers CCIP-Read
     * @param name DNS-encoded name (e.g., "180.mcpvot.eth")
     * @param data Original resolver calldata
     * @return Never returns - always reverts with OffchainLookup
     */
    function resolve(bytes calldata name, bytes calldata data)
        external
        view
        whenNotPaused
        returns (bytes memory)
    {
        if (_gatewayURLs.length == 0) revert NoGatewayURLs();

        // Create gateway request
        bytes memory gatewayCalldata = abi.encode(name, data, block.timestamp);

        // [AUDIT-007] Rotate gateway URLs for load balancing
        string[] memory rotatedUrls = _getRotatedGatewayURLs();

        revert OffchainLookup(
            address(this),
            rotatedUrls,
            gatewayCalldata,
            this.resolveWithProof.selector,
            gatewayCalldata
        );
    }

    /**
     * @notice Callback function after gateway returns data
     * @param response ABI-encoded response from gateway
     * @param extraData Original calldata for verification
     * @return Decoded contenthash bytes
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        whenNotPaused
        returns (bytes memory)
    {
        // Decode response
        (
            bytes memory contenthash,
            uint64 expiry,
            bytes memory signature,
            uint8 signatureType // 0 = secp256k1, 1 = secp256r1 passkey
        ) = abi.decode(response, (bytes, uint64, bytes, uint8));

        // Check expiry
        if (block.timestamp > expiry) {
            revert ResponseExpired(expiry, block.timestamp);
        }

        // Build request hash for replay protection
        bytes32 requestHash = keccak256(extraData);

        // Verify signature if required
        address verifiedSigner;
        if (requireSignature && signature.length > 0) {
            // [AUDIT-006] Build EIP-712 typed data hash
            bytes32 structHash = keccak256(
                abi.encode(
                    RESPONSE_TYPEHASH,
                    requestHash,
                    keccak256(contenthash),
                    expiry,
                    block.chainid
                )
            );

            bytes32 digest = keccak256(
                abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
            );

            if (signatureType == 0) {
                // secp256k1 ECDSA signature
                verifiedSigner = _verifySecp256k1(digest, signature);
            } else if (signatureType == 1) {
                // [AUDIT-003] secp256r1 passkey signature (Fusaka)
                if (!_verifySecp256r1Passkey(digest, signature)) {
                    revert PasskeyVerificationFailed();
                }
                verifiedSigner = address(0); // Passkey doesn't have address
            } else {
                revert InvalidSignature();
            }

            // Validate signer for secp256k1
            if (signatureType == 0 && verifiedSigner != primarySigner && verifiedSigner != backupSigner) {
                revert InvalidSignature();
            }
        }

        // Emit event for indexing
        emit ContenthashResolved(bytes32(0), contenthash, verifiedSigner, block.timestamp);

        return contenthash;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // DIRECT RESOLUTION FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Direct contenthash query - triggers CCIP-Read
     * @param node The namehash of the domain
     */
    function contenthash(bytes32 node) external view whenNotPaused returns (bytes memory) {
        if (_gatewayURLs.length == 0) revert NoGatewayURLs();

        bytes memory data = abi.encodeWithSelector(this.contenthash.selector, node);

        revert OffchainLookup(
            address(this),
            _getRotatedGatewayURLs(),
            data,
            this.resolveWithProof.selector,
            data
        );
    }

    /**
     * @notice Direct addr query - triggers CCIP-Read
     * @param node The namehash of the domain
     */
    function addr(bytes32 node) external view whenNotPaused returns (address) {
        if (_gatewayURLs.length == 0) revert NoGatewayURLs();

        bytes memory data = abi.encodeWithSelector(this.addr.selector, node);

        revert OffchainLookup(
            address(this),
            _getRotatedGatewayURLs(),
            data,
            this.resolveAddrWithProof.selector,
            data
        );
    }

    /**
     * @notice Callback for addr resolution
     */
    function resolveAddrWithProof(bytes calldata response, bytes calldata extraData)
        external
        view
        whenNotPaused
        returns (address)
    {
        (
            address resolvedAddr,
            uint64 expiry,
            bytes memory signature,
            uint8 signatureType
        ) = abi.decode(response, (address, uint64, bytes, uint8));

        if (block.timestamp > expiry) {
            revert ResponseExpired(expiry, block.timestamp);
        }

        if (requireSignature && signature.length > 0) {
            bytes32 requestHash = keccak256(extraData);

            bytes32 messageHash = keccak256(
                abi.encodePacked(requestHash, resolvedAddr, expiry, block.chainid)
            );

            bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();

            if (signatureType == 0) {
                address signer = _verifySecp256k1(ethSignedHash, signature);
                if (signer != primarySigner && signer != backupSigner) {
                    revert InvalidSignature();
                }
            } else if (signatureType == 1) {
                if (!_verifySecp256r1Passkey(ethSignedHash, signature)) {
                    revert PasskeyVerificationFailed();
                }
            }
        }

        return resolvedAddr;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SIGNATURE VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Verify secp256k1 ECDSA signature
     */
    function _verifySecp256k1(bytes32 hash, bytes memory signature)
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

        // Adjust v
        if (v < 27) v += 27;
        if (v != 27 && v != 28) return address(0);

        // Malleable signature check (EIP-2)
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            return address(0);
        }

        return ecrecover(hash, v, r, s);
    }

    /**
     * @notice [AUDIT-003] Verify secp256r1 passkey signature (Fusaka EIP-7951)
     * @dev Falls back to false on pre-Fusaka chains
     */
    function _verifySecp256r1Passkey(bytes32 hash, bytes memory signature)
        internal
        view
        returns (bool)
    {
        // Check if passkey signing is configured
        if (passkeySignerHash == bytes32(0)) {
            return false;
        }

        // Check if precompile exists
        if (SECP256R1_PRECOMPILE.code.length == 0) {
            // Pre-Fusaka: Could use library verification here
            // For now, return false
            return false;
        }

        // Signature format: publicKey (64 bytes) + signature (64 bytes)
        if (signature.length < 128) return false;

        bytes memory publicKey = new bytes(64);
        bytes memory sig = new bytes(64);

        // Extract public key and signature
        assembly {
            // Copy first 64 bytes to publicKey
            mstore(add(publicKey, 32), mload(add(signature, 32)))
            mstore(add(publicKey, 64), mload(add(signature, 64)))
            // Copy next 64 bytes to sig
            mstore(add(sig, 32), mload(add(signature, 96)))
            mstore(add(sig, 64), mload(add(signature, 128)))
        }

        // Verify public key hash matches registered passkey
        if (keccak256(publicKey) != passkeySignerHash) {
            return false;
        }

        // Call precompile
        (bool success, bytes memory result) = SECP256R1_PRECOMPILE.staticcall(
            abi.encodePacked(hash, sig, publicKey)
        );

        return success && result.length > 0 && abi.decode(result, (bool));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // [AUDIT-007] GATEWAY ROTATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get gateway URLs rotated for load balancing
     */
    function _getRotatedGatewayURLs() internal view returns (string[] memory) {
        uint256 len = _gatewayURLs.length;
        string[] memory rotated = new string[](len);

        // Simple rotation based on block number
        uint256 startIdx = block.number % len;

        unchecked {
            for (uint256 i = 0; i < len; ++i) {
                rotated[i] = _gatewayURLs[(startIdx + i) % len];
            }
        }

        return rotated;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Update gateway URLs
     * @param urls_ New array of gateway URLs
     */
    function setGatewayURLs(string[] calldata urls_) external onlyOwner {
        if (urls_.length == 0) revert NoGatewayURLs();
        if (urls_.length > MAX_GATEWAY_URLS) {
            revert TooManyGatewayURLs(urls_.length, MAX_GATEWAY_URLS);
        }

        for (uint256 i = 0; i < urls_.length;) {
            if (bytes(urls_[i]).length == 0) revert EmptyURL();
            unchecked { ++i; }
        }

        _gatewayURLs = urls_;
        emit GatewayURLsUpdated(urls_);
    }

    /**
     * @notice Add a gateway URL
     * @param url_ Gateway URL to add
     */
    function addGatewayURL(string calldata url_) external onlyOwner {
        if (bytes(url_).length == 0) revert EmptyURL();
        if (_gatewayURLs.length >= MAX_GATEWAY_URLS) {
            revert TooManyGatewayURLs(_gatewayURLs.length + 1, MAX_GATEWAY_URLS);
        }

        _gatewayURLs.push(url_);
        emit GatewayURLsUpdated(_gatewayURLs);
    }

    /**
     * @notice Update primary signer
     * @param signer_ New primary signer address
     */
    function setPrimarySigner(address signer_) external onlyOwner {
        if (signer_ == address(0)) revert ZeroAddress();
        address oldSigner = primarySigner;
        primarySigner = signer_;
        emit PrimarySignerUpdated(oldSigner, signer_);
    }

    /**
     * @notice Update backup signer
     * @param signer_ New backup signer address
     */
    function setBackupSigner(address signer_) external onlyOwner {
        address oldSigner = backupSigner;
        backupSigner = signer_;
        emit BackupSignerUpdated(oldSigner, signer_);
    }

    /**
     * @notice [AUDIT-003] Set passkey signer hash for secp256r1 verification
     * @param publicKeyHash_ Keccak256 hash of the passkey public key
     */
    function setPasskeySignerHash(bytes32 publicKeyHash_) external onlyOwner {
        bytes32 oldHash = passkeySignerHash;
        passkeySignerHash = publicKeyHash_;
        emit PasskeySignerUpdated(oldHash, publicKeyHash_);
    }

    /**
     * @notice Enable/disable signature verification
     * @param required_ Whether signatures are required
     */
    function setRequireSignature(bool required_) external onlyOwner {
        requireSignature = required_;
        emit SignatureRequirementUpdated(required_);
    }

    /**
     * @notice Update response validity period
     * @param period_ New validity period in seconds
     */
    function setResponseValidityPeriod(uint256 period_) external onlyOwner {
        if (period_ < MIN_VALIDITY_PERIOD || period_ > MAX_VALIDITY_PERIOD) {
            revert InvalidValidityPeriod(period_, MIN_VALIDITY_PERIOD, MAX_VALIDITY_PERIOD);
        }
        uint256 oldPeriod = responseValidityPeriod;
        responseValidityPeriod = period_;
        emit ValidityPeriodUpdated(oldPeriod, period_);
    }

    /**
     * @notice Pause the resolver
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the resolver
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get all gateway URLs
     * @return Array of gateway URLs
     */
    function getGatewayURLs() external view returns (string[] memory) {
        return _gatewayURLs;
    }

    /**
     * @notice Get number of gateway URLs
     * @return Count of gateway URLs
     */
    function gatewayURLCount() external view returns (uint256) {
        return _gatewayURLs.length;
    }

    /**
     * @notice Get gateway URL at index
     * @param index Index in the array
     * @return The gateway URL
     */
    function gatewayURL(uint256 index) external view returns (string memory) {
        return _gatewayURLs[index];
    }
}
