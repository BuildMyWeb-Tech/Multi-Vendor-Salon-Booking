// admin/src/pages/SuperAdmin/CreateSalon.jsx
import React, { useContext, useState, useRef } from 'react';
import { SuperAdminContext } from '../../context/SuperAdminContext';
import {
  Store, User, Phone, Mail, MapPin, Building2,
  CreditCard, Eye, EyeOff, Upload, Check, X,
  ArrowLeft, Sparkles, Globe
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Link, useNavigate } from 'react-router-dom';

const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Input = ({ ...props }) => (
  <input
    {...props}
    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white placeholder-gray-400"
  />
);

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={16} className="text-primary" />
      </div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">{children}</div>
  </div>
);

const CreateSalon = () => {
  const { createSalon } = useContext(SuperAdminContext);
  const navigate = useNavigate();
  const logoInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    shopName: '', slug: '', address: '', city: '', state: '', pincode: '',
    phone: '', email: '', whatsapp: '',
    businessName: '', gstNumber: '',
    setupAmount: '', subscriptionAmount: '', billingCycle: 'monthly', paymentStatus: 'pending',
    adminName: '', adminId: '', adminEmail: '', password: '',
  });

  const set = (key) => (e) => {
    const val = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [key]: val };
      // Auto-generate slug from shopName
      if (key === 'shopName' && !prev.slug) {
        next.slug = val.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
      }
      return next;
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Logo must be under 5MB'); return; }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = ['shopName', 'adminName', 'adminId', 'adminEmail', 'password'];
    for (const key of required) {
      if (!form[key]) { toast.error(`${key.replace(/([A-Z])/g, ' $1')} is required`); return; }
    }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (logoFile) fd.append('logo', logoFile);

    const result = await createSalon(fd);
    setLoading(false);

    if (result?.success) {
      setSuccess(result);
      toast.success('Salon created successfully!');
    } else {
      toast.error(result?.message || 'Failed to create salon');
    }
  };

  if (success) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[70vh]">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Salon Created!</h2>
          <p className="text-gray-500 text-sm mb-6">The salon has been set up successfully.</p>

          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Shop Name</span>
              <span className="text-sm font-semibold text-gray-800">{success.salon.shopName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Shop ID</span>
              <span className="text-sm font-mono font-bold text-primary">{success.salon.shopId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Customer URL</span>
              <span className="text-sm font-medium text-blue-600">{success.salon.customerUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Admin URL</span>
              <span className="text-sm font-medium text-primary">{success.salon.adminUrl}</span>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">Admin ID</span>
              <span className="text-sm font-mono font-bold text-gray-800 ml-2">{success.admin.adminId}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setSuccess(null); setForm({ shopName:'',slug:'',address:'',city:'',state:'',pincode:'',phone:'',email:'',whatsapp:'',businessName:'',gstNumber:'',setupAmount:'',subscriptionAmount:'',billingCycle:'monthly',paymentStatus:'pending',adminName:'',adminId:'',adminEmail:'',password:'' }); setLogoPreview(null); setLogoFile(null); }}
              className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all"
            >
              Create Another
            </button>
            <button
              onClick={() => navigate('/super-admin/salons')}
              className="flex-1 bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              View All Salons
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/super-admin/salons" className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create New Salon</h1>
          <p className="text-gray-500 text-sm mt-0.5">Set up a new salon on the platform</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Logo Upload */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-5">
            <div
              onClick={() => logoInputRef.current.click()}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden transition-all group"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-gray-400 group-hover:text-purple-500 transition-colors">
                  <Upload size={22} className="mx-auto" />
                  <p className="text-xs mt-1">Logo</p>
                </div>
              )}
            </div>
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            <div>
              <p className="font-medium text-gray-800 text-sm">Salon Logo</p>
              <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 5MB. Click to upload.</p>
              {logoPreview && (
                <button type="button" onClick={() => { setLogoPreview(null); setLogoFile(null); }} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 mt-1">
                  <X size={12} /> Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Salon Information */}
        <Section title="Salon Information" icon={Store}>
          <Field label="Salon Name" required>
            <Input value={form.shopName} onChange={set('shopName')} placeholder="e.g. Activate Salon" />
          </Field>
          <Field label="URL Slug" required hint={`Customer URL: /${form.slug || 'your-slug'}`}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">/</span>
              <Input value={form.slug} onChange={set('slug')} placeholder="activate-salon" className="pl-6 w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white placeholder-gray-400" />
            </div>
          </Field>
          <Field label="Address">
            <Input value={form.address} onChange={set('address')} placeholder="Street address" />
          </Field>
          <Field label="City">
            <Input value={form.city} onChange={set('city')} placeholder="City" />
          </Field>
          <Field label="State">
            <Input value={form.state} onChange={set('state')} placeholder="State" />
          </Field>
          <Field label="Pincode">
            <Input value={form.pincode} onChange={set('pincode')} placeholder="Pincode" />
          </Field>
        </Section>

        {/* Contact */}
        <Section title="Contact Details" icon={Phone}>
          <Field label="Phone">
            <Input value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={set('email')} placeholder="salon@example.com" />
          </Field>
          <Field label="WhatsApp">
            <Input value={form.whatsapp} onChange={set('whatsapp')} placeholder="+91 9876543210" />
          </Field>
        </Section>

        {/* Business */}
        <Section title="Business Details" icon={Building2}>
          <Field label="Business Name">
            <Input value={form.businessName} onChange={set('businessName')} placeholder="Registered business name" />
          </Field>
          <Field label="GST Number">
            <Input value={form.gstNumber} onChange={set('gstNumber')} placeholder="GSTIN (optional)" />
          </Field>
        </Section>

        {/* Payment */}
        <Section title="Subscription & Payment" icon={CreditCard}>
          <Field label="Setup Amount (₹)">
            <Input type="number" value={form.setupAmount} onChange={set('setupAmount')} placeholder="0" />
          </Field>
          <Field label="Monthly Subscription (₹)">
            <Input type="number" value={form.subscriptionAmount} onChange={set('subscriptionAmount')} placeholder="0" />
          </Field>
          <Field label="Billing Cycle">
            <select value={form.billingCycle} onChange={set('billingCycle')} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary bg-white">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </Field>
          <Field label="Payment Status">
            <select value={form.paymentStatus} onChange={set('paymentStatus')} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary bg-white">
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </Field>
        </Section>

        {/* Salon Admin */}
        <Section title="Salon Admin Account" icon={User}>
          <Field label="Admin Name" required>
            <Input value={form.adminName} onChange={set('adminName')} placeholder="Full name" />
          </Field>
          <Field label="Admin ID" required hint="Used to login (e.g. activateadmin)">
            <Input value={form.adminId} onChange={set('adminId')} placeholder="activateadmin" />
          </Field>
          <Field label="Admin Email" required>
            <Input type="email" value={form.adminEmail} onChange={set('adminEmail')} placeholder="admin@salon.com" />
          </Field>
          <Field label="Password" required>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Min 6 characters"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all bg-white placeholder-gray-400"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>
        </Section>

        {/* Submit */}
        <div className="flex gap-3 pb-6">
          <Link to="/super-admin/salons" className="flex-1 sm:flex-none border border-gray-200 text-gray-600 px-6 py-3 rounded-xl text-sm hover:bg-gray-50 transition-all text-center">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Create Salon
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSalon;
