export interface ResolvedName {
    address: `0x${string}`;
    basename?: string; // user.base.eth
    ensName?: string; // user.eth
    displayName?: string; // Preferred name for display
    avatar?: string; // ENS/Basename avatar URL
}
