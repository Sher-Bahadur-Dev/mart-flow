import type { Metadata } from "next";

import { EmployeeCreateForm } from "@/components/employees/employee-create-form";

export const metadata: Metadata = { title: "New employee" };

export default function NewEmployeePage() {
  return <EmployeeCreateForm />;
}
