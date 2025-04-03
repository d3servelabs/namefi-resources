import { parseAbi } from 'viem';
import type { Chain } from 'viem/chains';
import { base, sepolia } from 'viem/chains';
import { secrets } from '#lib/env';
// Parse ABI for the NFT contract
export const NftAbi = parseAbi([
  'function idToNormalizedDomainName(uint256 tokenId) public view returns (string memory)',
  'function normalizedDomainNameToId(string memory domainName) public pure returns (uint256)',
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
  // Add Transfer event used for owner tracking
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
]);

// Parse ABI for the NFSC contract
export const NfscAbi = parseAbi([
  'function mint(address to, uint256 amount) public',
  'function charge(address charger, address chargee, uint256 amount, string memory reason, bytes memory extra) external returns (bytes32)',
  'function mintBatch(address[] calldata receiptients, uint256[] calldata amounts, bytes calldata)',
  'function transferFromBatch(address[] calldata senders, address[] calldata receiptients, uint256[] calldata amounts, bytes calldata)',
  'function transferBatch(address[] calldata receiptients, uint256[] calldata amounts, bytes calldata)',
  'event Charge(address charger, address chargee, uint256 amount, string reason, bytes extra)',

  // ERC20
  'function name() external view returns (string memory)',
  'function symbol() external view returns (string memory)',
  'function decimals() external view returns (uint8)',
  'function totalSupply() external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address recipient, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)',
  'function increaseAllowance(address spender, uint256 addedValue) external returns (bool)',
  'function decreaseAllowance(address spender, uint256 subtractedValue) external returns (bool)',
]);

export const chainsToUrls = (chain: Chain) => {
  return {
    [base.id]: `https://base-mainnet.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
    [sepolia.id]: `https://eth-sepolia.g.alchemy.com/v2/${secrets.ALCHEMY_API_KEY}`,
  }[chain.id];
};
