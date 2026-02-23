"use client"
import React, { useMemo, useState } from 'react'

export default function CartPanel({ items, setItems, products = [] }: { items: { product: any; qty: number }[]; setItems: any; products?: any[] }){
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success'|'error'; text: string} | null>(null)
  const [cash, setCash] = useState<string>('')

  const total = useMemo(()=> items.reduce((s,i)=> s + i.product.price * i.qty, 0), [items])

  // Check if cart items exceed available stock
  const stockErrors = useMemo(() => {
    return items.filter(item => {
      const product = products.find((p: any) => p.id === item.product.id)
      return product && product.stock < item.qty
    }).map(item => {
      const product = products.find((p: any) => p.id === item.product.id)
      return `${item.product.name}: ${product?.stock || 0} available, ${item.qty} in cart`
    })
  }, [items, products])

  const canCheckout = items.length > 0 && stockErrors.length === 0

  const changeQty = (id:number, delta:number)=>{
    setItems((prev:any[])=> prev.map(it => it.product.id === id ? {...it, qty: Math.max(1, it.qty + delta)} : it))
  }

  const remove = (id:number)=> setItems((prev:any[])=> prev.filter(it=>it.product.id!==id))

  const handleCheckout = async () => {
    if (items.length === 0) {
      setMessage({ type: 'error', text: 'Cart is empty' })
      return
    }

    if (stockErrors.length > 0) {
      setMessage({ type: 'error', text: `Insufficient stock:\n${stockErrors.join('\n')}` })
      return
    }

    setLoading(true)
    try {
      // Get current user info from session
      const sessionRes = await fetch('/api/auth/session')
      if (!sessionRes.ok) {
        setMessage({ type: 'error', text: 'Session expired. Please log in again.' })
        window.location.href = '/login'
        setLoading(false)
        return
      }
      
      const sessionData = await sessionRes.json()
      if (!sessionData || !sessionData.user || !sessionData.user.id) {
        setMessage({ type: 'error', text: 'User session not found. Please log in again.' })
        window.location.href = '/login'
        setLoading(false)
        return
      }

      const saleData = {
        cashierId: sessionData.user.id,
        items: items.map(item => ({
          productId: item.product.id,
          quantity: item.qty,
        })),
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: `Sale completed! Transaction ID: ${result.data.id}` })
        setItems([])
        setCash('')
      } else if (result.insufficientStock && result.insufficientStock.length > 0) {
        // Handle insufficient stock error with details
        const stockErrors = result.insufficientStock
          .map((item: any) => `${item.productName}: ${item.available} available, ${item.requested} requested`)
          .join('\n')
        setMessage({ type: 'error', text: `Insufficient stock:\n${stockErrors}` })
      } else {
        setMessage({ type: 'error', text: result.error || result.message || 'Failed to complete sale' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error during checkout' })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-3">Cart</h3>
      
      {message && (
        <div className={`text-sm p-2 rounded-md mb-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-3 max-h-64 overflow-auto">
        {items.length === 0 && <div className="text-sm text-slate-500">No items</div>}
        {items.map(it=> {
          const product = products.find((p: any) => p.id === it.product.id)
          const hasInsufficientStock = product && product.stock < it.qty
          return (
            <div key={it.product.id} className={`flex items-center justify-between p-2 rounded-md ${hasInsufficientStock ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
              <div className="flex-1">
                <div className="font-medium">{it.product.name}</div>
                <div className="text-sm text-slate-500">₱{it.product.price.toFixed(2)}</div>
                {hasInsufficientStock && (
                  <div className="text-xs text-red-600 mt-1">
                    Only {product?.stock} available
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={()=>changeQty(it.product.id, -1)} className="px-2">-</button>
                <div className="w-6 text-center">{it.qty}</div>
                <button onClick={()=>changeQty(it.product.id, 1)} className="px-2">+</button>
                <button onClick={()=>remove(it.product.id)} className="text-red-600 ml-2">Remove</button>
              </div>
            </div>
          )
        })}
      </div>

      {stockErrors.length > 0 && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-2">
          <div className="text-sm font-semibold text-red-700 mb-1">Stock Issues:</div>
          {stockErrors.map((error, idx) => (
            <div key={idx} className="text-xs text-red-600">{error}</div>
          ))}
        </div>
      )}

      <div className="mt-4 border-t pt-4">
        <div className="flex justify-between text-lg font-semibold">Total <div>₱{total.toFixed(2)}</div></div>
        <div className="mt-3">
          <label className="text-sm">Cash</label>
          <input 
            className="w-full mt-1 rounded-md border-gray-200 p-2" 
            type="number"
            placeholder="0.00"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <button 
            onClick={handleCheckout}
            disabled={loading || !canCheckout}
            title={stockErrors.length > 0 ? `Cannot checkout: ${stockErrors.join(', ')}` : ''}
            className="w-full bg-green-600 text-white py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-green-700 transition"
          >
            {loading ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  )
}
