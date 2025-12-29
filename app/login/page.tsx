"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      // 1. login ก่อน
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: `${username}@test.com`, // หรือ map username → email เอง
          password,
        })

      if (signInError || !data.user) {
        throw new Error("Invalid username or password")
      }

      // 2. เช็คว่า user นี้เป็น admin จริงไหม
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("admin_id, is_active")
        .eq("admin_id", data.user.id)
        .eq("is_active", true)
        .single()

      if (adminError || !adminData) {
        // ไม่ใช่ admin → logout
        await supabase.auth.signOut()
        throw new Error("You are not authorized")
      }

      router.push("/main")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md px-6">
        <div className="flex flex-col gap-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">Lottery Checker App 1.0</h1>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <Input
                type="text"
                placeholder="Username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-16 rounded-3xl bg-zinc-600 border-0 text-white placeholder:text-zinc-300 text-lg px-6"
              />
              <Input
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-16 rounded-3xl bg-zinc-600 border-0 text-white placeholder:text-zinc-300 text-lg px-6"
              />
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-16 px-12 rounded-3xl bg-green-500 hover:bg-green-600 text-white text-2xl font-medium"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
