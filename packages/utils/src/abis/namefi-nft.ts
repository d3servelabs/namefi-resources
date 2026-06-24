import { parseAbi } from 'viem';

// Parse ABI for the NFT contract
export const NftAbi = parseAbi([
  'function idToNormalizedDomainName(uint256 tokenId) public view returns (string memory)',
  'function normalizedDomainNameToId(string memory domainName) public pure returns (uint256)',
  // Standard ERC721 ownership read; reverts for burned/non-existent tokens.
  'function ownerOf(uint256 tokenId) public view returns (address)',
  'function safeMintByNameNoCharge(address to, string memory domainName, uint256 expirationTime) external',
  'function safeMintByNameWithCharge(address to, string memory domainName, uint256 expirationTime, address chargee, bytes memory extraData) external',
  'function burnByName(string memory domainName) external',
  'function safeTransferFromByName(address from, address to, string memory domainName) public',
  'function setBaseURI(string memory baseUriStr) public',
  'function setExpiration(uint256 tokenId, uint256 expirationTime) public',
  'function lock(uint256 tokenId, bytes calldata extra) external payable',
  'function lockByName(string memory domainName) external',
  'function unlock(uint256 tokenId, bytes calldata extra) external payable',
  'function unlockByName(string memory domainName) external',
  'function setServiceCreditContract(address addr) public',
  'function getExpiration(uint256 tokenId) public view returns (uint256)',
  'function isExpired(uint256 tokenId) public view returns (bool)',
  'function isLocked(uint256 tokenId) external view returns (bool)',

  'function extendByNameWithCharge(string memory domainName,uint256 timeToExtend,address chargee,bytes memory extraData) external',
  'function extendByNameWithChargeAmount(string memory domainName,uint256 timeToExtend,address chargee,uint256 amount,bytes memory extraData) external',

  // Add Transfer event used for owner tracking
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  // Add Lock event used for lock tracking
  'event Lock(uint256 indexed tokenId, bytes extra)',
  'event Unlock(uint256 indexed tokenId, bytes extra)',

  // Add ExpirationChanged event used for expiration tracking
  'event ExpirationChanged(uint256 indexed tokenId, uint256 newExpirationTime)',
]);
