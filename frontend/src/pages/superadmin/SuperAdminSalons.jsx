import React, { useContext, useEffect, useRef, useState } from 'react';
import { SuperAdminContext } from '../../context/SuperAdminContext';
import {
  Store, Search, Plus, CheckCircle, Clock, Filter, RefreshCw,
  Eye, Pencil, Trash2, X, ExternalLink, Phone, Mail, MapPin,
  Building2, CreditCard, User, Upload, Globe, Loader2, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// Dynamic base URL — works locally and in production
const baseUrl = () => window.location.origin;

const SuperAdminSalons = () => {
  const { getAllSalons, salons, updateSalonStatus, updateSalon, deleteSalon, getSalonById, loading } = useContext(SuperAdminContext);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal state
  const [viewSalon, setViewSalon] = useState(null);
  const [editSalon, setEditSalon] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [editLogoPreview, setEditLogoPreview] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const logoInputRef = useRef(null);

  useEffect(() => {
    getAllSalons({ search, status: statusFilter });
  }, [search, statusFilter]);

  // ── Toggle active/inactive ──────────────────────────────────────────────────
  const handleToggleStatus = async (salon) => {
    const newStatus = salon.status === 'active' ? 'inactive' : 'active';
    await updateSalonStatus(salon.shopId, newStatus);
  };

  // ── Open Edit Modal ─────────────────────────────────────────────────────────
  const openEdit = (salon) => {
    setEditSalon(salon);
    setEditForm({
      shopName: salon.shopName || '',
      address: salon.address || '',
      city: salon.city || '',
      state: salon.state || '',
      pincode: salon.pincode || '',
      phone: salon.phone || '',
      email: salon.email || '',
      whatsapp: salon.whatsapp || '',
      businessName: salon.businessName || '',
      gstNumber: salon.gstNumber || '',
      setupAmount: salon.setupAmount ?? '',
      subscriptionAmount: salon.subscriptionAmount ?? '',
      billingCycle: salon.billingCycle || 'monthly',
      paymentStatus: salon.paymentStatus || 'pending',
    });
    setEditLogoFile(null);
    setEditLogoPreview(salon.logo || null);
  };

  const handleEditLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Logo must be under 5MB'); return; }
    setEditLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setEditLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleEditSave = async () => {
    if (!editForm.shopName) { toast.error('Salon name is required'); return; }
    setEditSaving(true);
    const fd = new FormData();
    Object.entries(editForm).forEach(([k, v]) => fd.append(k, v));
    if (editLogoFile) fd.append('logo', editLogoFile);
    const result = await updateSalon(editSalon.shopId, fd);
    setEditSaving(false);
    if (result?.success) {
      setEditSalon(null);
    } else {
      toast.error(result?.message || 'Failed to update salon');
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    const result = await deleteSalon(deleteTarget.shopId);
    setDeleteLoading(false);
    if (result?.success) {
      setDeleteTarget(null);
    } else {
      toast.error(result?.message || 'Delete failed');
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white';

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Salons</h1>
          <p className="text-gray-500 text-sm mt-0.5">{salons.length} salon{salons.length !== 1 ? 's' : ''} on the platform</p>
        </div>
        <Link
          to="/super-admin/salons/create"
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          Create Salon
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by salon name..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white appearance-none cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button
          onClick={() => getAllSalons({ search, status: statusFilter })}
          className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all bg-white"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading && salons.length === 0 ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : salons.length === 0 ? (
          <div className="py-16 text-center">
            <Store size={44} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium text-sm">No salons found</p>
            <Link to="/super-admin/salons/create" className="mt-3 inline-flex items-center gap-1 text-primary text-sm hover:underline">
              <Plus size={13} /> Create a new salon
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Salon</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Admin</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">URLs</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {salons.map((salon) => (
                  <tr key={salon.shopId} className="hover:bg-gray-50/60 transition-colors">
                    {/* Salon */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {salon.logo
                            ? <img src={salon.logo} alt={salon.shopName} className="w-full h-full object-cover" />
                            : <Store size={17} className="text-primary" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{salon.shopName}</p>
                          <p className="text-xs text-gray-400 font-mono">{salon.shopId}</p>
                        </div>
                      </div>
                    </td>
                    {/* Contact */}
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-gray-700 text-sm">{salon.phone || '—'}</p>
                      <p className="text-xs text-gray-400">{[salon.city, salon.state].filter(Boolean).join(', ') || '—'}</p>
                    </td>
                    {/* Admin */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {salon.admin ? (
                        <div>
                          <p className="text-gray-700 text-sm">{salon.admin.name}</p>
                          <p className="text-xs text-gray-400">ID: {salon.admin.adminId}</p>
                        </div>
                      ) : <span className="text-gray-300 text-xs">No admin</span>}
                    </td>
                    {/* Status toggle */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleToggleStatus(salon)}
                          className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${salon.status === 'active' ? 'bg-primary' : 'bg-gray-300'}`}
                          title={salon.status === 'active' ? 'Click to deactivate' : 'Click to activate'}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${salon.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className={`text-xs font-semibold whitespace-nowrap ${salon.status === 'active' ? 'text-primary' : 'text-gray-400'}`}>
                          {salon.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    {/* URLs */}
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="space-y-1">
                        <a href={`${baseUrl()}/${salon.slug}`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline">
                          <ExternalLink size={10} />/{salon.slug}
                        </a>
                        <a href={`${baseUrl()}/${salon.slug}/admin`} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-gray-500 hover:underline">
                          <ExternalLink size={10} />/{salon.slug}/admin
                        </a>
                      </div>
                    </td>
                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setViewSalon(salon)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-primary/10 hover:text-primary transition-colors" title="View">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => openEdit(salon)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(salon)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Delete">
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
      </div>

      {/* ── VIEW MODAL ────────────────────────────────────────────────────────── */}
      {viewSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-base font-semibold text-gray-800">Salon Details</h2>
              <button onClick={() => setViewSalon(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Logo + name */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {viewSalon.logo ? <img src={viewSalon.logo} alt="logo" className="w-full h-full object-cover" /> : <Store size={24} className="text-primary" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{viewSalon.shopName}</h3>
                  <p className="text-xs text-gray-400 font-mono">{viewSalon.shopId}</p>
                  <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${viewSalon.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${viewSalon.status === 'active' ? 'bg-primary' : 'bg-gray-400'}`} />
                    {viewSalon.status.charAt(0).toUpperCase() + viewSalon.status.slice(1)}
                  </span>
                </div>
              </div>

              <Row icon={Globe} label="Customer URL" value={`${baseUrl()}/${viewSalon.slug}`} link={`${baseUrl()}/${viewSalon.slug}`} />
              <Row icon={Globe} label="Admin URL" value={`${baseUrl()}/${viewSalon.slug}/admin`} link={`${baseUrl()}/${viewSalon.slug}/admin`} />
              <Row icon={Phone} label="Phone" value={viewSalon.phone} />
              <Row icon={Mail} label="Email" value={viewSalon.email} />
              <Row icon={MapPin} label="Location" value={[viewSalon.address, viewSalon.city, viewSalon.state, viewSalon.pincode].filter(Boolean).join(', ')} />
              <Row icon={Building2} label="Business Name" value={viewSalon.businessName} />
              <Row icon={CreditCard} label="Subscription" value={viewSalon.subscriptionAmount ? `₹${viewSalon.subscriptionAmount} / ${viewSalon.billingCycle}` : undefined} />
              <Row icon={User} label="Admin" value={viewSalon.admin ? `${viewSalon.admin.name} (${viewSalon.admin.adminId})` : undefined} />

              {/* Stats */}
              {viewSalon.stats && (
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {[
                    { label: 'Appointments', value: viewSalon.stats.appointments },
                    { label: 'Stylists', value: viewSalon.stats.stylists },
                    { label: 'Customers', value: viewSalon.stats.customers },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-gray-800">{value ?? '—'}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ────────────────────────────────────────────────────────── */}
      {editSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-base font-semibold text-gray-800">Edit Salon — {editSalon.shopName}</h2>
              <button onClick={() => setEditSalon(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden transition-colors group"
                >
                  {editLogoPreview
                    ? <img src={editLogoPreview} alt="logo" className="w-full h-full object-cover" />
                    : <Upload size={18} className="text-gray-300 group-hover:text-primary transition-colors" />}
                </div>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleEditLogoChange} className="hidden" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Salon Logo</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 5MB. Click to change.</p>
                  {editLogoFile && <p className="text-xs text-primary mt-0.5">{editLogoFile.name}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Salon Name *</label>
                  <input className={inputCls} value={editForm.shopName} onChange={e => setEditForm(f => ({...f, shopName: e.target.value}))} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input className={inputCls} value={editForm.phone} onChange={e => setEditForm(f => ({...f, phone: e.target.value}))} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input className={inputCls} type="email" value={editForm.email} onChange={e => setEditForm(f => ({...f, email: e.target.value}))} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp</label>
                  <input className={inputCls} value={editForm.whatsapp} onChange={e => setEditForm(f => ({...f, whatsapp: e.target.value}))} /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                  <input className={inputCls} value={editForm.address} onChange={e => setEditForm(f => ({...f, address: e.target.value}))} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input className={inputCls} value={editForm.city} onChange={e => setEditForm(f => ({...f, city: e.target.value}))} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                  <input className={inputCls} value={editForm.state} onChange={e => setEditForm(f => ({...f, state: e.target.value}))} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Pincode</label>
                  <input className={inputCls} value={editForm.pincode} onChange={e => setEditForm(f => ({...f, pincode: e.target.value}))} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Business Name</label>
                  <input className={inputCls} value={editForm.businessName} onChange={e => setEditForm(f => ({...f, businessName: e.target.value}))} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">GST Number</label>
                  <input className={inputCls} value={editForm.gstNumber} onChange={e => setEditForm(f => ({...f, gstNumber: e.target.value}))} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Subscription Amount (₹)</label>
                  <input className={inputCls} type="number" value={editForm.subscriptionAmount} onChange={e => setEditForm(f => ({...f, subscriptionAmount: e.target.value}))} /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Billing Cycle</label>
                  <select className={inputCls} value={editForm.billingCycle} onChange={e => setEditForm(f => ({...f, billingCycle: e.target.value}))}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
                  <select className={inputCls} value={editForm.paymentStatus} onChange={e => setEditForm(f => ({...f, paymentStatus: e.target.value}))}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select></div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setEditSalon(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleEditSave} disabled={editSaving}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {editSaving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ─────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={26} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Delete Salon?</h3>
            <p className="text-sm text-gray-500 mb-1">
              Are you sure you want to delete <span className="font-semibold text-gray-700">{deleteTarget.shopName}</span>?
            </p>
            <p className="text-xs text-red-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {deleteLoading ? <><Loader2 size={14} className="animate-spin" /> Deleting...</> : <><Trash2 size={14} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Row helper for View modal
const Row = ({ icon: Icon, label, value, link }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        {link ? (
          <a href={link} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline break-all flex items-center gap-1">
            {value} <ExternalLink size={11} className="flex-shrink-0" />
          </a>
        ) : (
          <p className="text-sm text-gray-700 break-words">{value}</p>
        )}
      </div>
    </div>
  );
};

export default SuperAdminSalons;
