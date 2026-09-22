import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SalonAdminContext } from '../../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import {
  Search, Plus, Pencil, Trash2, Package, X, AlertTriangle,
  Tag, Layers, BarChart2, Filter,
} from 'lucide-react';

const StockBadge = ({ stock, threshold }) => {
  if (stock === 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100"><span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Out of Stock</span>;
  if (stock <= threshold) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />Low ({stock})</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />{stock} in stock</span>;
};

const ManageProducts = () => {
  const { billingApi, shopInfo } = useContext(SalonAdminContext);
  const navigate = useNavigate();
  const slug = shopInfo?.slug || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', category: '', variants: [] });
  const [editSaving, setEditSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await billingApi.getProducts({ search, category });
      if (data.success) setProducts(data.products);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, [search, category]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data } = await billingApi.deleteProduct(deleteTarget._id);
      if (data.success) {
        toast.success('Product archived');
        setProducts((prev) => prev.filter((p) => p._id !== deleteTarget._id));
        setDeleteTarget(null);
      } else toast.error(data.message);
    } catch { toast.error('Failed to archive product'); }
    finally { setDeleting(false); }
  };

  const openEdit = (product) => {
    setEditTarget(product);
    setEditForm({ name: product.name, category: product.category || '', variants: product.variants.map((v) => ({ ...v })) });
  };

  const setVariant = (idx, field, value) =>
    setEditForm((f) => ({ ...f, variants: f.variants.map((v, i) => (i === idx ? { ...v, [field]: value } : v)) }));

  const handleEditSave = async () => {
    if (!editForm.name.trim()) { toast.error('Product name is required'); return; }
    setEditSaving(true);
    try {
      const { data } = await billingApi.updateProduct(editTarget._id, {
        name: editForm.name.trim(),
        category: editForm.category.trim(),
        variants: JSON.stringify(editForm.variants.map((v) => ({
          _id: v._id, size: v.size, price: Number(v.price),
          stock: Number(v.stock) || 0, barcode: v.barcode || '',
          lowStockThreshold: Number(v.lowStockThreshold) || 5,
        }))),
      });
      if (data.success) {
        toast.success('Product updated');
        setProducts((prev) => prev.map((p) => (p._id === editTarget._id ? data.product : p)));
        setEditTarget(null);
      } else toast.error(data.message);
    } catch { toast.error('Failed to update'); }
    finally { setEditSaving(false); }
  };

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white';
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const totalVariants = products.reduce((s, p) => s + p.variants.length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Package size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Manage Products</h1>
            <p className="text-xs text-gray-400 mt-0.5">{products.length} products · {totalVariants} variants</p>
          </div>
        </div>
        <button
          onClick={() => navigate(`/${slug}/admin/add-product`)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shadow-primary/20"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Products', value: products.length, icon: Package, color: 'bg-blue-50 text-blue-600' },
          { label: 'Variants', value: totalVariants, icon: Layers, color: 'bg-purple-50 text-purple-600' },
          { label: 'Categories', value: categories.length, icon: Tag, color: 'bg-amber-50 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-800 leading-none">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
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
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              className="border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary bg-white appearance-none cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Package size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No products yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Product" to get started</p>
          <button onClick={() => navigate(`/${slug}/admin/add-product`)}
            className="mt-4 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all">
            <Plus size={15} /> Add First Product
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Variants & Stock</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50/40 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package size={14} className="text-primary" />
                      </div>
                      <span className="font-semibold text-gray-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    {p.category ? (
                      <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        <Tag size={10} />{p.category}
                      </span>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      {p.variants.map((v) => (
                        <div key={v._id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-1.5">
                          <span className="text-xs font-medium text-gray-700">{v.size}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <span className="text-xs font-semibold text-primary">₹{v.price}</span>
                          <span className="text-xs text-gray-400">·</span>
                          <StockBadge stock={v.stock} threshold={v.lowStockThreshold} />
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => openEdit(p)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-100 text-gray-400 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={22} className="text-red-500" />
            </div>
            <h3 className="text-base font-bold text-gray-800 text-center mb-1">Archive Product?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              "<strong>{deleteTarget.name}</strong>" will be hidden. Existing bills are unaffected.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium">
                {deleting ? 'Archiving…' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Pencil size={16} className="text-primary" />
                <h3 className="font-bold text-gray-800">Edit Product</h3>
              </div>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label>
                  <input className={inputCls} value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <input className={inputCls} value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Layers size={13} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">Variants</span>
                  </div>
                  <button type="button"
                    onClick={() => setEditForm((f) => ({ ...f, variants: [...f.variants, { size: '', price: '', stock: '', barcode: '', lowStockThreshold: 5 }] }))}
                    className="text-xs text-primary flex items-center gap-1 hover:underline border border-primary/20 px-2 py-0.5 rounded-lg hover:bg-primary/5">
                    <Plus size={11} /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {editForm.variants.map((v, idx) => (
                    <div key={idx} className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-xl relative">
                      <div className="col-span-2">
                        <label className="block text-xs text-gray-400 mb-0.5">Size / Name</label>
                        <input className={inputCls} value={v.size} onChange={(e) => setVariant(idx, 'size', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-0.5">Price ₹</label>
                        <input className={inputCls} type="number" min="0" value={v.price} onChange={(e) => setVariant(idx, 'price', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-0.5">Stock</label>
                        <input className={inputCls} type="number" min="0" value={v.stock} onChange={(e) => setVariant(idx, 'stock', e.target.value)} />
                      </div>
                      {editForm.variants.length > 1 && (
                        <button type="button"
                          onClick={() => setEditForm((f) => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }))}
                          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded transition-colors">
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditTarget(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleEditSave} disabled={editSaving} className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold">
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageProducts;
