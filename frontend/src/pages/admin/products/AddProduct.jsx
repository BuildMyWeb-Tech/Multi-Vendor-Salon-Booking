import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SalonAdminContext } from '../../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import { Plus, Trash2, Package } from 'lucide-react';

const defaultVariant = () => ({ size: '', price: '', stock: '', barcode: '', lowStockThreshold: 5 });

const AddProduct = () => {
  const { billingApi, shopInfo } = useContext(SalonAdminContext);
  const navigate = useNavigate();
  const slug = shopInfo?.slug || '';

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [variants, setVariants] = useState([defaultVariant()]);
  const [saving, setSaving] = useState(false);

  const setVariant = (idx, field, value) =>
    setVariants((prev) => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));

  const addVariant = () => setVariants((prev) => [...prev, defaultVariant()]);
  const removeVariant = (idx) => setVariants((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Product name is required'); return; }
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.size.trim()) { toast.error(`Variant ${i + 1}: size/name is required`); return; }
      if (v.price === '' || isNaN(v.price) || Number(v.price) < 0) { toast.error(`Variant ${i + 1}: valid price required`); return; }
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        variants: JSON.stringify(variants.map((v) => ({
          size: v.size.trim(),
          price: Number(v.price),
          stock: Number(v.stock) || 0,
          barcode: v.barcode.trim(),
          lowStockThreshold: Number(v.lowStockThreshold) || 5,
        }))),
      };
      const { data } = await billingApi.createProduct(payload);
      if (data.success) {
        toast.success('Product added!');
        navigate(`/${slug}/admin/products`);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to add product');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white placeholder-gray-400';

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Package size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Add Product</h1>
          <p className="text-xs text-gray-400">Add a new product with variants to your inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        {/* Product info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-red-500">*</span></label>
            <input className={inputCls} placeholder="e.g. Shampoo" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input className={inputCls} placeholder="e.g. Hair Care" value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>
        </div>

        {/* Variants */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Variants / Sizes</p>
            <button type="button" onClick={addVariant} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium border border-primary/30 px-2.5 py-1 rounded-lg hover:bg-primary/5 transition-all">
              <Plus size={13} /> Add Variant
            </button>
          </div>

          <div className="space-y-3">
            {variants.map((v, idx) => (
              <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50 relative">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-xs text-gray-500 mb-1">Size / Name <span className="text-red-500">*</span></label>
                    <input className={inputCls} placeholder="100ml / Default" value={v.size} onChange={(e) => setVariant(idx, 'size', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Price (₹) <span className="text-red-500">*</span></label>
                    <input className={inputCls} type="number" min="0" placeholder="0" value={v.price} onChange={(e) => setVariant(idx, 'price', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Stock</label>
                    <input className={inputCls} type="number" min="0" placeholder="0" value={v.stock} onChange={(e) => setVariant(idx, 'stock', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Low Stock Alert</label>
                    <input className={inputCls} type="number" min="0" placeholder="5" value={v.lowStockThreshold} onChange={(e) => setVariant(idx, 'lowStockThreshold', e.target.value)} />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-xs text-gray-500 mb-1">Barcode (optional)</label>
                    <input className={inputCls} placeholder="Scan or type barcode" value={v.barcode} onChange={(e) => setVariant(idx, 'barcode', e.target.value)} />
                  </div>
                </div>
                {variants.length > 1 && (
                  <button type="button" onClick={() => removeVariant(idx)} className="absolute top-3 right-3 text-red-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
            {saving ? 'Saving…' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
