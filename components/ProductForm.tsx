"use client"
import React, { useState, useEffect } from 'react'
import Modal from './Modal'

type Product = {
  id?: number
  name: string
  barcode: string
  price: number
  stock: number
  lowStockThreshold: number
  genericName?: string
  category?: string
  isPrescriptionRequired?: boolean
}

type Props = { open: boolean; onClose: () => void; onSave: (data: any) => void; product?: Product }

export default function ProductForm({ open, onClose, onSave, product }: Props) {
  const [name, setName] = useState('')
  const [barcode, setBarcode] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [threshold, setThreshold] = useState('')

  const [genericName, setGenericName] = useState('')
  const [category, setCategory] = useState('')
  const [isRx, setIsRx] = useState(false)
  const [kitchenStation, setKitchenStation] = useState('')
  const [batchNumber, setBatchNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  const [businessType, setBusinessType] = useState('RETAIL')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setBusinessType(JSON.parse(userStr).store?.businessType || 'RETAIL')
    }

    if (product) {
      setName(product.name)
      setBarcode(product.barcode || '')
      setPrice(product.price.toString())
      setStock(product.stock.toString())
      setThreshold(product.lowStockThreshold.toString())
      setGenericName(product.genericName || '')
      setCategory(product.category || '')
      setIsRx(product.isPrescriptionRequired || false)
      setKitchenStation((product as any).kitchenStation || '')
    } else {
      setName('')
      setBarcode('')
      setPrice('')
      setStock('')
      setThreshold('')
      setGenericName('')
      setCategory('')
      setIsRx(false)
      setKitchenStation('')
      setBatchNumber('')
      setExpiryDate('')
    }
  }, [product, open])

  const save = () => {
    onSave({
      name,
      barcode,
      price: parseFloat(price || '0'),
      stock: parseInt(stock || '0'),
      lowStockThreshold: parseInt(threshold || '0'),
      genericName,
      category,
      isPrescriptionRequired: isRx,
      kitchenStation,
      batchNumber,
      expiryDate
    })
  }

  return (
    <Modal open={open} onClose={onClose} title={product ? "Edit Item" : "Add Item"}>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
        {/* Basic Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{businessType === 'RESTAURANT' ? 'Menu Item Name' : 'Name'}</label>
            <input
              className="w-full h-11 px-4 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-sm"
              placeholder={businessType === 'RESTAURANT' ? 'e.g. Burger' : 'Name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{businessType === 'RESTAURANT' ? 'Item Code (Optional)' : 'Barcode'}</label>
            <input
              className="w-full h-11 px-4 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-700 placeholder:text-slate-300 shadow-sm"
              placeholder={businessType === 'RESTAURANT' ? 'e.g. B-01' : 'Barcode'}
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </div>
        </div>


        {/* Pricing & Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price</label>
            <input
              className="w-full h-11 px-4 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium shadow-sm"
              placeholder="0.00"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock</label>
            <input
              className="w-full h-11 px-4 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium shadow-sm"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>
        </div>

        {/* Pharmacy Initial Batch Section */}
        {businessType === 'PHARMACY' && !product && (
          <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-4">
            <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Initial Batch Entry</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch #</label>
                <input
                  className="w-full h-11 px-4 rounded-xl border-white bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium shadow-sm"
                  placeholder="e.g. B-123"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                <input
                  type="date"
                  className="w-full h-11 px-4 rounded-xl border-white bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium shadow-sm"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Low Stock Alert at</label>
          <input
            className="w-full h-11 px-4 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium shadow-sm"
            placeholder="e.g., 5"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>

        <div className="flex items-center space-x-3 pt-6">
          <button
            onClick={onClose}
            className="flex-1 h-14 rounded-2xl border-2 border-slate-100 font-black text-slate-400 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="flex-[2] h-14 rounded-2xl bg-blue-600 font-black text-white shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            {product ? "Update Item" : "Create Item"}
          </button>
        </div>
      </div>
    </Modal>
  )
}
