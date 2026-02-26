import React from 'react'

interface TableProps {
  columns: string[]
  children: React.ReactNode
}

export default function Table({ columns, children }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-0">
        <thead className="bg-slate-50/50">
          <tr>
            {columns.map((c, i) => (
              <th
                key={c}
                className={`text-[10px] font-black text-slate-500 px-6 py-4 uppercase tracking-[0.2em] border-b border-slate-100 ${['ACTIONS', 'AMOUNT', 'TOTAL', 'PRICE', 'AMT', 'STATUS', 'BALANCE'].includes(c.toUpperCase()) ? 'text-right' : ''}`}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {children}
        </tbody>
      </table>
    </div>
  )
}
