import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";

import { COLLECTIONS } from "@/lib/firebase/collections";
import { requireDb } from "@/lib/firebase/db";
import { withOwner } from "@/lib/tenant";

export async function writeAuditLog(input: {
  action: string;
  userId: string;
  entity: string;
  entityId: string;
  details?: Record<string, string | number | boolean | null>;
}) {
  const ref = doc(collection(requireDb(), COLLECTIONS.auditLogs));
  await setDoc(
    ref,
    withOwner({
      id: ref.id,
      action: input.action,
      userId: input.userId,
      entity: input.entity,
      entityId: input.entityId,
      details: input.details ?? {},
      timestamp: serverTimestamp(),
    }),
  );
}
