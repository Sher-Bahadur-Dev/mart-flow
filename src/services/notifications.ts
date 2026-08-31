import { collection, doc, getDocs, serverTimestamp, setDoc, updateDoc, type DocumentData } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { asDate, asString } from "@/lib/firebase/mapper";
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
  const snap = await getDocs(collection(requireDb(), COLLECTIONS.notifications));
  return snap.docs
    .map((item) => hydrateNotification(item.id, item.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(requireDb(), COLLECTIONS.notifications, id), { read: true });
}

export async function createNotification(input: { title: string; body: string }) {
  const ref = doc(collection(requireDb(), COLLECTIONS.notifications));
  await setDoc(ref, {
    id: ref.id,
    title: input.title,
    body: input.body,
    read: false,
    createdAt: serverTimestamp(),
  });
}
