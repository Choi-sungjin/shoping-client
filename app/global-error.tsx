"use client"

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <main className="min-h-screen flex items-center justify-center px-6">
          <section className="w-full max-w-lg border border-border bg-card p-8">
            <h1 className="font-serif text-3xl mb-3">Critical application error</h1>
            <p className="text-sm text-muted-foreground mb-6">
              {error?.message || "The app could not render this page."}
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center bg-foreground text-background px-4 py-2 text-xs tracking-widest uppercase"
            >
              Reload app
            </button>
          </section>
        </main>
      </body>
    </html>
  )
}
