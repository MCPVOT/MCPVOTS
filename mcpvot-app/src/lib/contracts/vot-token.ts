export const VOT_TOKEN_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function microPayment(address to, uint256 amount, string calldata memo) external",
    "function microPaymentWithBurn(address to, uint256 amount, uint256 burnAmount, string calldata memo) external",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function getBurnStats() external view returns (uint256 totalBurned, uint256 burnRate, uint256 circulatingSupply)"
] as const;

export const VOT_TOKEN_ADDRESS = '0xc1e1E7aDfDf1553b339D8046704e8e37E2CA9B07';
