import { getAuth, getFirestore, getStorage } from "@/lib/firebase/config";

export function requireDb() {
  return getFirestore();
}

export function requireClientAuth() {
  return getAuth();
}

export function requireStorage() {
  return getStorage();
}
