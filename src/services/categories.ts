import { collection, getDocs, type DocumentData } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asDate, asString } from "@/lib/firebase/mapper";
import type { Category } from "@/types";

function hydrateCategory(id: string, data: DocumentData): Category {
  return {
    id,
    name: asString(data.name),
    parentId: typeof data.parentId === "string" ? data.parentId : null,
    status: data.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function listCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(requireDb(), COLLECTIONS.categories));
  return snap.docs
    .map((item) => hydrateCategory(item.id, item.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}
