import React, { useContext, useEffect, useState } from 'react';
import { SalonAdminContext } from '../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import { Tag, Plus, Trash2, Pencil, Check, X, Clock, Infinity } from 'lucide-react';

const EMPTY = { code: '', discountPercent: '', expiryDate: '', lifetime: true };

const Coupons = () => {
  const { discountApi } = useContext(SalonAdminContext);
  const [coupons, setCoupons]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await discountApi.getCoupons();
      if (data.success) setCoupons(data.coupons);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowForm(true); };
  const openEdit   = (c) => {
    setForm({
      code: c.code,
      discountPercent: String(c.discountPercent),
      expiryDate: c.expiryDate ? c.expiryDate.slice(0, 10) : '',
      lifetime: !c.expiryDate,
    });
    setEditId(c._id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) return toast.error('Coupon code is required');
    if (!form.discountPercent || +form.discountPercent < 1 || +form.discountPercent > 100)
      return toast.error('Discount must be 1–100%');
    if (!form.lifetime && !form.expiryDate) return toast.error('Please set an expiry date or choose Lifetime');

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountPercent: +form.discountPercent,
        expiryDate: form.lifetime ? null : form.expiryDate,
      };
      const { data } = editId
        ? await discountApi.updateCoupon(editId, payload)
        : await discountApi.createCoupon(payload);
      if (data.success) { toast.success(data.message); closeForm(); load(); }
      else toast.error(data.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const { data } = await discountApi.deleteCoupon(id);
      if (data.success) { toast.success(data.message); load(); }
      else toast.error(data.message);
    } finally { setDeleting(null); }
  };

  const isExpired = (c) => c.expiryDate && new Date() > new Date(c.expiryDate);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Coupon Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus size={15} /> New Coupon
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">{editId ? 'Edit Coupon' : 'New Coupon'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Coupon Code</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase tracking-widest focus:outline-none focus:border-primary bg-gray-50"
                  placeholder="e.g. SAVE20"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                />
                <p className="text-xs text-gray-400 mt-1">Only share this code with customers verbally or via WhatsApp — it will not be shown on the booking page.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Discount %</label>
                <input
                  type="number" min="1" max="100"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-gray-50"
                  placeholder="e.g. 10"
                  value={form.discountPercent}
                  onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Validity</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, lifetime: true, expiryDate: '' }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm font-medium transition-all ${form.lifetime ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500 hover:border-primary/40'}`}
                  >
                    <Infinity size={13} /> Lifetime
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, lifetime: false }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-sm font-medium transition-all ${!form.lifetime ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500 hover:border-primary/40'}`}
                  >
                    <Clock size={13} /> Set Expiry
                  </button>
                </div>
                {!form.lifetime && (
                  <input
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-gray-50"
                    value={form.expiryDate}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                  />
                )}
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-all">
                  {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16">
          <Tag size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">No coupons yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coupons.map((c) => {
            const expired = isExpired(c);
            return (
              <div key={c._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-sm font-bold text-gray-800 tracking-wider bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
                      {c.code}
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${expired ? 'text-red-500 bg-red-50 border-red-100' : c.isActive ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-gray-400 bg-gray-50 border-gray-100'}`}>
                    {expired ? 'Expired' : c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Discount</p>
                    <p className="font-bold text-primary">{c.discountPercent}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Validity</p>
                    <p className="font-medium text-gray-700 flex items-center gap-1">
                      {c.expiryDate
                        ? <><Clock size={11} />{new Date(c.expiryDate).toLocaleDateString('en-IN')}</>
                        : <><Infinity size={11} /> Lifetime</>}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 py-1.5 rounded-xl text-xs hover:bg-gray-50 transition-all"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    disabled={deleting === c._id}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-red-100 text-red-400 py-1.5 rounded-xl text-xs hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    <Trash2 size={11} /> {deleting === c._id ? '…' : 'Delete'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Coupons;
