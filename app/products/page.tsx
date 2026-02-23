"use client"
import React, { useState, useEffect } from 'react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import ProductForm from '../../components/ProductForm'

type Product = {
  id: number
  name: string
  barcode: string
  price: number
  stock: number
  lowStockThreshold: number
  category?: string
  isArchived: boolean
}

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [businessType, setBusinessType] = useState('RETAIL')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    const storeStr = localStorage.getItem('store')
    if (userStr && storeStr) {
      const userData = JSON.parse(userStr)
      const storeData = JSON.parse(storeStr)
      setUser(userData)
      setBusinessType(storeData.businessType || 'RETAIL')
      fetchProducts(storeData.id, showArchived)
    }
  }, [showArchived])

  const fetchProducts = async (storeId: number, includeArchived: boolean) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products?storeId=${storeId}&includeArchived=${includeArchived}`)
      const data = await response.json()
      if (data.success) {
        setItems(data.data)
      } else {
        setError(data.error || 'Failed to fetch products')
      }
    } catch (err) {
      setError('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddProduct = async (newItem: any) => {
    try {
      const method = editingProduct ? 'PUT' : 'POST'
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, storeId: user?.storeId }),
      })
      const data = await response.json()
      if (data.success) {
        if (editingProduct) {
          setItems(prev => prev.map(p => p.id === editingProduct.id ? data.data : p))
        } else {
          setItems(prev => [data.data, ...prev])
        }
        setOpen(false)
        setEditingProduct(undefined)
      } else {
        setError(data.error || 'Failed to save product')
      }
    } catch (err) {
      setError('Failed to save product')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setOpen(true)
  }

  const handleDelete = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    setDeleting(productId)
    setError(null)
    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        setItems(prev => prev.filter(p => p.id !== productId))
      } else {
        setError(data.error || 'Failed to delete product')
      }
    } catch (err) {
      setError('Failed to delete product')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleArchive = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          isArchived: !product.isArchived
        }),
      })
      const data = await response.json()
      if (data.success) {
        setItems(prev => prev.filter(p => p.id !== product.id))
      } else {
        setError(data.error || 'Failed to update product status')
      }
    } catch (err) {
      setError('Failed to update product status')
    }
  }

  const getPageTitle = () => {
    if (businessType === 'RESTAURANT') return 'Menu'
    if (businessType === 'PHARMACY') return 'Medicines'
    if (businessType === 'GYM') return 'Services'
    return 'Products'
  }

  const getAddLabel = () => {
    if (businessType === 'RESTAURANT') return 'Add Item'
    if (businessType === 'GYM') return 'Add Service'
    return 'Add Product'
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">{getPageTitle()}</h1>
        {(user?.role === 'owner' || !user) && (
          <button
            onClick={() => setOpen(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center space-x-2"
          >
            <span>+</span>
            <span>{getAddLabel()}</span>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => setShowArchived(false)}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition ${!showArchived ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          Active
        </button>
        <button
          onClick={() => setShowArchived(true)}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition ${showArchived ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          Archived
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold flex items-center space-x-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-50">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-slate-400 py-12 font-bold text-sm">
            No items yet. Click "{getAddLabel()}" to create one.
          </div>
        ) : (
          <Table columns={
            businessType === 'PHARMACY'
              ? ["Medicine Name", "Batch Number", "Expiration Date", "Price", "Stock", ...(user?.role === 'owner' ? ["Actions"] : [])]
              : businessType === 'RETAIL'
                ? ["Product Name", "Barcode", "Price", "Stock", ...(user?.role === 'owner' ? ["Actions"] : [])]
                : ["Name", "Barcode", "Category", "Price", "Stock", ...(user?.role === 'owner' ? ["Actions"] : [])]
          }>
            {items.map(p => {
              const isLow = p.stock <= p.lowStockThreshold
              return (
                <tr key={p.id} className={`group hover:bg-slate-50 transition-colors ${isLow && businessType === 'RETAIL' ? 'bg-rose-50/40' : ''}`}>
                  <td className="px-6 py-5 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-[14px] uppercase tracking-tight group-hover:text-blue-600 truncate max-w-[200px]">{p.name}</span>
                      {(p as any).isPrescriptionRequired && (
                        <span className="mt-1 w-max bg-red-50 text-red-500 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-red-100 italic">Rx Required</span>
                      )}
                    </div>
                  </td>

                  {businessType === 'PHARMACY' ? (
                    <>
                      <td className="px-6 py-5">
                        <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                          {(p as any).batches?.[0]?.batchNumber || '---'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {(() => {
                          const batches = (p as any).batches
                          if (!batches || batches.length === 0) return <span className="text-slate-300">—</span>
                          const date = new Date(batches[0].expiryDate)
                          const isExpired = date < new Date()
                          const isExpiringSoon = date < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

                          if (isExpired) {
                            return <span className="px-3 py-1 bg-red-50 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100">Expired</span>
                          }
                          if (isExpiringSoon) {
                            return (
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-amber-500">{date.toLocaleDateString()}</span>
                                <span className="text-[8px] font-black text-amber-500/60 uppercase">Expiring Soon</span>
                              </div>
                            )
                          }
                          return <span className="font-bold text-slate-400 text-[11px]">{date.toLocaleDateString()}</span>
                        })()}
                      </td>
                    </>
                  ) : businessType === 'RETAIL' ? (
                    <td className="px-6 py-6 font-bold text-slate-400 tracking-[0.1em] text-[10px] uppercase">{p.barcode || '---'}</td>
                  ) : (
                    <>
                      <td className="px-6 py-6 font-bold text-slate-400 tracking-[0.1em] text-[10px] uppercase">{p.barcode || '---'}</td>
                      <td className="px-6 py-5">
                        <span className="bg-slate-50 text-slate-500 border border-slate-100 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                          {p.category || 'General'}
                        </span>
                      </td>
                    </>
                  )}

                  <td className="px-6 py-5 text-right">
                    <span className="text-blue-600 font-black tracking-tight text-[15px]">
                      ₱{p.price.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all ${isLow ? 'bg-rose-50 text-rose-500 border-rose-100 shadow-sm' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                      {p.stock} units
                      {isLow && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all hover:scale-110 active:scale-90"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => handleToggleArchive(p)}
                        title={p.isArchived ? "Restore" : "Archive"}
                        className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-90 ${p.isArchived ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {p.isArchived
                            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          }
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all hover:scale-110 active:scale-90 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </Table>
        )}
      </div>

      <ProductForm open={open} onClose={() => { setOpen(false); setEditingProduct(undefined); }} onSave={handleAddProduct} product={editingProduct} />
    </div>
  )
}
