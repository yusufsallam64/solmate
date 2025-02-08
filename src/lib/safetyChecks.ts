export function confirmMainnetAction(action: string, amount: number): boolean {
    const msg = `You are about to ${action} ${amount} SOL on MAINNET.\n\nTHIS IS REAL SOL WORTH REAL MONEY.\n\nAre you ABSOLUTELY SURE?`;
    return window.confirm(msg);
}