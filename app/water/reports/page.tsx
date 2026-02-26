"use client"
import React, { useState, useEffect } from 'react'
import Table from '@/components/Table'

export default function WaterReportsPage() {
    const [reportType, setReportType] = useState('summary') // summary, collection, outstanding, consumption
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [billingPeriod, setBillingPeriod] = useState(new Date().toISOString().slice(0, 7))

    useEffect(() => {
        fetchReport()
    }, [reportType, billingPeriod])

    const fetchReport = async () => {
        try {
            setLoading(true)
            setData(null)
            const res = await fetch(`/api/water/reports?type=${reportType}&billingPeriod=${billingPeriod}`)
            const json = await res.json()
            if (json.success) {
                setData(json.data)
            }
        } catch (err) {
            console.error('Failed to fetch report')
        } finally {
            setLoading(false)
        }
    }

    const renderReport = () => {
        if (loading) return <div className="py-20 text-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mx-auto"></div></div>
        if (!data) return null

        switch (reportType) {
            case 'summary':
                if (Array.isArray(data)) return null;
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Billed</p>
                            <p className="text-3xl font-black text-slate-800">₱{data?._sum?.totalAmount?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Collected</p>
                            <p className="text-3xl font-black text-emerald-600">₱{data?._sum?.paidAmount?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Outstanding Balance</p>
                            <p className="text-3xl font-black text-rose-600">₱{data?._sum?.balance?.toLocaleString() || '0'}</p>
                        </div>
                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Consumption</p>
                            <p className="text-3xl font-black text-blue-600 tracking-tight">{data?._sum?.consumption?.toLocaleString() || '0'} <span className="text-sm font-bold text-slate-400">m³</span></p>
                        </div>
                    </div>
                )
            case 'collection':
                return (
                    <Table columns={["Consumer", "OR No.", "Method", "Amount", "Date"]}>
                        {Array.isArray(data) && data.map((p: any) => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 font-bold uppercase text-xs">{p.bill.consumer.name}</td>
                                <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{p.referenceNumber || '---'}</td>
                                <td className="px-6 py-4"><span className="bg-slate-50 px-2 py-1 rounded text-[10px] font-black uppercase">{p.paymentMethod}</span></td>
                                <td className="px-6 py-4 font-black">₱{p.amount.toFixed(2)}</td>
                                <td className="px-6 py-4 text-slate-400 text-xs">{new Date(p.paymentDate).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </Table>
                )
            case 'outstanding':
                return (
                    <Table columns={["Consumer", "Account", "Due Date", "Balance"]}>
                        {Array.isArray(data) && data.map((b: any) => (
                            <tr key={b.id}>
                                <td className="px-6 py-4 font-black uppercase text-[13px]">{b.consumer.name}</td>
                                <td className="px-6 py-4 font-mono text-[10px] text-slate-400 tracking-widest">{b.consumer.accountNumber}</td>
                                <td className="px-6 py-4 text-rose-500 font-bold">{new Date(b.dueDate).toLocaleDateString()}</td>
                                <td className="px-6 py-4 font-black text-slate-800">₱{b.balance.toFixed(2)}</td>
                            </tr>
                        ))}
                    </Table>
                )
            case 'consumption':
                return (
                    <Table columns={["Consumer", "Type", "Consumption"]}>
                        {Array.isArray(data) && data.map((r: any) => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 font-bold uppercase text-xs">{r.consumer.name}</td>
                                <td className="px-6 py-4"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-[10px] font-black uppercase">{r.consumer.connectionType}</span></td>
                                <td className="px-6 py-4 font-black text-slate-800">{r.consumption.toFixed(2)} m³</td>
                            </tr>
                        ))}
                    </Table>
                )
            default:
                return null
        }
    }

    return (
        <div className="space-y-8 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <span className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">📊</span>
                        Reports & Analytics
                    </h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Export and analyze utility performance</p>
                </div>
                <div className="flex gap-4">
                    <input
                        type="month"
                        value={billingPeriod}
                        onChange={e => setBillingPeriod(e.target.value)}
                        className="px-4 py-2 bg-white border border-slate-100 rounded-xl font-bold text-slate-800 focus:outline-none shadow-sm"
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'summary', label: 'Overview', icon: '🏠' },
                    { id: 'collection', label: 'Collections', icon: '💰' },
                    { id: 'outstanding', label: 'Outstanding', icon: '📉' },
                    { id: 'consumption', label: 'Consumption', icon: '🚰' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setReportType(tab.id)}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-black text-[13px] uppercase tracking-widest transition-all whitespace-nowrap ${reportType === tab.id
                            ? 'bg-slate-800 text-white shadow-xl shadow-slate-200 translate-y-[-2px]'
                            : 'bg-white text-slate-400 border border-slate-50 hover:bg-slate-50'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className={`${reportType === 'summary' ? '' : 'bg-white rounded-[40px] border border-slate-50 shadow-sm overflow-hidden'}`}>
                {renderReport()}
            </div>
        </div>
    )
}
