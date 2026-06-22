// Arc testnet block explorer helpers.
export const ARC_EXPLORER = "https://testnet.arcscan.app"

export function txUrl(hash: string): string {
  return `${ARC_EXPLORER}/tx/${hash}`
}

export function addressUrl(address: string): string {
  return `${ARC_EXPLORER}/address/${address}`
}

// 0x046680…dc8d
export function shortHash(hash: string): string {
  if (hash.length <= 12) return hash
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`
}
