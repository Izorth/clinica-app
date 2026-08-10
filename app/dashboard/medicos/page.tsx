import { MedicosContent } from "@/components/medicos/medicos-content";

export default function MedicosPage() {
  return (
    <main className="space-y-6 p-6">
      <h1 className="text-[15px] font-semibold text-[var(--color-text)]">Médicos</h1>
      <MedicosContent />
    </main>
  );
}
