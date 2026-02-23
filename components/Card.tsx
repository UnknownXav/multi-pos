import React from 'react'

interface CardProps {
  title: string
  value: string
  icon?: React.ReactNode
  trend?: {
    value: string
    positive?: boolean
  }
  subtitle?: string
  highlight?: boolean
  onClick?: () => void
}

export default function Card({ title, value, icon, trend, subtitle, highlight, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-50 transition-all duration-300 group ${highlight ? 'ring-2 ring-red-50' : ''} ${onClick ? 'hover:shadow-xl hover:shadow-slate-200/50 transform hover:-translate-y-1 cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${highlight ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'} transition-transform duration-300 group-hover:scale-110`}>
          {icon || (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        {trend && (
          <div className={`flex items-center px-2 py-0.5 rounded-full text-[12px] font-black ${trend.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            <span>{trend.positive ? '+' : '-'}{trend.value}</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-[11px] font-black text-slate-400 tracking-[0.1em] uppercase">{title}</p>
        <div className="flex items-baseline space-x-2">
          <h2 className={`text-2xl font-black tracking-tight ${highlight ? 'text-red-600' : 'text-slate-800'}`}>{value}</h2>
        </div>
        {subtitle && <p className="text-[10px] font-bold text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}
