import { Suspense } from "react";
import { PagosContent } from "@/components/pagos/pagos-content";

export const metadata = { title: "Pagos — Clínica" };

export default function PagosPage() {
  return (
    <Suspense>
      <PagosContent />
    </Suspense>
  );
}
