import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, type DocumentData } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asDate, asNumber, asString } from "@/lib/firebase/mapper";
import type { Expense, ExpenseCategory, PaymentMethod } from "@/types";

export function hydrateExpense(id: string, data: DocumentData): Expense {
  return {
    id,
    title: asString(data.title),
    category: (asString(data.category, "Other") as ExpenseCategory) || "Other",
    amount: asNumber(data.amount),
    paymentMethod: (asString(data.paymentMethod, "CASH") as PaymentMethod) || "CASH",
    description: typeof data.description === "string" ? data.description : null,
    date: asDate(data.date ?? data.createdAt),
    createdBy: asString(data.createdBy),
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listExpenses(): Promise<Expense[]> {
  const snap = await getDocs(collection(requireDb(), COLLECTIONS.expenses));
  return snap.docs
    .map((item) => hydrateExpense(item.id, item.data()))
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function createExpense(input: Omit<Expense, "id" | "createdAt" | "updatedAt"> & { id?: string }) {
  const ref = input.id
    ? doc(requireDb(), COLLECTIONS.expenses, input.id)
    : doc(collection(requireDb(), COLLECTIONS.expenses));
  await setDoc(ref, {
    ...input,
    id: ref.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return hydrateExpense(snap.id, snap.data() ?? {});
}
