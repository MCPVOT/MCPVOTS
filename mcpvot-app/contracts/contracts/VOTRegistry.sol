// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VOTRegistry
 * @author MCPVOT Team
 * @notice Stores IPFS contenthash for each VOT Machine NFT on Base L2
 * @dev Used by CCIP-Read gateway for ENS wildcard resolution (*.mcpvot.eth)
 * 
 * Architecture:
 * 1. User mints VOT Builder NFT → gets tokenId
 * 2. HTML page pinned to IPFS → contenthash stored here
 * 3. CCIP-Read Gateway queries this contract for {tokenId}.mcpvot.eth
 * 4. L1 WildcardResolver returns IPFS contenthash to ENS resolver
 * 
 * EIP-1577: Contenthash format
 * - IPFS: 0xe3010170{multihash}
 * - IPNS: 0xe5010170{multihash}
 * - Swarm: 0xe40101{reference}
 * 
 * @custom:security-contact security@mcpvot.xyz
 */
contract VOTRegistry is Ownable, ReentrancyGuard {
    // =========================================================================
    // State Variables
    // =========================================================================
    
    /// @notice tokenId => IPFS contenthash (EIP-1577 encoded)
    mapping(uint256 => bytes) private _contenthash;
    
    /// @notice tokenId => timestamp of last update
    mapping(uint256 => uint256) public lastUpdated;
    
    /// @notice VOT Machine NFT contract (ERC-1155)
    address public nftContract;
    
    /// @notice Treasury address for mint verification
    address public treasury;
    
    /// @notice Authorized minters (x402 facilitator, etc.)
    mapping(address => bool) public authorizedMinters;
    
    /// @notice Total registered contenthashes
    uint256 public totalRegistered;
    
    // =========================================================================
    // Events
    // =========================================================================
    
    event ContenthashSet(
        uint256 indexed tokenId, 
        bytes contenthash, 
        address indexed setter,
        uint256 timestamp
    );
    
    event ContenthashCleared(uint256 indexed tokenId, address indexed clearer);
    event MinterAuthorized(address indexed minter, bool authorized);
    event NFTContractUpdated(address indexed oldContract, address indexed newContract);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    
    // =========================================================================
    // Errors
    // =========================================================================
    
    error NotTokenOwner(uint256 tokenId, address caller);
    error InvalidContenthash();
    error ContenthashTooLong(uint256 length, uint256 maxLength);
    error TokenIdNotMinted(uint256 tokenId);
    error NotAuthorizedMinter(address caller);
    error ZeroAddress();
    error LengthMismatch(uint256 tokenIdsLength, uint256 contenthashesLength);
    
    // =========================================================================
    // Constants
    // =========================================================================
    
    /// @notice Maximum contenthash length (IPFS CIDv1 is ~36 bytes, add buffer)
    uint256 public constant MAX_CONTENTHASH_LENGTH = 128;
    
    /// @notice IPFS protocol identifier (EIP-1577)
    bytes1 public constant IPFS_PROTOCOL = 0xe3;
    
    /// @notice Contract version for upgrades
    string public constant VERSION = "1.0.0";
    
    // =========================================================================
    // Constructor
    // =========================================================================
    
    /**
     * @notice Initialize the VOTRegistry
     * @param _nftContract VOT Machine NFT contract address (ERC-1155)
     * @param _treasury Treasury address for verification
     */
    constructor(address _nftContract, address _treasury) Ownable(msg.sender) {
        if (_nftContract == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        
        nftContract = _nftContract;
        treasury = _treasury;
        
        // Owner is automatically an authorized minter
        authorizedMinters[msg.sender] = true;
    }
    
    // =========================================================================
    // Public Functions
    // =========================================================================
    
    /**
     * @notice Get contenthash for a token (primary CCIP-Read function)
     * @param tokenId The NFT token ID
     * @return The IPFS contenthash (EIP-1577 encoded)
     */
    function contenthash(uint256 tokenId) external view returns (bytes memory) {
        return _contenthash[tokenId];
    }
    
    /**
     * @notice Resolve ENS data for a token (extended function)
     * @param tokenId The NFT token ID
     * @return _contenthash The IPFS contenthash
     * @return exists Whether the contenthash exists
     */
    function resolveENS(uint256 tokenId) external view returns (
        bytes memory _contenthash,
        bool exists
    ) {
        _contenthash = _contenthash[tokenId];
        exists = _contenthash.length > 0;
    }
    
    /**
     * @notice Check if a tokenId has a contenthash registered
     * @param tokenId The NFT token ID
     * @return Whether the contenthash exists
     */
    function hasContenthash(uint256 tokenId) external view returns (bool) {
        return _contenthash[tokenId].length > 0;
    }
    
    // =========================================================================
    // Token Owner Functions
    // =========================================================================
    
    /**
     * @notice Set contenthash for a token you own
     * @dev Only the NFT owner can update their token's contenthash
     * @param tokenId The NFT token ID
     * @param _newContenthash The new IPFS contenthash (EIP-1577 encoded)
     */
    function setContenthash(uint256 tokenId, bytes calldata _newContenthash) 
        external 
        nonReentrant 
    {
        // Validate contenthash
        if (_newContenthash.length == 0) revert InvalidContenthash();
        if (_newContenthash.length > MAX_CONTENTHASH_LENGTH) {
            revert ContenthashTooLong(_newContenthash.length, MAX_CONTENTHASH_LENGTH);
        }
        
        // Verify caller owns the NFT
        if (IERC1155(nftContract).balanceOf(msg.sender, tokenId) == 0) {
            revert NotTokenOwner(tokenId, msg.sender);
        }
        
        // Track new registrations
        if (_contenthash[tokenId].length == 0) {
            totalRegistered++;
        }
        
        // Store contenthash
        _contenthash[tokenId] = _newContenthash;
        lastUpdated[tokenId] = block.timestamp;
        
        emit ContenthashSet(tokenId, _newContenthash, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Clear contenthash for a token you own
     * @param tokenId The NFT token ID
     */
    function clearContenthash(uint256 tokenId) external nonReentrant {
        // Verify caller owns the NFT
        if (IERC1155(nftContract).balanceOf(msg.sender, tokenId) == 0) {
            revert NotTokenOwner(tokenId, msg.sender);
        }
        
        if (_contenthash[tokenId].length > 0) {
            delete _contenthash[tokenId];
            delete lastUpdated[tokenId];
            totalRegistered--;
            
            emit ContenthashCleared(tokenId, msg.sender);
        }
    }
    
    // =========================================================================
    // Authorized Minter Functions (for x402 Facilitator)
    // =========================================================================
    
    /**
     * @notice Set contenthash during mint (authorized minters only)
     * @dev Called by x402 facilitator when minting new NFTs
     * @param tokenId The NFT token ID
     * @param _newContenthash The IPFS contenthash
     * @param recipient The intended NFT recipient (for verification)
     */
    function setContenthashOnMint(
        uint256 tokenId, 
        bytes calldata _newContenthash,
        address recipient
    ) external nonReentrant {
        if (!authorizedMinters[msg.sender]) {
            revert NotAuthorizedMinter(msg.sender);
        }
        
        // Validate contenthash
        if (_newContenthash.length == 0) revert InvalidContenthash();
        if (_newContenthash.length > MAX_CONTENTHASH_LENGTH) {
            revert ContenthashTooLong(_newContenthash.length, MAX_CONTENTHASH_LENGTH);
        }
        
        // Track new registrations
        if (_contenthash[tokenId].length == 0) {
            totalRegistered++;
        }
        
        // Store contenthash
        _contenthash[tokenId] = _newContenthash;
        lastUpdated[tokenId] = block.timestamp;
        
        emit ContenthashSet(tokenId, _newContenthash, recipient, block.timestamp);
    }
    
    /**
     * @notice Batch set contenthashes (authorized minters or owner)
     * @dev For backfilling existing NFTs or bulk mints
     * @param tokenIds Array of token IDs
     * @param contenthashes Array of contenthashes
     */
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
            
            if (ch.length == 0) continue; // Skip empty
            if (ch.length > MAX_CONTENTHASH_LENGTH) {
                revert ContenthashTooLong(ch.length, MAX_CONTENTHASH_LENGTH);
            }
            
            // Track new registrations
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
    
    /**
     * @notice Authorize or deauthorize a minter address
     * @param minter The address to authorize/deauthorize
     * @param authorized Whether to authorize (true) or deauthorize (false)
     */
    function setMinterAuthorization(address minter, bool authorized) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }
    
    /**
     * @notice Update the NFT contract address
     * @param _newNftContract New NFT contract address
     */
    function setNFTContract(address _newNftContract) external onlyOwner {
        if (_newNftContract == address(0)) revert ZeroAddress();
        address oldContract = nftContract;
        nftContract = _newNftContract;
        emit NFTContractUpdated(oldContract, _newNftContract);
    }
    
    /**
     * @notice Update the treasury address
     * @param _newTreasury New treasury address
     */
    function setTreasury(address _newTreasury) external onlyOwner {
        if (_newTreasury == address(0)) revert ZeroAddress();
        address oldTreasury = treasury;
        treasury = _newTreasury;
        emit TreasuryUpdated(oldTreasury, _newTreasury);
    }
    
    // =========================================================================
    // View Functions for Statistics
    // =========================================================================
    
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
        for (uint256 i = 0; i < tokenIds.length; i++) {
            contenthashes[i] = _contenthash[tokenIds[i]];
        }
    }
    
    /**
     * @notice Check if contenthash starts with IPFS protocol byte
     * @param tokenId The NFT token ID
     * @return Whether it's an IPFS contenthash
     */
    function isIPFSContenthash(uint256 tokenId) external view returns (bool) {
        bytes memory ch = _contenthash[tokenId];
        if (ch.length == 0) return false;
        return ch[0] == IPFS_PROTOCOL;
    }
}
