import type { Metadata } from "next";

import { CashView } from "@/components/cash/cash-view";

export const metadata: Metadata = { title: "Cash" };

export default function CashPage() {
  return <CashView />;
}
