import "server-only";

import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function readAdminConfig() {
  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return { projectId, clientEmail, privateKey };
}

export function isFirebaseAdminConfigured() {
  const config = readAdminConfig();
  return Boolean(config.projectId && config.clientEmail && config.privateKey);
}

let app: App | undefined;
let adminAuth: Auth | undefined;
let adminDb: Firestore | undefined;

function getAdminApp() {
  if (!isFirebaseAdminConfigured()) {
    return undefined;
  }
  if (!app) {
    const existing = getApps()[0];
    if (existing) {
      app = existing;
    } else {
      const config = readAdminConfig();
      app = initializeApp({
        credential: cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey,
        }),
      });
    }
  }
  return app;
}

export function getAdminAuth() {
  const adminApp = getAdminApp();
  if (!adminApp) {
    return undefined;
  }
  adminAuth ??= getAuth(adminApp);
  return adminAuth;
}

export function getAdminDb() {
  const adminApp = getAdminApp();
  if (!adminApp) {
    return undefined;
  }
  adminDb ??= getFirestore(adminApp);
  return adminDb;
}
