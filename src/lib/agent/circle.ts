// Circle Wallets + Nanopayments integration
import {
  initiateDeveloperControlledWalletsClient,
} from "@circle-fin/developer-controlled-wallets"

function getClient() {
  return initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  })
}

export interface WalletInfo {
  id: string
  address: string
  blockchain: string
  state: string
}

export async function createWalletSet(name: string): Promise<string> {
  const client = getClient()
  const res = await client.createWalletSet({ name })
  return res.data?.walletSet?.id ?? ""
}

export async function createWallet(
  walletSetId: string,
  label: string
): Promise<WalletInfo> {
  const client = getClient()
  const res = await client.createWallets({
    walletSetId,
    blockchains: ["ARC-TESTNET"],
    count: 1,
    metadata: [{ name: label, refId: label }],
  })
  const w = res.data?.wallets?.[0]
  if (!w) throw new Error("Wallet creation failed")
  return {
    id: w.id,
    address: w.address ?? "",
    blockchain: w.blockchain ?? "ARB-SEPOLIA",
    state: w.state ?? "LIVE",
  }
}

export async function getWalletBalance(walletId: string): Promise<number> {
  const client = getClient()
  const res = await client.getWalletTokenBalance({ id: walletId })
  const balances = res.data?.tokenBalances ?? []
  // Find USDC balance
  const usdc = balances.find(
    (b: { token?: { symbol?: string; name?: string }; amount?: string }) =>
      b.token?.symbol === "USDC" ||
      b.token?.name?.toLowerCase().includes("usdc")
  )
  return parseFloat(usdc?.amount ?? "0")
}

export async function transferUsdc(params: {
  sourceWalletId: string
  destinationAddress: string
  amountUsdc: number
}): Promise<string> {
  const client = getClient()
  const res = await client.createTransaction({
    walletId: params.sourceWalletId,
    tokenId: "15dc2b5d-0994-58b0-bf8c-3a0501148ee8", // Arc Testnet native USDC
    destinationAddress: params.destinationAddress,
    amount: [params.amountUsdc.toFixed(6)],
    fee: { type: "level" as const, config: { feeLevel: "MEDIUM" as const } },
  })
  const data = res.data as Record<string, unknown> | undefined
  return (data?.id as string) ?? (data?.transactionId as string) ?? ""
}

export interface TxDetails {
  state: string | null
  txHash: string | null
  destinationAddress: string | null
  amounts: string[] | null
  blockchain: string | null
}

// Circle transaction states that mean the transfer has settled on-chain: the
// funds moved and the tx is confirmed. COMPLETE is Circle's final state;
// CONFIRMED means it's confirmed on-chain (hash and amount are fixed) while
// Circle finishes its own accounting. Either is enough proof for x402.
export const SETTLED_STATES = ["COMPLETE", "CONFIRMED"]
const FAILED_STATES = ["FAILED", "CANCELLED", "DENIED"]

// Fetch the full details of a Circle transaction (for x402 on-chain verification).
// Accepts either a Circle transaction UUID or, by scanning, resolves what it can.
export async function getTransactionDetails(txId: string): Promise<TxDetails | null> {
  const client = getClient()
  try {
    const res = await client.getTransaction({ id: txId })
    const t = (res.data?.transaction ?? res.data) as Record<string, unknown> | undefined
    if (!t) return null
    return {
      state: (t.state as string) ?? null,
      txHash: (t.txHash as string) ?? null,
      destinationAddress: (t.destinationAddress as string) ?? null,
      amounts: (t.amounts as string[]) ?? null,
      blockchain: (t.blockchain as string) ?? null,
    }
  } catch {
    return null
  }
}

// Resolve a Circle transaction id into its on-chain tx hash (for explorer links).
// Arc confirms fast, but the hash may be momentarily empty — retry a few times.
export async function getTransactionHash(
  txId: string,
  retries = 4,
  delayMs = 1500
): Promise<{ txHash: string | null; state: string | null }> {
  const client = getClient()
  for (let i = 0; i < retries; i++) {
    try {
      const res = await client.getTransaction({ id: txId })
      const t = (res.data?.transaction ?? res.data) as Record<string, unknown> | undefined
      const txHash = (t?.txHash as string) || null
      const state = (t?.state as string) || null
      if (txHash) return { txHash, state }
      if (state === "FAILED" || state === "CANCELLED") return { txHash: null, state }
    } catch {
      // transient — retry
    }
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs))
  }
  return { txHash: null, state: null }
}

// Wait for a Circle transaction to actually settle before treating the payment
// as good. Circle exposes a txHash the moment the tx is broadcast (state SENT),
// well before it confirms, so verification that runs at the first hash always
// loses the race and rejects with "not settled (SENT)". Poll until the tx
// reaches a settled state, hits a terminal failure, or we run out of attempts.
export async function waitForSettlement(
  txId: string,
  retries = 12,
  delayMs = 1500
): Promise<TxDetails | null> {
  const client = getClient()
  let last: TxDetails | null = null
  for (let i = 0; i < retries; i++) {
    try {
      const res = await client.getTransaction({ id: txId })
      const t = (res.data?.transaction ?? res.data) as Record<string, unknown> | undefined
      if (t) {
        last = {
          state: (t.state as string) ?? null,
          txHash: (t.txHash as string) ?? null,
          destinationAddress: (t.destinationAddress as string) ?? null,
          amounts: (t.amounts as string[]) ?? null,
          blockchain: (t.blockchain as string) ?? null,
        }
        if (last.state && SETTLED_STATES.includes(last.state)) return last
        if (last.state && FAILED_STATES.includes(last.state)) return last
      }
    } catch {
      // transient — retry
    }
    if (i < retries - 1) await new Promise((r) => setTimeout(r, delayMs))
  }
  return last
}
