"use client"

import { FormEvent, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export default function SignupPage() {
  const router = useRouter()
  const { signup, isAuthenticated, loading: authLoading } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/")
    }
  }, [authLoading, isAuthenticated, router])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await signup(name, email, password)
      router.push("/")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <section className="w-full max-w-md border border-border bg-card p-8">
        <h1 className="font-serif text-3xl mb-2">Create Account</h1>
        <p className="text-sm text-muted-foreground mb-8">Start your NOIR experience.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-xs tracking-wider uppercase text-muted-foreground">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full border border-gray-600 bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-xs tracking-wider uppercase text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border border-gray-600 bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-xs tracking-wider uppercase text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full border border-gray-600 bg-background px-3 py-2 text-sm"
            />
          </div>

          {error ? <p className="text-sm text-red-400">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground text-background py-2.5 text-sm disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-foreground underline">
            Login
          </Link>
        </p>
      </section>
    </main>
  )
}
