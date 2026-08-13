import Link from "next/link";

export default function PublicFormNotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-medium text-foreground">Form not found</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This form may be unpublished, deleted, or the link may be incorrect.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
