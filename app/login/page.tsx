"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      // Save user and store info to localStorage
      if (data.data) {
        localStorage.setItem('user', JSON.stringify(data.data))
        localStorage.setItem('store', JSON.stringify(data.data.store))
      }

      // Important: clear loading state before redirecting in case it hangs
      setLoading(false)

      // Success - redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('CRITICAL LOGIN ERROR:', err)
      setError('Network error. Please try again.')
      setLoading(false)
    } finally {
      // Safety net: ensures loading state is eventually cleared
      setTimeout(() => {
        setLoading(false)
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f8fafc]">
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-xl border border-slate-100 p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-[#3b82f6] tracking-tight mb-1 uppercase">POS SYSTEM</h1>
          <p className="text-sm text-slate-500 font-medium">Owner & Cashier Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-0.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-800 placeholder:text-slate-400"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-0.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-slate-800 placeholder:text-slate-400"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#3b82f6] text-white py-3 rounded-xl font-bold hover:bg-blue-600 active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed transition-all duration-200 mt-2 shadow-lg shadow-blue-500/20"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium">
          <p className="text-slate-500">
            Don't have an account?{' '}
            <Link href="/register" className="text-[#3b82f6] hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
