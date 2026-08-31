import { getApps, initializeApp } from "firebase/app";
import { getAuth as initializeAuth } from "firebase/auth";

import {
  getAuth,
  getFirebaseApp,
  getFirebaseConfig,
  getFirestore,
  getStorage,
  isFirebaseClientConfigured,
} from "@/lib/firebase/config";

export {
  getAuth,
  getFirebaseApp,
  getFirebaseConfig,
  getFirestore,
  getStorage,
  isFirebaseClientConfigured,
};

export function getClientAuth() {
  return getAuth();
}

export function getClientDb() {
  return getFirestore();
}

export function getClientStorage() {
  return getStorage();
}

const STAFF_PROVISIONING_APP = "staff-provisioning";

export function getStaffProvisioningAuth() {
  const config = getFirebaseConfig();
  const existing = getApps().find((item) => item.name === STAFF_PROVISIONING_APP);
  const secondary = existing ?? initializeApp(config, STAFF_PROVISIONING_APP);
  return initializeAuth(secondary);
}
