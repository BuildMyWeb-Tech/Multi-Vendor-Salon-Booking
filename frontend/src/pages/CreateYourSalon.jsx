import React, { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Store, User, Phone, Eye, EyeOff,
  Upload, Check, X, Sparkles,
} from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const Field = ({ label, required, children, hint }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Input = (props) => (
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

const INITIAL = {
  shopName: '', address: '', city: '', state: '', pincode: '',
  phone: '', email: '', whatsapp: '',
  gstNumber: '',
  adminName: '', adminId: '', adminEmail: '', adminPassword: '',
};

export default function CreateYourSalon() {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const logoRef = useRef(null);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleLogo = (e) => {
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
    const required = ['shopName', 'adminName', 'adminId', 'adminEmail', 'adminPassword'];
    for (const key of required) {
      if (!form[key].trim()) { toast.error(`${key.replace(/([A-Z])/g, ' $1')} is required`); return; }
    }
    if (form.adminPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (logoFile) fd.append('logo', logoFile);

    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/salon-request`, fd);
      if (data.success) {
        setSubmitted(true);
        toast.success('Request submitted successfully!');
      } else {
        toast.error(data.message || 'Submission failed');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <Check size={28} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Request Submitted!</h2>
          <p className="text-gray-500 text-sm">
            Your salon registration request has been submitted successfully. Our team will review it
            and reach out to you via the contact details you provided.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 text-left space-y-1">
            <p><span className="font-semibold">Salon:</span> {form.shopName}</p>
            <p><span className="font-semibold">Admin ID:</span> {form.adminId}</p>
            <p><span className="font-semibold">Email:</span> {form.adminEmail}</p>
          </div>
          <button
            onClick={() => { setSubmitted(false); setForm(INITIAL); setLogoFile(null); setLogoPreview(null); }}
            className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-all"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-blue-50 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-1">
            <Sparkles size={14} /> List Your Salon
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Create Your Own Salon</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Fill in your salon details below. We'll review your request and set up your salon on the platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Logo */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-5">
              <div
                onClick={() => logoRef.current.click()}
                className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary cursor-pointer flex items-center justify-center overflow-hidden transition-all group"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-gray-400 group-hover:text-primary transition-colors">
                    <Upload size={22} className="mx-auto" />
                    <p className="text-xs mt-1">Logo</p>
                  </div>
                )}
              </div>
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogo} className="hidden" />
              <div>
                <p className="font-medium text-gray-800 text-sm">Salon Logo</p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 5MB. Optional.</p>
                {logoPreview && (
                  <button type="button" onClick={() => { setLogoPreview(null); setLogoFile(null); }}
                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-500 mt-1">
                    <X size={12} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Salon Info */}
          <Section title="Salon Information" icon={Store}>
            <Field label="Salon Name" required>
              <Input value={form.shopName} onChange={set('shopName')} placeholder="e.g. Glamour Studio" />
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
            <Field label="GST Number" >
              <Input value={form.gstNumber} onChange={set('gstNumber')} placeholder="GSTIN (optional)" />
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

          {/* Admin Account */}
          <Section title="Your Admin Account" icon={User}>
            <Field label="Your Name" required>
              <Input value={form.adminName} onChange={set('adminName')} placeholder="Full name" />
            </Field>
            <Field label="Admin Login ID" required hint="Used to log into your salon dashboard (e.g. myname123)">
              <Input value={form.adminId} onChange={set('adminId')} placeholder="myname123" />
            </Field>
            <Field label="Admin Email" required>
              <Input type="email" value={form.adminEmail} onChange={set('adminEmail')} placeholder="admin@yoursalon.com" />
            </Field>
            <Field label="Password" required>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.adminPassword}
                  onChange={set('adminPassword')}
                  placeholder="Min 6 characters"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white placeholder-gray-400"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>
          </Section>

          {/* Submit */}
          <div className="pb-10">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-sm text-base"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Submit Salon Request
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              After review, our team will contact you. Typical response time: 1–2 business days.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
