export function formatMoney(value: number, currency = "PKR") {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
  }).format(value);
}

export function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
