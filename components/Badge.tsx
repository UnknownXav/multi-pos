import React from 'react'

export default function Badge({ children }: { children: React.ReactNode }){
  return (
    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md">{children}</span>
  )
}
