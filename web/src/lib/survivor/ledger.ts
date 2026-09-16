// Immutable ledger helpers: pure computation for the balance sheet.
import type { LedgerTransaction, TxType, WalletView } from "./types";

const CREDIT_TYPES = new Set<TxType>(["deposit", "income", "payment"]);
const DEBIT_TYPES = new Set<TxType>(["spend", "expense"]);

// Amount stored signed (+ credit, − debit). Rules enforce which side each type lives on.
export function isCreditType(t: TxType): boolean {
  return CREDIT_TYPES.has(t);
}

export function isDebitType(t: TxType): boolean {
  return DEBIT_TYPES.has(t);
}

// Compute cumulative balance from a chronologically-ordered ledger.
export function computeBalance(transactions: LedgerTransaction[]): number {
  let bal = 0;
  for (const tx of transactions) {
    if (isCreditType(tx.type)) bal += tx.amount;
    else if (isDebitType(tx.type)) bal -= tx.amount;
    // Unknown type is a hard invariant violation.
  }
  return Math.round(bal * 100) / 100;
}

// Helper for WalletView aggregation (does not need full ledger fetch for each).
export function emptyWallet(agentId: string, name: string, currency = "EUR"): WalletView {
  return { agentId, name, status: "alive", balance: 0, pendingBids: 0, reserved: 0, currency };
}

// Deduplicate ledger by reference_id (first wins; idempotent re-inserts are safe).
export function deduplicateTransactions(rows: LedgerTransaction[]): LedgerTransaction[] {
  const seen = new Map<string, LedgerTransaction>();
  for (const tx of rows) {
    if (!seen.has(tx.reference_id)) seen.set(tx.reference_id, tx);
  }
  return Array.from(seen.values());
}