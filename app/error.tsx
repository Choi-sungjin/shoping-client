"use client"

type ErrorPageProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="min-h-[60vh] bg-background text-foreground flex items-center justify-center px-6">
      <section className="w-full max-w-lg border border-border bg-card p-8">
        <h1 className="font-serif text-3xl mb-3">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {error?.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center bg-foreground text-background px-4 py-2 text-xs tracking-widest uppercase"
        >
          Try again
        </button>
      </section>
    </main>
  )
}
