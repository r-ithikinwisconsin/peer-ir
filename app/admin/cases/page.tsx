import { Layers } from "lucide-react";
import { CategoryPill } from "@/components/ui/category-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { TemplateActiveToggle } from "@/components/admin/template-active-toggle";
import { CATEGORY_LABELS, type CaseCategory } from "@/lib/schemas/enums";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCasesPage() {
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("case_templates")
    .select("id, slug, title, category, is_active")
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  const rows = templates ?? [];

  return (
    <main className="px-5 py-6">
      <SectionHeading title="Case templates" size="lg" />

      {rows.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No templates yet"
          description="Templates are provisioned via the seed script."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((t) => (
            <li
              key={t.id}
              className="flex flex-col gap-2 rounded-lg bg-surface p-4 shadow-card"
            >
              <div className="flex items-center justify-between gap-3">
                <CategoryPill>
                  {CATEGORY_LABELS[t.category as CaseCategory]}
                </CategoryPill>
                <TemplateActiveToggle
                  id={t.id}
                  initialActive={t.is_active}
                />
              </div>
              <p className="text-[15px] font-semibold">{t.title}</p>
              <p className="font-mono text-xs text-text-muted">{t.slug}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
