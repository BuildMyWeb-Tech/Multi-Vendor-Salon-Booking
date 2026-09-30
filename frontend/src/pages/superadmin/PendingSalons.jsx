import React, { useContext, useEffect, useState } from 'react';
import { SuperAdminContext } from '../../context/SuperAdminContext';
import { toast } from 'react-toastify';
import {
  Clock, Eye, Check, Trash2, X, AlertTriangle, Search,
  Store, User, Phone, Mail, MapPin, Building2, QrCode, Zap,
  ShoppingCart, Package, Tag, Gift, Users, MessageCircle, ExternalLink, Edit2,
  ChevronDown, ChevronUp, Save,
} from 'lucide-react';

const FEATURE_KEYS = [
  { key: 'serviceBillingEnabled', icon: ShoppingCart, label: 'Service Billing / POS', desc: 'Bill customers for services' },
  { key: 'productBillingEnabled', icon: Package, label: 'Product Billing', desc: 'Manage products and inventory' },
  { key: 'couponEnabled',         icon: Tag,          label: 'Coupons', desc: 'Create discount coupon codes' },
  { key: 'packageEnabled',        icon: Gift,         label: 'Packages', desc: 'Service package discounts' },
  { key: 'stylistPanelEnabled',   icon: Users,        label: 'Stylist Panel', desc: 'Individual login per stylist' },
  { key: 'broadcastEnabled',      icon: MessageCircle, label: 'WhatsApp Broadcast', desc: 'Bulk WhatsApp messaging to salon customers' },
];

const Input = (props) => (
  <input
    {...props}
    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
  />
);

const Toggle = ({ value, onToggle }) => (
  <div
    onClick={onToggle}
    className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-gray-200'}`}
  >
    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : ''}`} />
  </div>
);

const InfoRow = ({ label, value }) =>
  value ? (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-700">{value}</p>
    </div>
  ) : null;

// Expandable card for a single request
const RequestCard = ({ req, onApprove, onDelete, approving }) => {
  const { updateSalonRequest } = useContext(SuperAdminContext);
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({ ...req });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const setF = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));
  const toggleF = (key) => () => setForm((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    const result = await updateSalonRequest(req._id, form);
    setSaving(false);
    if (result?.success) {
      toast.success('Request updated');
    } else {
      toast.error(result?.message || 'Update failed');
    }
  };

  const statusColor = {
    pending:  'bg-yellow-100 text-yellow-700 border-yellow-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-100 text-red-600 border-red-200',
  }[req.status] || '';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-4 p-5">
        {req.logo ? (
          <img src={req.logo} alt="" className="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Store size={22} className="text-primary" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-800 text-base truncate">{req.shopName}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>
              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
            </span>
            {req.similarWarning && req.status === 'pending' && (
              <span className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                <AlertTriangle size={11} /> Similar name
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
            {req.email && <span className="flex items-center gap-1"><Mail size={11} />{req.email}</span>}
            {req.phone && <span className="flex items-center gap-1"><Phone size={11} />{req.phone}</span>}
            {(req.city || req.state) && (
              <span className="flex items-center gap-1"><MapPin size={11} />{[req.city, req.state].filter(Boolean).join(', ')}</span>
            )}
            <span className="text-gray-300">·</span>
            <span>{new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {req.status === 'pending' && (
            <>
              <button
                onClick={() => onApprove(req)}
                disabled={approving === req._id}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              >
                {approving === req._id ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Accept
              </button>
              <button
                onClick={() => onDelete(req)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          {/* {req.status === 'approved' && req.approvedShopId && (
            <a
              href={`/${req.approvedShopId}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline"
            >
              {req.approvedShopId} <ExternalLink size={11} />
            </a>
          )} */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Expanded detail + edit panel */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-6 bg-gray-50/40">

          {req.similarWarning && req.status === 'pending' && (
            <div className="flex items-start gap-2 p-3.5 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              A salon with a similar name already exists or is pending. Review carefully before approving.
            </div>
          )}

          {/* Salon info edit */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Store size={12} /> Salon Details
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                ['Salon Name', 'shopName'],
                ['Address', 'address'],
                ['City', 'city'],
                ['State', 'state'],
                ['Pincode', 'pincode'],
                ['Phone', 'phone'],
                ['Email', 'email'],
                ['WhatsApp', 'whatsapp'],
                ['Business Name', 'businessName'],
                ['GST Number', 'gstNumber'],
              ].map(([label, key]) => (
                <div key={key}>
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <Input value={form[key] || ''} onChange={setF(key)} placeholder={label} />
                </div>
              ))}
            </div>
          </div>

          {/* Admin account edit */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <User size={12} /> Admin Account
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[['Admin Name', 'adminName'], ['Admin ID', 'adminId'], ['Admin Email', 'adminEmail']].map(([label, key]) => (
                <div key={key}>
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <Input value={form[key] || ''} onChange={setF(key)} placeholder={label} />
                </div>
              ))}
              <div>
                <p className="text-xs text-gray-400 mb-1">Password</p>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.adminPassword || ''}
                    onChange={setF('adminPassword')}
                    placeholder="Admin password"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 pr-9 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Integration */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <QrCode size={12} /> Payment Integration
            </p>
            <label className="flex items-center gap-3 cursor-pointer select-none mb-4">
              <Toggle value={!!form.paymentIntegrationEnabled} onToggle={toggleF('paymentIntegrationEnabled')} />
              <span className="text-sm font-medium text-gray-700">Enable UPI Payment</span>
            </label>
            {form.paymentIntegrationEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
                {[
                  ['UPI ID', 'upiId', 'yourname@bank'],
                  ['Display Name', 'upiName', 'Salon Name'],
                  ['UPI Mobile', 'upiMobileNumber', '9876543210'],
                  ['Bank Name', 'bankName', 'HDFC Bank'],
                ].map(([label, key, ph]) => (
                  <div key={key}>
                    <p className="text-xs text-gray-400 mb-1">{label}</p>
                    <Input value={form[key] || ''} onChange={setF(key)} placeholder={ph} />
                  </div>
                ))}
                {form.upiId && (
                  <div className="sm:col-span-2 flex items-center gap-3 mt-1">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${form.upiId}&pn=${form.upiName || ''}&cu=INR`)}`}
                      alt="QR Preview"
                      className="w-20 h-20 rounded-lg border border-gray-200 bg-white p-1 object-contain"
                    />
                    <div className="text-xs text-gray-500 space-y-1">
                      <p><span className="text-gray-400">UPI ID:</span> <span className="font-mono">{form.upiId}</span></p>
                      {form.upiName && <p><span className="text-gray-400">Name:</span> {form.upiName}</p>}
                      <p className="text-blue-400">Amount set dynamically per booking</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Features */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Zap size={12} /> Features
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FEATURE_KEYS.map(({ key, icon: Icon, label, desc }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer select-none bg-white rounded-xl border border-gray-100 p-3 hover:border-primary/30 transition-colors">
                  <Toggle value={!!form[key]} onToggle={toggleF(key)} />
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${form[key] ? 'bg-primary/10' : 'bg-gray-100'}`}>
                    <Icon size={14} className={form[key] ? 'text-primary' : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Save */}
          {req.status === 'pending' && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function PendingSalons() {
  const { getSalonRequests, approveSalonRequest, deleteSalonRequest } = useContext(SuperAdminContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [approving, setApproving] = useState(null);
  const [approvedResult, setApprovedResult] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    const data = await getSalonRequests({ status: statusFilter || undefined, search: search || undefined });
    if (data?.success) setRequests(data.requests);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  const handleSearch = (e) => { e.preventDefault(); fetchRequests(); };

  const handleApprove = async (req) => {
    setApproving(req._id);
    const result = await approveSalonRequest(req._id);
    setApproving(null);
    if (result?.success) {
      toast.success('Salon approved and created!');
      setApprovedResult(result.salon);
      fetchRequests();
    } else {
      toast.error(result?.message || 'Approval failed');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteSalonRequest(deleteTarget._id);
    setDeleting(false);
    if (result?.success) {
      toast.success('Request deleted');
      setDeleteTarget(null);
      fetchRequests();
    } else {
      toast.error(result?.message || 'Delete failed');
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Clock size={22} className="text-primary" />
            Pending Salons
            {pendingCount > 0 && (
              <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Review, configure and approve salon registration requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by salon name…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary"
            />
          </div>
          <button type="submit" className="bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-medium">Search</button>
        </form>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="">All</option>
        </select>
      </div>

      {/* Request cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">Loading…</div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3 bg-white rounded-2xl border border-gray-100">
          <Clock size={44} className="opacity-25" />
          <p className="font-medium">No requests found</p>
          <p className="text-sm">When users submit salon applications, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard
              key={req._id}
              req={req}
              onApprove={handleApprove}
              onDelete={setDeleteTarget}
              approving={approving}
            />
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <h3 className="font-bold text-gray-800">Delete Request?</h3>
            <p className="text-sm text-gray-500">
              Delete the request from <strong>{deleteTarget.shopName}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm"
              >
                {deleting ? 'Deletingâ€¦' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approved result modal */}
      {approvedResult && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <Check size={26} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Salon Created!</h3>
            <p className="text-sm text-gray-500">The salon is now live and visible in All Salons.</p>
            <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Shop ID</span><span className="font-mono font-bold text-primary">{approvedResult.shopId}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="font-semibold">{approvedResult.shopName}</span></div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Customer URL</span>
                <a href={approvedResult.customerUrl} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1 hover:underline">
                  {approvedResult.customerUrl} <ExternalLink size={11} />
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Admin URL</span>
                <a href={approvedResult.adminUrl} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1 hover:underline">
                  {approvedResult.adminUrl} <ExternalLink size={11} />
                </a>
              </div>
            </div>
            <button onClick={() => setApprovedResult(null)} className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-xl text-sm">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
