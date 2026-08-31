import type { Timestamp } from "firebase/firestore";

export function asDate(value: unknown) {
  if (value instanceof Date) {
    return value;
  }
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as Timestamp).toDate();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

export function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  return fallback;
}
