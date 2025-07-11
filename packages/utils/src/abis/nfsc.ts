import { parseAbi } from 'viem';

// Parse ABI for the NFSC contract
export const NfscAbi = parseAbi([
  'function mint(address to, uint256 amount) public',
  'function charge(address charger, address chargee, uint256 amount, string memory reason, bytes memory extra) external returns (bytes32)',
  'function mintBatch(address[] calldata receiptients, uint256[] calldata amounts, bytes calldata)',
  'function transferFromBatch(address[] calldata senders, address[] calldata receiptients, uint256[] calldata amounts, bytes calldata)',
  'function transferBatch(address[] calldata receiptients, uint256[] calldata amounts, bytes calldata)',
  'function buyWithEthers() payable',
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
  'function price(address payToken) external view returns (uint256)',
]);
