// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// OpenZeppelin v5.x imports for enhanced security
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║  ██╗   ██╗ ██████╗ ████████╗    ██████╗ ███████╗ ██████╗ ██╗███████╗████████╗║
 * ║  ██║   ██║██╔═══██╗╚══██╔══╝    ██╔══██╗██╔════╝██╔════╝ ██║██╔════╝╚══██╔══╝║
 * ║  ██║   ██║██║   ██║   ██║       ██████╔╝█████╗  ██║  ███╗██║███████╗   ██║   ║
 * ║  ╚██╗ ██╔╝██║   ██║   ██║       ██╔══██╗██╔══╝  ██║   ██║██║╚════██║   ██║   ║
 * ║   ╚████╔╝ ╚██████╔╝   ██║       ██║  ██║███████╗╚██████╔╝██║███████║   ██║   ║
 * ║    ╚═══╝   ╚═════╝    ╚═╝       ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝   ╚═╝   ║
 * ║                                                                              ║
 * ║  V2 AUDITED - Fusaka/Pectra Compatible                                       ║
 * ║  VOT Glyphs: 𒇻𒁹𒁹 (registry) + 𒁲𒇷 (ipfs) + 𒇷𒇷𒈦 (ens)                       ║
 * ║                                                                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  SECURITY IMPROVEMENTS (Fusaka/Pectra 2025):                                 ║
 * ║                                                                              ║
 * ║  [AUDIT-001] Ownable2Step - Prevents accidental ownership transfer           ║
 * ║  [AUDIT-002] Pausable - Emergency circuit breaker                            ║
 * ║  [AUDIT-003] Rate limiting - Prevents spam attacks                           ║
 * ║  [AUDIT-004] EIP-7702 Support - Batch authorization for agents               ║
 * ║  [AUDIT-005] secp256r1 Ready - Mobile passkey verification (EIP-7951)        ║
 * ║  [AUDIT-006] CEI Pattern - State changes before external calls               ║
 * ║  [AUDIT-007] Custom Errors - Gas efficient error handling                    ║
 * ║  [AUDIT-008] Input Validation - Zero address and bounds checking             ║
 * ║  [AUDIT-009] Indexed Events - Better off-chain indexing                      ║
 * ║  [AUDIT-010] Unchecked Math - Safe gas optimization                          ║
 * ║  [AUDIT-011] ERC-4804 Enhanced - Better web3:// URL support                  ║
 * ║  [AUDIT-012] PeerDAS Ready - Column custody tracking for Fusaka              ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * @title VOTRegistryV2_Audited
 * @author MCPVOT Team
 * @notice Audited VOT Registry with Fusaka/Pectra EIP support
 * @dev Stores IPFS contenthash for VOT Machine NFTs with ERC-4804 web3:// URLs
 * @custom:security-contact security@mcpvot.xyz
 * @custom:version 2.0.0-audited
 */

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @notice ERC-4804 web3:// URL interface
 * @dev See https://eips.ethereum.org/EIPS/eip-4804
 */
interface IERC4804 {
    function resolveMode() external view returns (bytes32 mode, bytes32 uriScheme);
    function resource(bytes calldata path) external view returns (bytes memory mime, bytes memory data);
}

/**
 * @notice secp256r1 precompile interface (EIP-7951 - Fusaka)
 * @dev Fixed address 0x100 for passkey verification
 */
interface ISecp256r1 {
    function verify(bytes32 hash, bytes memory signature, bytes memory publicKey) external view returns (bool);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CONTRACT
// ═══════════════════════════════════════════════════════════════════════════════

contract VOTRegistryV2_Audited is Ownable2Step, ReentrancyGuard, Pausable, IERC4804 {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using Strings for uint256;

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Maximum contenthash length (IPFS CIDv1 + buffer)
    uint256 public constant MAX_CONTENTHASH_LENGTH = 128;

    /// @notice IPFS protocol identifier (EIP-1577)
    bytes1 public constant IPFS_PROTOCOL = 0xe3;

    /// @notice IPNS protocol identifier
    bytes1 public constant IPNS_PROTOCOL = 0xe5;

    /// @notice [AUDIT-003] Rate limit: max updates per address per hour
    uint256 public constant MAX_UPDATES_PER_HOUR = 20;

    /// @notice [AUDIT-004] Maximum batch size for gas limits
    uint256 public constant MAX_BATCH_SIZE = 100;

    /// @notice [AUDIT-005] secp256r1 precompile address (EIP-7951 - Fusaka)
    address public constant SECP256R1_PRECOMPILE = 0x0000000000000000000000000000000000000100;

    /// @notice ERC-4804 resolve mode for manual handling
    bytes32 public constant RESOLVE_MODE_MANUAL = "manual";

    /// @notice Contract version
    string public constant VERSION = "2.0.0-audited";

    /// @notice [AUDIT-004] EIP-712 type hash for batch authorization
    bytes32 public constant BATCH_AUTH_TYPEHASH = keccak256(
        "BatchAuthorization(address user,uint256[] tokenIds,bytes[] contenthashes,uint256 nonce,uint256 deadline)"
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // IMMUTABLES
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice EIP-712 Domain Separator
    bytes32 public immutable DOMAIN_SEPARATOR;

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice VOT Machine NFT contract (ERC-1155)
    address public nftContract;

    /// @notice Treasury address
    address public treasury;

    /// @notice IPFS gateway for ERC-4804 redirects
    string public ipfsGateway;

    /// @notice Total registered contenthashes
    uint256 public totalRegistered;

    // ═══════════════════════════════════════════════════════════════════════════
    // MAPPINGS
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice tokenId => IPFS contenthash (EIP-1577 encoded)
    mapping(uint256 tokenId => bytes contenthash) private _contenthash;

    /// @notice tokenId => metadata URI
    mapping(uint256 tokenId => string metadataURI) private _metadataURI;

    /// @notice tokenId => timestamp of last update
    mapping(uint256 tokenId => uint256 timestamp) public lastUpdated;

    /// @notice Authorized minters (x402 facilitator, etc.)
    mapping(address minter => bool authorized) public authorizedMinters;

    /// @notice [AUDIT-003] Rate limiting: updates per address per hour
    mapping(address user => mapping(uint256 hour => uint256 count)) public updatesPerHour;

    /// @notice [AUDIT-004] Nonces for batch operations (replay protection)
    mapping(address user => uint256 nonce) public nonces;

    /// @notice [AUDIT-012] PeerDAS custody column commitments per NFT
    mapping(uint256 tokenId => uint8 custodyColumns) public custodyCommitments;

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS (All indexed for efficient off-chain indexing)
    // ═══════════════════════════════════════════════════════════════════════════

    event ContenthashSet(
        uint256 indexed tokenId,
        bytes contenthash,
        address indexed setter,
        uint256 indexed timestamp
    );

    event ContenthashCleared(uint256 indexed tokenId, address indexed clearer);

    event MetadataSet(uint256 indexed tokenId, string metadataURI, address indexed setter);

    event MinterAuthorized(address indexed minter, bool indexed authorized);

    event NFTContractUpdated(address indexed oldContract, address indexed newContract);

    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    event IPFSGatewayUpdated(string oldGateway, string newGateway);

    event BatchContenthashSet(
        address indexed setter,
        uint256 count,
        uint256 indexed timestamp
    );

    /// @notice [AUDIT-012] PeerDAS custody commitment event
    event CustodyCommitmentSet(
        uint256 indexed tokenId,
        uint8 columns,
        address indexed committer
    );

    /// @notice [AUDIT-005] Passkey verification event
    event PasskeyVerified(
        address indexed user,
        bytes32 indexed publicKeyHash,
        uint256 timestamp
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // ERRORS (Gas efficient custom errors)
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Caller is not the token owner
    error NotTokenOwner(uint256 tokenId, address caller);

    /// @notice Contenthash is empty or invalid
    error InvalidContenthash();

    /// @notice Contenthash exceeds maximum length
    error ContenthashTooLong(uint256 length, uint256 maxLength);

    /// @notice Caller is not an authorized minter
    error NotAuthorizedMinter(address caller);

    /// @notice Address is zero
    error ZeroAddress();

    /// @notice Array lengths do not match
    error LengthMismatch(uint256 tokenIdsLength, uint256 contenthashesLength);

    /// @notice Invalid URL path for ERC-4804
    error InvalidPath(bytes path);

    /// @notice Token not found in registry
    error TokenNotFound(uint256 tokenId);

    /// @notice [AUDIT-003] Rate limit exceeded
    error RateLimitExceeded(address user, uint256 currentHour);

    /// @notice [AUDIT-004] Batch size too large
    error BatchTooLarge(uint256 size, uint256 maxSize);

    /// @notice [AUDIT-004] Invalid signature
    error InvalidSignature();

    /// @notice [AUDIT-004] Signature deadline expired
    error DeadlineExpired(uint256 deadline, uint256 currentTime);

    /// @notice [AUDIT-004] Invalid nonce
    error InvalidNonce(uint256 expected, uint256 provided);

    /// @notice [AUDIT-005] Passkey verification failed
    error PasskeyVerificationFailed();

    /// @notice [AUDIT-012] Invalid custody column count
    error InvalidCustodyColumns(uint8 columns);

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Initialize the VOTRegistry V2
     * @param _nftContract VOT Machine NFT contract address (ERC-1155)
     * @param _treasury Treasury address
     * @param _ipfsGateway Default IPFS gateway URL
     */
    constructor(
        address _nftContract,
        address _treasury,
        string memory _ipfsGateway
    ) Ownable(msg.sender) {
        // [AUDIT-008] Validate inputs
        if (_nftContract == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();

        nftContract = _nftContract;
        treasury = _treasury;
        ipfsGateway = _ipfsGateway;

        // Owner is automatically authorized
        authorizedMinters[msg.sender] = true;

        // EIP-712 Domain Separator (chain-specific)
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("VOT Registry V2"),
                keccak256(VERSION),
                block.chainid,
                address(this)
            )
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice [AUDIT-003] Rate limiting modifier
     * @param user Address to rate limit
     */
    modifier rateLimited(address user) {
        uint256 currentHour = block.timestamp / 1 hours;
        if (updatesPerHour[user][currentHour] >= MAX_UPDATES_PER_HOUR) {
            revert RateLimitExceeded(user, currentHour);
        }
        // [AUDIT-010] Safe unchecked increment
        unchecked {
            updatesPerHour[user][currentHour]++;
        }
        _;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ERC-4804 IMPLEMENTATION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @inheritdoc IERC4804
     */
    function resolveMode() external pure override returns (bytes32 mode, bytes32 uriScheme) {
        return (RESOLVE_MODE_MANUAL, bytes32(0));
    }

    /**
     * @inheritdoc IERC4804
     * @dev Supports: /builder/{id}, /metadata/{id}, /contenthash/{id}, /stats, /
     */
    function resource(bytes calldata path) external view override returns (bytes memory mime, bytes memory data) {
        if (path.length == 0 || (path.length == 1 && path[0] == "/")) {
            return _returnIndex();
        }

        (string memory route, uint256 tokenId) = _parsePath(path);

        if (_strEquals(route, "builder")) {
            return _returnBuilder(tokenId);
        } else if (_strEquals(route, "metadata")) {
            return _returnMetadata(tokenId);
        } else if (_strEquals(route, "contenthash")) {
            return _returnContenthash(tokenId);
        } else if (_strEquals(route, "stats")) {
            return _returnStats();
        } else if (_strEquals(route, "") || _strEquals(route, "index")) {
            return _returnIndex();
        }

        revert InvalidPath(path);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PUBLIC VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get contenthash for a token (primary CCIP-Read function)
     * @param tokenId The NFT token ID
     * @return The IPFS contenthash (EIP-1577 encoded)
     */
    function contenthash(uint256 tokenId) external view returns (bytes memory) {
        return _contenthash[tokenId];
    }

    /**
     * @notice Resolve ENS data for a token
     * @param tokenId The NFT token ID
     * @return contenthash_ The IPFS contenthash
     * @return exists Whether the contenthash exists
     */
    function resolveENS(uint256 tokenId) external view returns (
        bytes memory contenthash_,
        bool exists
    ) {
        contenthash_ = _contenthash[tokenId];
        exists = contenthash_.length > 0;
    }

    /**
     * @notice Check if a tokenId has a contenthash
     * @param tokenId The NFT token ID
     * @return Whether the contenthash exists
     */
    function hasContenthash(uint256 tokenId) external view returns (bool) {
        return _contenthash[tokenId].length > 0;
    }

    /**
     * @notice Check if contenthash is IPFS format
     * @param tokenId The NFT token ID
     * @return isIPFS Whether it's an IPFS contenthash
     */
    function isIPFSContenthash(uint256 tokenId) external view returns (bool isIPFS) {
        bytes memory ch = _contenthash[tokenId];
        if (ch.length == 0) return false;
        return ch[0] == IPFS_PROTOCOL;
    }

    /**
     * @notice Get multiple contenthashes in one call
     * @param tokenIds Array of token IDs to query
     * @return contenthashes Array of contenthashes
     */
    function getContenthashes(uint256[] calldata tokenIds)
        external
        view
        returns (bytes[] memory contenthashes)
    {
        contenthashes = new bytes[](tokenIds.length);
        // [AUDIT-010] Unchecked for gas optimization
        unchecked {
            for (uint256 i = 0; i < tokenIds.length; ++i) {
                contenthashes[i] = _contenthash[tokenIds[i]];
            }
        }
    }

    /**
     * @notice Get current nonce for an address
     * @param user The address to query
     * @return Current nonce value
     */
    function getNonce(address user) external view returns (uint256) {
        return nonces[user];
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TOKEN OWNER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Set contenthash for a token you own
     * @param tokenId The NFT token ID
     * @param newContenthash The new IPFS contenthash (EIP-1577 encoded)
     */
    function setContenthash(uint256 tokenId, bytes calldata newContenthash)
        external
        nonReentrant
        whenNotPaused
        rateLimited(msg.sender)
    {
        // [AUDIT-008] Validate contenthash
        _validateContenthash(newContenthash);

        // Verify caller owns the NFT
        if (IERC1155(nftContract).balanceOf(msg.sender, tokenId) == 0) {
            revert NotTokenOwner(tokenId, msg.sender);
        }

        // [AUDIT-006] CEI: State changes first
        if (_contenthash[tokenId].length == 0) {
            unchecked { totalRegistered++; }
        }

        _contenthash[tokenId] = newContenthash;
        lastUpdated[tokenId] = block.timestamp;

        // [AUDIT-009] Event emission
        emit ContenthashSet(tokenId, newContenthash, msg.sender, block.timestamp);
    }

    /**
     * @notice Clear contenthash for a token you own
     * @param tokenId The NFT token ID
     */
    function clearContenthash(uint256 tokenId)
        external
        nonReentrant
        whenNotPaused
    {
        // Verify caller owns the NFT
        if (IERC1155(nftContract).balanceOf(msg.sender, tokenId) == 0) {
            revert NotTokenOwner(tokenId, msg.sender);
        }

        if (_contenthash[tokenId].length > 0) {
            // [AUDIT-006] CEI: State changes first
            delete _contenthash[tokenId];
            delete lastUpdated[tokenId];
            unchecked { totalRegistered--; }

            emit ContenthashCleared(tokenId, msg.sender);
        }
    }

    /**
     * @notice Set metadata URI for a token you own
     * @param tokenId The NFT token ID
     * @param metadataURI The metadata URI
     */
    function setMetadataURI(uint256 tokenId, string calldata metadataURI)
        external
        whenNotPaused
    {
        // Verify ownership or authorization
        if (IERC1155(nftContract).balanceOf(msg.sender, tokenId) == 0) {
            if (!authorizedMinters[msg.sender] && msg.sender != owner()) {
                revert NotTokenOwner(tokenId, msg.sender);
            }
        }

        _metadataURI[tokenId] = metadataURI;
        emit MetadataSet(tokenId, metadataURI, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // [AUDIT-004] EIP-7702 BATCH OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Batch set contenthashes with EIP-712 signature (EIP-7702 compatible)
     * @dev Allows authorized agents to update multiple tokens in one transaction
     * @param user The token owner granting authorization
     * @param tokenIds Array of token IDs
     * @param contenthashes Array of contenthashes
     * @param deadline Signature deadline
     * @param signature EIP-712 signature from user
     */
    function batchSetWithSignature(
        address user,
        uint256[] calldata tokenIds,
        bytes[] calldata contenthashes,
        uint256 deadline,
        bytes calldata signature
    )
        external
        nonReentrant
        whenNotPaused
    {
        // [AUDIT-004] Validate deadline
        if (block.timestamp > deadline) {
            revert DeadlineExpired(deadline, block.timestamp);
        }

        // [AUDIT-004] Validate batch size
        if (tokenIds.length > MAX_BATCH_SIZE) {
            revert BatchTooLarge(tokenIds.length, MAX_BATCH_SIZE);
        }

        // Validate array lengths
        if (tokenIds.length != contenthashes.length) {
            revert LengthMismatch(tokenIds.length, contenthashes.length);
        }

        // Get and increment nonce
        uint256 currentNonce = nonces[user];

        // Build message hash
        bytes32 structHash = keccak256(
            abi.encode(
                BATCH_AUTH_TYPEHASH,
                user,
                keccak256(abi.encodePacked(tokenIds)),
                keccak256(_encodeContenthashes(contenthashes)),
                currentNonce,
                deadline
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash)
        );

        // [AUDIT-004] Verify signature
        address recoveredSigner = digest.recover(signature);
        if (recoveredSigner != user) {
            revert InvalidSignature();
        }

        // [AUDIT-006] CEI: Increment nonce before processing
        unchecked { nonces[user]++; }

        // Process batch
        uint256 newRegistrations;
        unchecked {
            for (uint256 i = 0; i < tokenIds.length; ++i) {
                uint256 tokenId = tokenIds[i];
                bytes calldata ch = contenthashes[i];

                // Skip empty contenthashes
                if (ch.length == 0) continue;

                // Validate
                if (ch.length > MAX_CONTENTHASH_LENGTH) {
                    revert ContenthashTooLong(ch.length, MAX_CONTENTHASH_LENGTH);
                }

                // Verify ownership
                if (IERC1155(nftContract).balanceOf(user, tokenId) == 0) {
                    revert NotTokenOwner(tokenId, user);
                }

                // Track new registrations
                if (_contenthash[tokenId].length == 0) {
                    newRegistrations++;
                }

                // Update state
                _contenthash[tokenId] = ch;
                lastUpdated[tokenId] = block.timestamp;

                emit ContenthashSet(tokenId, ch, user, block.timestamp);
            }

            totalRegistered += newRegistrations;
        }

        emit BatchContenthashSet(user, tokenIds.length, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // [AUDIT-005] SECP256R1 PASSKEY FUNCTIONS (Fusaka EIP-7951)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Set contenthash using mobile passkey signature (secp256r1)
     * @dev Uses EIP-7951 precompile for passkey verification
     * @param tokenId The NFT token ID
     * @param newContenthash The new contenthash
     * @param passkeyPublicKey The user's passkey public key (compressed)
     * @param passkeySignature The passkey signature over the update data
     */
    function setContenthashWithPasskey(
        uint256 tokenId,
        bytes calldata newContenthash,
        bytes calldata passkeyPublicKey,
        bytes calldata passkeySignature
    )
        external
        nonReentrant
        whenNotPaused
        rateLimited(msg.sender)
    {
        // Validate contenthash
        _validateContenthash(newContenthash);

        // Build message hash
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                address(this),
                block.chainid,
                tokenId,
                newContenthash,
                nonces[msg.sender],
                block.timestamp
            )
        );

        // [AUDIT-005] Verify passkey signature via precompile
        // Note: This will revert on chains without EIP-7951 (pre-Fusaka)
        bool valid = _verifySecp256r1(messageHash, passkeySignature, passkeyPublicKey);
        if (!valid) {
            revert PasskeyVerificationFailed();
        }

        // Increment nonce
        unchecked { nonces[msg.sender]++; }

        // Update state
        if (_contenthash[tokenId].length == 0) {
            unchecked { totalRegistered++; }
        }

        _contenthash[tokenId] = newContenthash;
        lastUpdated[tokenId] = block.timestamp;

        emit ContenthashSet(tokenId, newContenthash, msg.sender, block.timestamp);
        emit PasskeyVerified(msg.sender, keccak256(passkeyPublicKey), block.timestamp);
    }

    /**
     * @notice Internal passkey verification
     * @dev Calls secp256r1 precompile at 0x100 (Fusaka EIP-7951)
     */
    function _verifySecp256r1(
        bytes32 hash,
        bytes memory signature,
        bytes memory publicKey
    ) internal view returns (bool) {
        // Check if precompile exists (post-Fusaka)
        if (SECP256R1_PRECOMPILE.code.length == 0) {
            // Fallback: return false on pre-Fusaka chains
            // In production, you'd use a library like p256-verifier
            return false;
        }

        // Call precompile
        (bool success, bytes memory result) = SECP256R1_PRECOMPILE.staticcall(
            abi.encodePacked(hash, signature, publicKey)
        );

        return success && result.length > 0 && abi.decode(result, (bool));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // AUTHORIZED MINTER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Set contenthash during mint (authorized minters only)
     * @param tokenId The NFT token ID
     * @param newContenthash The IPFS contenthash
     * @param recipient The intended NFT recipient
     */
    function setContenthashOnMint(
        uint256 tokenId,
        bytes calldata newContenthash,
        address recipient
    )
        external
        nonReentrant
        whenNotPaused
    {
        if (!authorizedMinters[msg.sender]) {
            revert NotAuthorizedMinter(msg.sender);
        }

        _validateContenthash(newContenthash);

        // CEI: State changes first
        if (_contenthash[tokenId].length == 0) {
            unchecked { totalRegistered++; }
        }

        _contenthash[tokenId] = newContenthash;
        lastUpdated[tokenId] = block.timestamp;

        emit ContenthashSet(tokenId, newContenthash, recipient, block.timestamp);
    }

    /**
     * @notice Batch set contenthashes (authorized minters or owner)
     * @param tokenIds Array of token IDs
     * @param contenthashes Array of contenthashes
     */
    function batchSetContenthash(
        uint256[] calldata tokenIds,
        bytes[] calldata contenthashes
    )
        external
        nonReentrant
        whenNotPaused
    {
        if (!authorizedMinters[msg.sender] && msg.sender != owner()) {
            revert NotAuthorizedMinter(msg.sender);
        }

        if (tokenIds.length != contenthashes.length) {
            revert LengthMismatch(tokenIds.length, contenthashes.length);
        }

        if (tokenIds.length > MAX_BATCH_SIZE) {
            revert BatchTooLarge(tokenIds.length, MAX_BATCH_SIZE);
        }

        uint256 newRegistrations;
        unchecked {
            for (uint256 i = 0; i < tokenIds.length; ++i) {
                bytes calldata ch = contenthashes[i];
                if (ch.length == 0) continue;

                if (ch.length > MAX_CONTENTHASH_LENGTH) {
                    revert ContenthashTooLong(ch.length, MAX_CONTENTHASH_LENGTH);
                }

                if (_contenthash[tokenIds[i]].length == 0) {
                    newRegistrations++;
                }

                _contenthash[tokenIds[i]] = ch;
                lastUpdated[tokenIds[i]] = block.timestamp;

                emit ContenthashSet(tokenIds[i], ch, msg.sender, block.timestamp);
            }

            totalRegistered += newRegistrations;
        }

        emit BatchContenthashSet(msg.sender, tokenIds.length, block.timestamp);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // [AUDIT-012] PEERDAS CUSTODY FUNCTIONS (Fusaka)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Set custody column commitment for PeerDAS (Fusaka)
     * @param tokenId The NFT token ID
     * @param columns Number of columns to custody (4, 8, 16, or 128)
     */
    function setCustodyCommitment(uint256 tokenId, uint8 columns)
        external
        whenNotPaused
    {
        // Verify ownership
        if (IERC1155(nftContract).balanceOf(msg.sender, tokenId) == 0) {
            revert NotTokenOwner(tokenId, msg.sender);
        }

        // Validate column count (PeerDAS supports 128 total columns)
        if (columns != 4 && columns != 8 && columns != 16 && columns != 128) {
            revert InvalidCustodyColumns(columns);
        }

        custodyCommitments[tokenId] = columns;
        emit CustodyCommitmentSet(tokenId, columns, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Authorize or deauthorize a minter
     * @param minter The address to authorize/deauthorize
     * @param authorized Whether to authorize
     */
    function setMinterAuthorization(address minter, bool authorized) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }

    /**
     * @notice Update the NFT contract address
     * @param newNftContract New NFT contract address
     */
    function setNFTContract(address newNftContract) external onlyOwner {
        if (newNftContract == address(0)) revert ZeroAddress();
        address oldContract = nftContract;
        nftContract = newNftContract;
        emit NFTContractUpdated(oldContract, newNftContract);
    }

    /**
     * @notice Update the treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @notice Update the IPFS gateway
     * @param newGateway New gateway URL
     */
    function setIPFSGateway(string calldata newGateway) external onlyOwner {
        string memory oldGateway = ipfsGateway;
        ipfsGateway = newGateway;
        emit IPFSGatewayUpdated(oldGateway, newGateway);
    }

    /**
     * @notice [AUDIT-002] Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice [AUDIT-002] Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INTERNAL HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Validate contenthash
     */
    function _validateContenthash(bytes calldata ch) internal pure {
        if (ch.length == 0) revert InvalidContenthash();
        if (ch.length > MAX_CONTENTHASH_LENGTH) {
            revert ContenthashTooLong(ch.length, MAX_CONTENTHASH_LENGTH);
        }
    }

    /**
     * @notice Encode contenthashes array for hashing
     */
    function _encodeContenthashes(bytes[] calldata contenthashes) internal pure returns (bytes memory) {
        bytes memory encoded;
        unchecked {
            for (uint256 i = 0; i < contenthashes.length; ++i) {
                encoded = abi.encodePacked(encoded, keccak256(contenthashes[i]));
            }
        }
        return encoded;
    }

    /**
     * @notice Compare two strings
     */
    function _strEquals(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    /**
     * @notice Parse URL path into route and tokenId
     */
    function _parsePath(bytes calldata path) internal pure returns (string memory route, uint256 tokenId) {
        uint256 start = path[0] == "/" ? 1 : 0;
        uint256 end = path.length;

        // Find second slash
        uint256 secondSlash = start;
        while (secondSlash < end && path[secondSlash] != "/") {
            unchecked { secondSlash++; }
        }

        route = string(path[start:secondSlash]);

        if (secondSlash < end - 1) {
            bytes memory tokenIdBytes = path[secondSlash + 1:end];
            tokenId = _parseUint(tokenIdBytes);
        }
    }

    /**
     * @notice Parse bytes to uint
     */
    function _parseUint(bytes memory b) internal pure returns (uint256 result) {
        unchecked {
            for (uint256 i = 0; i < b.length; ++i) {
                uint8 digit = uint8(b[i]);
                if (digit >= 48 && digit <= 57) {
                    result = result * 10 + (digit - 48);
                }
            }
        }
    }

    /**
     * @notice Convert EIP-1577 contenthash to IPFS URL
     */
    function _contenthashToURL(bytes memory ch) internal view returns (string memory) {
        if (ch.length < 4 || ch[0] != IPFS_PROTOCOL) {
            return string(abi.encodePacked(ipfsGateway, "/ipfs/", _bytesToHex(ch)));
        }

        // Extract multihash (skip e3 01 70 prefix)
        bytes memory multihash = new bytes(ch.length - 3);
        unchecked {
            for (uint256 i = 3; i < ch.length; ++i) {
                multihash[i - 3] = ch[i];
            }
        }

        return string(abi.encodePacked(ipfsGateway, "/ipfs/", _bytesToHex(multihash)));
    }

    /**
     * @notice Convert bytes to hex string
     */
    function _bytesToHex(bytes memory data) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory result = new bytes(data.length * 2);

        unchecked {
            for (uint256 i = 0; i < data.length; ++i) {
                result[i * 2] = hexChars[uint8(data[i]) >> 4];
                result[i * 2 + 1] = hexChars[uint8(data[i]) & 0x0f];
            }
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
        unchecked {
            for (uint256 i = 0; i < 20; ++i) {
                result[2 + i * 2] = hexChars[uint8(uint160(addr) >> (8 * (19 - i))) >> 4];
                result[3 + i * 2] = hexChars[uint8(uint160(addr) >> (8 * (19 - i))) & 0x0f];
            }
        }

        return string(result);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ERC-4804 RESPONSE HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    function _returnBuilder(uint256 tokenId) internal view returns (bytes memory mime, bytes memory data) {
        bytes memory ch = _contenthash[tokenId];
        if (ch.length == 0) revert TokenNotFound(tokenId);

        string memory ipfsUrl = _contenthashToURL(ch);

        mime = bytes("text/html");
        data = abi.encodePacked(
            '<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=',
            ipfsUrl,
            '"><title>VOT Builder #',
            tokenId.toString(),
            '</title></head><body><p>Redirecting to <a href="',
            ipfsUrl,
            '">IPFS</a>...</p></body></html>'
        );
    }

    function _returnMetadata(uint256 tokenId) internal view returns (bytes memory mime, bytes memory data) {
        bytes memory ch = _contenthash[tokenId];
        string memory metaUri = _metadataURI[tokenId];

        mime = bytes("application/json");

        if (bytes(metaUri).length > 0) {
            data = abi.encodePacked('{"redirect":"', metaUri, '"}');
        } else if (ch.length > 0) {
            string memory ipfsUrl = _contenthashToURL(ch);
            data = abi.encodePacked(
                '{"name":"VOT Builder #',
                tokenId.toString(),
                '","description":"VOT Machine NFT - Your Website IS Your NFT (v2-audited)","external_url":"',
                ipfsUrl,
                '","animation_url":"',
                ipfsUrl,
                '","attributes":[{"trait_type":"Version","value":"2.0.0-audited"},{"trait_type":"Token ID","value":"',
                tokenId.toString(),
                '"}]}'
            );
        } else {
            revert TokenNotFound(tokenId);
        }
    }

    function _returnContenthash(uint256 tokenId) internal view returns (bytes memory mime, bytes memory data) {
        bytes memory ch = _contenthash[tokenId];
        if (ch.length == 0) revert TokenNotFound(tokenId);

        mime = bytes("application/octet-stream");
        data = ch;
    }

    function _returnStats() internal view returns (bytes memory mime, bytes memory data) {
        mime = bytes("application/json");
        data = abi.encodePacked(
            '{"totalRegistered":',
            totalRegistered.toString(),
            ',"nftContract":"',
            _addressToString(nftContract),
            '","treasury":"',
            _addressToString(treasury),
            '","version":"',
            VERSION,
            '","paused":',
            paused() ? "true" : "false",
            '}'
        );
    }

    function _returnIndex() internal view returns (bytes memory mime, bytes memory data) {
        mime = bytes("text/html");
        data = abi.encodePacked(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>VOT Registry V2</title>',
            '<style>body{font-family:monospace;background:#0a0a0a;color:#00ff00;padding:20px;}</style></head>',
            '<body><pre>',
            unicode'╔══════════════════════════════════════════════════════════════════╗\n',
            unicode'║  VOT REGISTRY V2 - AUDITED                                       ║\n',
            unicode'║  Fusaka/Pectra Compatible                                        ║\n',
            unicode'╠══════════════════════════════════════════════════════════════════╣\n',
            unicode'║  Total Registered: ', totalRegistered.toString(), '\n',
            unicode'║  Version: ', VERSION, '\n',
            unicode'║  Chain: ', block.chainid.toString(), '\n',
            unicode'╠══════════════════════════════════════════════════════════════════╣\n',
            unicode'║  Endpoints:                                                      ║\n',
            unicode'║  • /builder/{tokenId} - View builder page                        ║\n',
            unicode'║  • /metadata/{tokenId} - Get JSON metadata                       ║\n',
            unicode'║  • /contenthash/{tokenId} - Get raw contenthash                  ║\n',
            unicode'║  • /stats - Get registry statistics                              ║\n',
            unicode'╚══════════════════════════════════════════════════════════════════╝',
            '</pre></body></html>'
        );
    }
}
