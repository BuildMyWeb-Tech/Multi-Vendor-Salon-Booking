import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SalonAdminContext } from '../../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import { Search, Plus, Pencil, Trash2, Package, X, AlertTriangle } from 'lucide-react';

const ManageProducts = () => {
  const { billingApi, shopInfo } = useContext(SalonAdminContext);
  const navigate = useNavigate();
  const slug = shopInfo?.slug || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', variants: [] });
  const [editSaving, setEditSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await billingApi.getProducts({ search, category });
      if (data.success) setProducts(data.products);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [search, category]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data } = await billingApi.deleteProduct(deleteTarget._id);
      if (data.success) {
        toast.success('Product archived');
        setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
        setDeleteTarget(null);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to archive product');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = (product) => {
    setEditTarget(product);
    setEditForm({
      name: product.name,
      category: product.category || '',
      variants: product.variants.map((v) => ({ ...v })),
    });
  };

  const setVariant = (idx, field, value) =>
    setEditForm((f) => ({ ...f, variants: f.variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v)) }));

  const addEditVariant = () =>
    setEditForm((f) => ({ ...f, variants: [...f.variants, { size: '', price: '', stock: '', barcode: '', lowStockThreshold: 5 }] }));

  const removeEditVariant = (idx) =>
    setEditForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));

  const handleEditSave = async () => {
    if (!editForm.name.trim()) { toast.error('Product name is required'); return; }
    setEditSaving(true);
    try {
      const { data } = await billingApi.updateProduct(editTarget._id, {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        variants: JSON.stringify(editForm.variants.map((v) => ({
          _id: v._id,
          size: v.size,
          price: Number(v.price),
          stock: Number(v.stock) || 0,
          barcode: v.barcode || '',
          lowStockThreshold: Number(v.lowStockThreshold) || 5,
        }))),
      });
      if (data.success) {
        toast.success('Product updated');
        setProducts((prev) => prev.map((p) => (p._id === editTarget._id ? data.product : p)));
        setEditTarget(null);
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to update');
    } finally {
      setEditSaving(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white';

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package size={18} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Manage Products</h1>
            <p className="text-xs text-gray-400">{products.length} product{products.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/${slug}/admin/add-product`)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary bg-white"
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {categories.length > 0 && (
          <select
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Product list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading…</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Package size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No products yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Product" to get started</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-left px-5 py-3 hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3">Variants</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-800">{p.name}</td>
                  <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">{p.category || '—'}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {p.variants.map((v) => (
                        <span key={v._id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                          ${v.stock === 0 ? 'bg-red-50 text-red-600' : v.stock <= v.lowStockThreshold ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                          {v.size} · ₹{v.price} · {v.stock} pcs
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-800 text-center mb-1">Archive Product?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              "<strong>{deleteTarget.name}</strong>" will be archived and hidden from the system. Existing bills won't be affected.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-all">
                {deleting ? 'Archiving…' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-800">Edit Product</h3>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Product Name *</label>
                  <input className={inputCls} value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <input className={inputCls} value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-600">Variants</p>
                  <button type="button" onClick={addEditVariant} className="text-xs text-primary flex items-center gap-1 hover:underline">
                    <Plus size={12} /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {editForm.variants.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-xl relative">
                      <div><label className="block text-xs text-gray-400 mb-0.5">Size</label><input className={inputCls} value={v.size} onChange={(e) => setVariant(idx, 'size', e.target.value)} /></div>
                      <div><label className="block text-xs text-gray-400 mb-0.5">Price ₹</label><input className={inputCls} type="number" min="0" value={v.price} onChange={(e) => setVariant(idx, 'price', e.target.value)} /></div>
                      <div><label className="block text-xs text-gray-400 mb-0.5">Stock</label><input className={inputCls} type="number" min="0" value={v.stock} onChange={(e) => setVariant(idx, 'stock', e.target.value)} /></div>
                      <div><label className="block text-xs text-gray-400 mb-0.5">Low Alert</label><input className={inputCls} type="number" min="0" value={v.lowStockThreshold} onChange={(e) => setVariant(idx, 'lowStockThreshold', e.target.value)} /></div>
                      {editForm.variants.length > 1 && (
                        <button type="button" onClick={() => removeEditVariant(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-500">
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditTarget(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleEditSave} disabled={editSaving} className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium">
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
