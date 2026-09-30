import type { Company } from "@/lib/types";

export function CompanySelect({
  companies,
  defaultValue,
  className = "focus-ring w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm",
  emptyLabel = "Nenhuma",
}: {
  companies: Company[];
  defaultValue?: string | null;
  className?: string;
  emptyLabel?: string;
}) {
  return (
    <select name="company_id" defaultValue={defaultValue || ""} className={className}>
      <option value="">{emptyLabel}</option>
      {companies.map((company) => (
        <option key={company.id} value={company.id}>{company.name}</option>
      ))}
    </select>
  );
}
