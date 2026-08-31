import { collection, doc, getDocs, serverTimestamp, setDoc, type DocumentData } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asDate, asNumber, asString } from "@/lib/firebase/mapper";
import { listOwnerDocs, withOwner } from "@/lib/tenant";
import type { CashSession } from "@/types";

export function hydrateCashSession(id: string, data: DocumentData): CashSession {
  return {
    id,
    openedBy: asString(data.openedBy),
    closedBy: typeof data.closedBy === "string" ? data.closedBy : null,
    openingCash: asNumber(data.openingCash),
    cashSales: asNumber(data.cashSales),
    cashExpenses: asNumber(data.cashExpenses),
    cashRefunds: asNumber(data.cashRefunds),
    withdrawals: asNumber(data.withdrawals),
    actualCash: typeof data.actualCash === "number" ? data.actualCash : null,
    expectedCash: typeof data.expectedCash === "number" ? data.expectedCash : null,
    difference: typeof data.difference === "number" ? data.difference : null,
    closedAt: data.closedAt ? asDate(data.closedAt) : null,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listCashSessions(): Promise<CashSession[]> {
  const docs = await listOwnerDocs(COLLECTIONS.cashSessions);
  return docs
    .map((item) => hydrateCashSession(item.id, item.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function openCashSession(input: { openedBy: string; openingCash: number; cashSales?: number }) {
  const ref = doc(collection(requireDb(), COLLECTIONS.cashSessions));
  const expected = input.openingCash + (input.cashSales ?? 0);
  await setDoc(
    ref,
    withOwner({
      id: ref.id,
      openedBy: input.openedBy,
      closedBy: null,
      openingCash: input.openingCash,
      cashSales: input.cashSales ?? 0,
      cashExpenses: 0,
      cashRefunds: 0,
      withdrawals: 0,
      actualCash: null,
      expectedCash: expected,
      difference: null,
      closedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
  );
}
