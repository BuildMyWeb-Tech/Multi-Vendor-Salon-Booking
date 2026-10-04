import React, { useContext, useEffect, useState } from 'react';
import { SalonAdminContext } from '../../context/SalonAdminContext';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  Percent, Plus, Pencil, Trash2, Check, X, Loader2, Receipt,
} from 'lucide-react';

const TaxSettings = () => {
  const { backendUrl, saAdminToken, shopInfo } = useContext(SalonAdminContext);
  const navigate = useNavigate();
  const { shopSlug } = useParams();

  useEffect(() => {
    if (shopInfo && !shopInfo.serviceBillingEnabled && !shopInfo.productBillingEnabled) {
      navigate(`/${shopSlug}/admin/dashboard`);
    }
  }, [shopInfo, shopSlug]);
  const headers = { satoken: saAdminToken };

  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add-new form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPercent, setNewPercent] = useState('');
  const [adding, setAdding] = useState(false);

  // Inline edit state: { [id]: { name, percent } }
  const [editing, setEditing] = useState({});
  const [saving, setSaving] = useState({});
  const [deleting, setDeleting] = useState({});

  const fetchTaxes = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/taxes`, { headers });
      if (data.success) setTaxes(data.taxes);
    } catch { toast.error('Failed to load taxes'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTaxes(); }, []);

  const totalPercent = taxes.filter(t => t.isActive).reduce((s, t) => s + t.percent, 0);

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error('Enter a tax name'); return; }
    const p = parseFloat(newPercent);
    if (isNaN(p) || p < 0 || p > 100) { toast.error('Percent must be 0–100'); return; }
    setAdding(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/salon-admin/taxes`, { name: newName.trim(), percent: p }, { headers });
      if (data.success) {
        setTaxes(prev => [...prev, data.tax]);
        setNewName(''); setNewPercent(''); setShowAdd(false);
        toast.success(`${data.tax.name} added`);
      } else { toast.error(data.message); }
    } catch { toast.error('Failed to add tax'); }
    finally { setAdding(false); }
  };

  const startEdit = (tax) => {
    setEditing(prev => ({ ...prev, [tax._id]: { name: tax.name, percent: String(tax.percent) } }));
  };

  const cancelEdit = (id) => {
    setEditing(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleSave = async (id) => {
    const e = editing[id];
    if (!e.name.trim()) { toast.error('Name required'); return; }
    const p = parseFloat(e.percent);
    if (isNaN(p) || p < 0 || p > 100) { toast.error('Percent must be 0–100'); return; }
    setSaving(prev => ({ ...prev, [id]: true }));
    try {
      const { data } = await axios.put(`${backendUrl}/api/salon-admin/taxes/${id}`, { name: e.name.trim(), percent: p }, { headers });
      if (data.success) {
        setTaxes(prev => prev.map(t => t._id === id ? data.tax : t));
        cancelEdit(id);
        toast.success('Tax updated');
      } else { toast.error(data.message); }
    } catch { toast.error('Failed to save'); }
    finally { setSaving(prev => ({ ...prev, [id]: false })); }
  };

  const handleToggle = async (tax) => {
    try {
      const { data } = await axios.put(`${backendUrl}/api/salon-admin/taxes/${tax._id}`, { isActive: !tax.isActive }, { headers });
      if (data.success) setTaxes(prev => prev.map(t => t._id === tax._id ? data.tax : t));
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    setDeleting(prev => ({ ...prev, [id]: true }));
    try {
      const { data } = await axios.delete(`${backendUrl}/api/salon-admin/taxes/${id}`, { headers });
      if (data.success) {
        setTaxes(prev => prev.filter(t => t._id !== id));
        toast.success('Tax removed');
      } else { toast.error(data.message); }
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(prev => ({ ...prev, [id]: false })); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Percent size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Tax Management</h1>
            <p className="text-xs text-gray-400">Configure taxes applied to bills in this salon</p>
          </div>
        </div>
        <button
          onClick={() => { setShowAdd(true); setNewName(''); setNewPercent(''); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
        >
          <Plus size={16} /> Add Tax
        </button>
      </div>

      {/* Summary banner */}
      {taxes.filter(t => t.isActive).length > 0 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-2xl px-5 py-3.5">
          <Receipt size={16} className="text-primary flex-shrink-0" />
          <div className="flex-1 flex flex-wrap gap-2">
            {taxes.filter(t => t.isActive).map(t => (
              <span key={t._id} className="bg-white border border-primary/20 text-primary text-xs font-semibold px-2.5 py-1 rounded-lg">
                {t.name} {t.percent}%
              </span>
            ))}
          </div>
          <span className="text-sm font-bold text-primary shrink-0">Total {totalPercent}%</span>
        </div>
      )}

      {/* Add new tax inline form */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-primary/20 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">New Tax</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Tax Name</label>
              <input
                autoFocus
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
                placeholder="e.g. GST, CGST, SGST, VAT"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="w-32">
              <label className="text-xs text-gray-500 font-medium block mb-1.5">Percentage</label>
              <div className="relative">
                <input
                  type="number" min="0" max="100" step="0.01"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary pr-7"
                  placeholder="0"
                  value={newPercent}
                  onChange={e => setNewPercent(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={adding}
                className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
              >
                {adding ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tax list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 size={22} className="animate-spin mr-2" /> Loading taxes…
          </div>
        ) : taxes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Percent size={36} className="opacity-20 mb-3" />
            <p className="text-sm font-medium text-gray-500">No taxes configured</p>
            <p className="text-xs mt-1">Click "Add Tax" to create your first tax (e.g. GST 9%)</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {/* Table header */}
            <div className="grid grid-cols-12 px-5 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50/60">
              <span className="col-span-5">Tax Name</span>
              <span className="col-span-2 text-center">Rate</span>
              <span className="col-span-2 text-center">Status</span>
              <span className="col-span-3 text-right">Actions</span>
            </div>

            {taxes.map(tax => {
              const isEditing = !!editing[tax._id];
              const e = editing[tax._id] || {};
              return (
                <div key={tax._id} className={`grid grid-cols-12 items-center px-5 py-3.5 transition-colors ${isEditing ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'}`}>
                  {/* Name */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Percent size={13} className="text-primary" />
                    </div>
                    {isEditing ? (
                      <input
                        autoFocus
                        className="flex-1 border border-primary/30 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary bg-white"
                        value={e.name}
                        onChange={ev => setEditing(prev => ({ ...prev, [tax._id]: { ...prev[tax._id], name: ev.target.value } }))}
                      />
                    ) : (
                      <span className="text-sm font-semibold text-gray-800">{tax.name}</span>
                    )}
                  </div>

                  {/* Percent */}
                  <div className="col-span-2 flex justify-center">
                    {isEditing ? (
                      <div className="relative w-20">
                        <input
                          type="number" min="0" max="100" step="0.01"
                          className="w-full border border-primary/30 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary bg-white pr-6 text-center"
                          value={e.percent}
                          onChange={ev => setEditing(prev => ({ ...prev, [tax._id]: { ...prev[tax._id], percent: ev.target.value } }))}
                          onKeyDown={ev => ev.key === 'Enter' && handleSave(tax._id)}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">{tax.percent}%</span>
                    )}
                  </div>

                  {/* Active toggle */}
                  <div className="col-span-2 flex justify-center">
                    <button
                      onClick={() => handleToggle(tax)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${tax.isActive ? 'bg-primary' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${tax.isActive ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="col-span-3 flex items-center justify-end gap-1.5">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSave(tax._id)}
                          disabled={saving[tax._id]}
                          className="flex items-center gap-1 text-xs bg-emerald-500 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                        >
                          {saving[tax._id] ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Save
                        </button>
                        <button onClick={() => cancelEdit(tax._id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(tax)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-primary/5 hover:border-primary/30 text-gray-400 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(tax._id)}
                          disabled={deleting[tax._id]}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors"
                          title="Delete"
                        >
                          {deleting[tax._id] ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxSettings;
