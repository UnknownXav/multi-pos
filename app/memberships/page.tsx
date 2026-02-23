"use client"
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '../../components/Modal'
import Table from '../../components/Table'

export default function MembershipsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [store, setStore] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])

  const [showAddMember, setShowAddMember] = useState(false)
  const [showPlans, setShowPlans] = useState(false)

  // Member Form
  const [memberName, setMemberName] = useState('')
  const [memberPhone, setMemberPhone] = useState('')
  const [memberBarcode, setMemberBarcode] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [customDuration, setCustomDuration] = useState('')

  // Plan Form
  const [planName, setPlanName] = useState('')
  const [planDays, setPlanDays] = useState('30')
  const [planPrice, setPlanPrice] = useState('')
  const [planBenefits, setPlanBenefits] = useState('')

  useEffect(() => {
    const storeStr = localStorage.getItem('store')
    if (!storeStr) {
      router.push('/login')
      return
    }
    const s = JSON.parse(storeStr)
    setStore(s)
    fetchData(s.id)
  }, [router])

  const fetchData = async (storeId: number) => {
    try {
      const [mRes, pRes] = await Promise.all([
        fetch(`/api/members?storeId=${storeId}`),
        fetch(`/api/membership-plans?storeId=${storeId}`)
      ])
      const [mData, pData] = await Promise.all([mRes.json(), pRes.json()])
      if (mData.success) setMembers(mData.data)
      if (pData.success) setPlans(pData.data)
    } catch (err) {
      console.error("Fetch data error:", err)
    } finally {
      setLoading(false)
    }
  }

  const registerMember = async () => {
    if (!memberName || !selectedPlanId) return
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          name: memberName,
          phone: memberPhone,
          barcode: memberBarcode,
          planId: parseInt(selectedPlanId),
          startDate: new Date(startDate),
          durationDays: customDuration ? parseInt(customDuration) : undefined
        })
      })
      const data = await res.json()
      if (data.success) {
        setShowAddMember(false)
        setMemberName(''); setMemberPhone(''); setMemberBarcode('');
        fetchData(store.id)
      } else {
        alert(data.error || "Registration failed")
      }
    } catch (err) {
      alert("Network error")
    }
  }

  const createPlan = async () => {
    if (!planName || !planPrice || !planDays) return
    try {
      const res = await fetch('/api/membership-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: store.id,
          name: planName,
          durationDays: parseInt(planDays),
          price: parseFloat(planPrice),
          description: planBenefits
        })
      })
      const data = await res.json()
      if (data.success) {
        setPlanName(''); setPlanPrice('');
        fetchData(store.id)
      }
    } catch (err) {
      alert("Network error")
    }
  }

  const deletePlan = async (id: number) => {
    if (!confirm("Are you sure? This will permanently remove this plan.")) return
    try {
      const res = await fetch(`/api/membership-plans/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        fetchData(store.id)
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert("Network error")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Member Management</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Gym & Fitness Services</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setShowPlans(true)} className="px-6 h-12 rounded-2xl border-2 border-slate-100 font-black text-slate-400 hover:bg-slate-50 transition-all flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>Manage Plans</span>
          </button>
          <button onClick={() => setShowAddMember(true)} className="px-8 h-12 rounded-2xl bg-blue-600 font-black text-white shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            <span>New Member</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-50 overflow-hidden">
        <Table columns={["Member Name", "Membership Plan", "Expiration Date", "Status"]}>
          {members.map(m => {
            const sub = m.subscriptions[0]
            const isExpired = sub ? new Date(sub.endDate) < new Date() : true
            return (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group px-4">
                <td className="py-5 px-6">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 uppercase tracking-tight">{m.name}</span>
                    <span className="text-[10px] font-bold text-slate-400">{m.phone || 'No phone'}</span>
                  </div>
                </td>
                <td className="py-5 px-6 font-bold text-slate-600">
                  <div className="flex flex-col">
                    <span>{sub?.plan.name || 'No Plan'}</span>
                    <span className="text-[10px] text-blue-500 font-black uppercase">₱{sub?.plan.price}</span>
                  </div>
                </td>
                <td className="py-5 px-6 font-bold text-slate-400 text-xs">
                  {sub ? new Date(sub.endDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                </td>
                <td className="py-5 px-6">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isExpired ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                    {isExpired ? 'Expired' : 'Active'}
                  </span>
                </td>
              </tr>
            )
          })}
        </Table>
      </div>

      {/* Modals */}
      <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="Register New Member">
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input className="w-full h-11 px-4 rounded-xl border-slate-200 focus:border-blue-500 font-medium" value={memberName} onChange={e => setMemberName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
              <input className="w-full h-11 px-4 rounded-xl border-slate-200 focus:border-blue-500 font-medium" value={memberPhone} onChange={e => setMemberPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Barcode</label>
              <input className="w-full h-11 px-4 rounded-xl border-slate-200 focus:border-blue-500 font-medium" value={memberBarcode} onChange={e => setMemberBarcode(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Membership Plan</label>
            <select className="w-full h-14 px-4 rounded-2xl bg-slate-50 border-none font-black text-slate-700" value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}>
              <option value="">Select a Plan...</option>
              {plans.map(p => <option key={p.id} value={p.id}>{p.name} - ₱{p.price} ({p.durationDays} days)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
              <input type="date" className="w-full h-11 px-4 rounded-xl border-slate-200 focus:border-blue-500 font-medium text-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration (Days)</label>
              <input placeholder="Optional override" className="w-full h-11 px-4 rounded-xl border-slate-200 focus:border-blue-500 font-medium text-sm" value={customDuration} onChange={e => setCustomDuration(e.target.value)} />
            </div>
          </div>
          <button onClick={registerMember} className="w-full h-16 bg-blue-600 text-white rounded-3xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition">Register & Activate</button>
        </div>
      </Modal>

      <Modal open={showPlans} onClose={() => setShowPlans(false)} title="Membership Plans">
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Create New Plan</h4>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Name" className="h-11 px-4 rounded-xl bg-slate-50 border-none font-bold" value={planName} onChange={e => setPlanName(e.target.value)} />
              <input placeholder="Price" className="h-11 px-4 rounded-xl bg-slate-50 border-none font-bold" value={planPrice} onChange={e => setPlanPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Benefits (one per line)</label>
              <textarea placeholder="e.g. Free Locker, Towel Service" className="w-full px-4 py-3 rounded-xl bg-slate-50 border-none font-medium text-xs min-h-[80px]" value={planBenefits} onChange={e => setPlanBenefits(e.target.value)} />
            </div>
            <div className="flex space-x-2">
              {[7, 30, 90, 365].map(d => (
                <button key={d} onClick={() => setPlanDays(d.toString())} className={`flex-1 h-10 rounded-xl font-black text-[10px] uppercase tracking-tighter ${planDays === d.toString() ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                  {d === 7 ? 'Weekly' : d === 30 ? 'Monthly' : d === 90 ? 'Quarterly' : 'Yearly'}
                </button>
              ))}
            </div>
            <button onClick={createPlan} className="w-full h-12 bg-slate-900 text-white rounded-2xl font-black hover:bg-black transition">Add Plan</button>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Existing Plans</h4>
            <div className="space-y-2">
              {plans.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group/item">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-700 uppercase tracking-tight">{p.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.durationDays} Days</span>
                    {p.description && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.description.split('\n').filter(Boolean).map((b: string, idx: number) => (
                          <span key={idx} className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter italic">✓ {b}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-black text-blue-600 px-3 py-1 bg-white rounded-lg shadow-sm">₱{p.price}</span>
                    <button
                      onClick={() => deletePlan(p.id)}
                      className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover/item:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
