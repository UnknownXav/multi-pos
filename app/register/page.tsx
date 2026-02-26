"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const BUSINESS_TYPES = [
  {
    key: 'RETAIL',
    icon: '🏬',
    label: 'Retail POS',
    desc: 'Inventory & checkout system for small stores',
    color: 'blue',
  },
  {
    key: 'RESTAURANT',
    icon: '🍽️',
    label: 'Restaurant POS',
    desc: 'Table management & kitchen orders',
    color: 'orange',
  },
  {
    key: 'PHARMACY',
    icon: '💊',
    label: 'Pharmacy POS',
    desc: 'Medicine tracking with expiration & prescription support',
    color: 'green',
  },
  {
    key: 'GYM',
    icon: '🏋️',
    label: 'Gym POS',
    desc: 'Membership & subscription management',
    color: 'purple',
  },
  {
    key: 'WATER_BILLING',
    icon: '💧',
    label: 'Water Billing POS',
    desc: 'Utility billing with meter reading & tiered rates',
    color: 'sky',
  },
]

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; ring: string }> = {
  blue: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-200' },
  orange: { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-600', ring: 'ring-orange-200' },
  green: { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-200' },
  purple: { border: 'border-violet-500', bg: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-200' },
  sky: { border: 'border-sky-500', bg: 'bg-sky-50', text: 'text-sky-600', ring: 'ring-sky-200' },
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1 fields
  const [storeName, setStoreName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Step 2 fields
  const [businessType, setBusinessType] = useState('')

  // Shared
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedBiz = BUSINESS_TYPES.find(b => b.key === businessType)

  // ── Step 1 → 2 ──────────────────────────────────────────
  const goToStep2 = () => {
    setError(null)
    if (!storeName.trim() || !ownerName.trim() || !email.trim() || !password) {
      setError('All fields are required.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setStep(2)
  }

  // ── Step 2 → 3 ──────────────────────────────────────────
  const goToStep3 = () => {
    setError(null)
    if (!businessType) {
      setError('Please select a business type.')
      return
    }
    setStep(3)
  }

  // ── Final Submit ─────────────────────────────────────────
  const handleSubmit = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeName, ownerName, email, password, confirmPassword, businessType }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Registration failed.')
        setLoading(false)
        return
      }
      router.push('/login?registered=true')
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="w-full max-w-[520px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-200 mb-4">
            <span className="text-white font-black text-xl">P</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Create your workspace</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">Set up your POS in 3 easy steps</p>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-xs transition-all duration-300
                ${step > s ? 'bg-blue-600 text-white shadow-md shadow-blue-200' :
                  step === s ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-100' :
                    'bg-slate-100 text-slate-400'}`}>
                {step > s ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 max-w-[60px] h-0.5 rounded-full transition-all duration-500 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">

          {/* ── STEP 1: Account Setup ── */}
          {step === 1 && (
            <div className="p-8 space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Account Setup</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Step 1 of 3</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Business Name</label>
                  <input
                    type="text" value={storeName} onChange={e => setStoreName(e.target.value)}
                    placeholder="e.g. Maria's Sari-Sari Store"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Owner Name</label>
                  <input
                    type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="owner@business.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Password</label>
                    <input
                      type="password" value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Confirm</label>
                    <input
                      type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-semibold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold">{error}</div>}

              <button onClick={goToStep2}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-base shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
                Continue
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}

          {/* ── STEP 2: Business Type ── */}
          {step === 2 && (
            <div className="p-8 space-y-5">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Choose Business Type</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Step 2 of 3 — Select one</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_TYPES.map(biz => {
                  const c = COLOR_MAP[biz.color]
                  const isSelected = businessType === biz.key
                  return (
                    <button
                      key={biz.key}
                      onClick={() => setBusinessType(biz.key)}
                      className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 group
                        ${isSelected
                          ? `${c.border} ${c.bg} ring-4 ${c.ring}`
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white'}`}
                    >
                      {/* Check icon */}
                      {isSelected && (
                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full ${c.text.replace('text', 'bg').replace('600', '600')} bg-current flex items-center justify-center`}>
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      <div className="text-2xl mb-2">{biz.icon}</div>
                      <h3 className={`font-black text-sm tracking-tight ${isSelected ? c.text : 'text-slate-700'}`}>{biz.label}</h3>
                      <p className="text-[11px] font-semibold text-slate-400 mt-1 leading-tight">{biz.desc}</p>
                    </button>
                  )
                })}
              </div>

              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold">{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)}
                  className="flex-1 h-12 border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">
                  Back
                </button>
                <button onClick={goToStep3}
                  className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-200 transition-all">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 3 && selectedBiz && (
            <div className="p-8 space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Confirm & Create</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Step 3 of 3 — Review your workspace</p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-5 space-y-3 border border-slate-100">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <span className="text-3xl">{selectedBiz.icon}</span>
                  <div>
                    <p className="font-black text-slate-800">{storeName}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${COLOR_MAP[selectedBiz.color].bg} ${COLOR_MAP[selectedBiz.color].text}`}>
                      {selectedBiz.label}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner</p>
                    <p className="font-bold text-slate-700 mt-0.5">{ownerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                    <p className="font-bold text-slate-700 mt-0.5 truncate">{email}</p>
                  </div>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-400 text-center leading-relaxed">
                By creating your workspace, you agree that the information above is accurate. You can change settings anytime after registration.
              </p>

              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold">{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => setStep(2)}
                  className="flex-1 h-12 border border-slate-200 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-2 flex-grow h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Creating...</span></>
                  ) : (
                    <><span>🚀 Create Workspace</span></>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Login Link */}
        <p className="text-center text-sm font-semibold text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline font-bold">Login</Link>
        </p>
      </div>
    </div>
  )
}
