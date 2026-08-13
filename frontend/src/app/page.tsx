export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background px-8 py-6 text-foreground">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between border-b border-border pb-5">
          <div>
            <p className="text-sm text-muted-foreground">Typeform clone</p>
            <h1 className="text-2xl font-semibold tracking-normal">Forms</h1>
          </div>
        </header>

        <div className="rounded-md border border-border bg-card p-8 text-card-foreground">
          <h2 className="text-lg font-medium">Phase 0 scaffold is ready.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            The dashboard, builder, respondent flow, and results screens will be built from this
            Next.js App Router foundation in the next phases.
          </p>
        </div>
      </section>
    </main>
  );
}

