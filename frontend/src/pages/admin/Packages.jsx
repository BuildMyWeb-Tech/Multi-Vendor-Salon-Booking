import React, { useContext, useEffect, useState } from 'react';
import { SalonAdminContext } from '../../context/SalonAdminContext';
import { toast } from 'react-toastify';
import { Gift, Plus, Trash2, Pencil, X, CheckSquare, Square } from 'lucide-react';
import axios from 'axios';

const EMPTY = { name: '', serviceIds: [], discountPercent: '' };

const Packages = () => {
  const { discountApi, backendUrl, saAdminToken } = useContext(SalonAdminContext);
  const [packages, setPackages] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  const headers = () => ({ satoken: saAdminToken });

  const load = async () => {
    setLoading(true);
    try {
      const [pkgRes, svcRes] = await Promise.all([
        discountApi.getPackages(),
        axios.get(`${backendUrl}/api/salon-admin/services`, { headers: headers() }),
      ]);
      if (pkgRes.data.success) setPackages(pkgRes.data.packages);
      if (svcRes.data.success) setServices(svcRes.data.services || svcRes.data.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditId(null); setShowForm(true); };
  const openEdit   = (p) => {
    setForm({ name: p.name, serviceIds: p.serviceIds, discountPercent: String(p.discountPercent) });
    setEditId(p._id);
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const toggleService = (id) => {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter((s) => s !== id) : [...f.serviceIds, id],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Package name is required');
    if (form.serviceIds.length < 2) return toast.error('Select at least 2 services');
    if (!form.discountPercent || +form.discountPercent < 1 || +form.discountPercent > 100)
      return toast.error('Discount must be 1–100%');

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        serviceIds: form.serviceIds,
        discountPercent: +form.discountPercent,
      };
      const { data } = editId
        ? await discountApi.updatePackage(editId, payload)
        : await discountApi.createPackage(payload);
      if (data.success) { toast.success(data.message); closeForm(); load(); }
      else toast.error(data.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      const { data } = await discountApi.deletePackage(id);
      if (data.success) { toast.success(data.message); load(); }
      else toast.error(data.message);
    } finally { setDeleting(null); }
  };

  const serviceMap = Object.fromEntries(services.map((s) => [String(s._id), s]));

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Package Discounts</h1>
          <p className="text-sm text-gray-400 mt-0.5">{packages.length} package{packages.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus size={15} /> New Package
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h2 className="font-bold text-gray-800">{editId ? 'Edit Package' : 'New Package'}</h2>
              <button onClick={closeForm} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Package Name (internal only)</label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-gray-50"
                  placeholder="e.g. Bridal Package"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Select Services ({form.serviceIds.length} selected — min 2)
                </label>
                {services.length === 0 ? (
                  <p className="text-xs text-gray-400 py-2">No services found. Add services first.</p>
                ) : (
                  <div className="border border-gray-100 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    {services.map((s) => {
                      const selected = form.serviceIds.includes(String(s._id));
                      return (
                        <button
                          key={s._id}
                          type="button"
                          onClick={() => toggleService(String(s._id))}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-0 transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-gray-50'}`}
                        >
                          {selected
                            ? <CheckSquare size={15} className="text-primary flex-shrink-0" />
                            : <Square size={15} className="text-gray-300 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{s.name}</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-600">₹{s.basePrice ?? s.price ?? 0}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Package Discount %</label>
                <input
                  type="number" min="1" max="100"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary bg-gray-50"
                  placeholder="e.g. 20"
                  value={form.discountPercent}
                  onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Applied automatically when a customer selects exactly these services. Not shown to customers.
                </p>
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
      ) : packages.length === 0 ? (
        <div className="text-center py-16">
          <Gift size={32} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">No packages yet. Create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((p) => {
            const svcs = p.serviceIds.map((id) => serviceMap[id]).filter(Boolean);
            const total = svcs.reduce((s, sv) => s + (sv.basePrice ?? sv.price ?? 0), 0);
            const discounted = Math.round(total * (1 - p.discountPercent / 100));
            return (
              <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.serviceIds.length} service{p.serviceIds.length !== 1 ? 's' : ''}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${p.isActive ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-gray-400 bg-gray-50 border-gray-100'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="space-y-1">
                  {svcs.length > 0 ? svcs.map((s) => (
                    <div key={s._id} className="flex justify-between text-xs text-gray-600">
                      <span className="truncate">{s.name}</span>
                      <span>₹{s.basePrice ?? s.price ?? 0}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-gray-400 italic">Services not found</p>
                  )}
                </div>

                {total > 0 && (
                  <div className="border-t border-gray-50 pt-2 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 line-through">₹{total}</p>
                      <p className="font-bold text-primary">₹{discounted}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      {p.discountPercent}% off
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 py-1.5 rounded-xl text-xs hover:bg-gray-50 transition-all"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    disabled={deleting === p._id}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-red-100 text-red-400 py-1.5 rounded-xl text-xs hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    <Trash2 size={11} /> {deleting === p._id ? '…' : 'Delete'}
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

export default Packages;
