import { collection, doc, getDocs, serverTimestamp, setDoc, updateDoc, type DocumentData } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asDate, asString } from "@/lib/firebase/mapper";
import { listOwnerDocs, withOwner } from "@/lib/tenant";
import type { AppNotification } from "@/types";

export function hydrateNotification(id: string, data: DocumentData): AppNotification {
  return {
    id,
    title: asString(data.title),
    body: asString(data.body),
    read: data.read === true,
    createdAt: asDate(data.createdAt),
  };
}

export async function listNotifications(): Promise<AppNotification[]> {
  const docs = await listOwnerDocs(COLLECTIONS.notifications);
  return docs
    .map((item) => hydrateNotification(item.id, item.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(requireDb(), COLLECTIONS.notifications, id), { read: true });
}

export async function createNotification(input: { title: string; body: string }) {
  const ref = doc(collection(requireDb(), COLLECTIONS.notifications));
  await setDoc(
    ref,
    withOwner({
      id: ref.id,
      title: input.title,
      body: input.body,
      read: false,
      createdAt: serverTimestamp(),
    }),
  );
}
