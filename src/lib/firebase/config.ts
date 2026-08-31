import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth as firebaseGetAuth, type Auth } from "firebase/auth";
import {
  getFirestore as firebaseGetFirestore,
  type Firestore,
} from "firebase/firestore";
import {
  getStorage as firebaseGetStorage,
  type FirebaseStorage,
} from "firebase/storage";

function readFirebaseEnv() {
  return {
    apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim(),
    authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "").trim(),
    projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim(),
    storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "").trim(),
    messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
    appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "").trim(),
  };
}

export function isFirebaseClientConfigured(): boolean {
  const firebaseConfig = readFirebaseEnv();
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
  );
}

export function getFirebaseConfig() {
  if (!isFirebaseClientConfigured()) {
    throw new Error(
      "Firebase is not configured. Check NEXT_PUBLIC_FIREBASE_* in .env.local and restart the Next.js server.",
    );
  }

  const firebaseConfig = readFirebaseEnv();
  return {
    apiKey: firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  };
}

let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

export function getFirebaseApp(): FirebaseApp {
  const existing = getApps()[0];

  if (existing) return existing;

  return initializeApp(getFirebaseConfig());
}

export function getAuth(): Auth {
  auth ??= firebaseGetAuth(getFirebaseApp());
  return auth;
}

export function getFirestore(): Firestore {
  db ??= firebaseGetFirestore(getFirebaseApp());
  return db;
}

export function getStorage(): FirebaseStorage {
  storage ??= firebaseGetStorage(getFirebaseApp());
  return storage;
}