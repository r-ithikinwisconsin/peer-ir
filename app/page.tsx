import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[720px] flex-col gap-16 px-6 py-16">
      <section className="flex flex-col gap-4">
        <p className="label">DECIQ</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          What would your peers do?
        </h1>
        <p className="text-lg text-text-muted">
          A structured, de-identified consensus tool for interventional
          radiologists. Enter a case, commit to a decision, and see how peers
          would manage the same scenario — filtered by role, years out, and
          practice setting.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 font-semibold text-primary-fg transition hover:bg-primary/90"
          >
            Sign in
          </Link>
          <Link
            href="/design-system"
            className="inline-flex h-11 items-center justify-center rounded-md px-4 font-semibold text-primary transition hover:bg-primary-soft"
          >
            View design system
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Feature
          label="STEP 1"
          title="Enter a case"
          body="Structured inputs only — no free text, no PHI."
        />
        <Feature
          label="STEP 2"
          title="Commit"
          body="Pick a management decision. No edits after submit."
        />
        <Feature
          label="STEP 3"
          title="See consensus"
          body="Filtered percentage distribution of peer decisions."
        />
      </section>

      <section className="rounded-lg border border-border bg-surface p-5 text-sm text-text-muted shadow-card">
        <p className="label mb-2">DISCLAIMER</p>
        <p>
          For educational purposes only. Not clinical advice. Do not enter
          protected health information.
        </p>
      </section>
    </main>
  );
}

function Feature({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg bg-surface p-5 shadow-card">
      <p className="label mb-2">{label}</p>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-text-muted">{body}</p>
    </div>
  );
}
