import React, { useContext, useEffect, useState } from 'react';
import { SalonAdminContext } from '../../context/SalonAdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CreditCard, Smartphone, QrCode, Save, Loader2, ToggleLeft, ToggleRight, Info } from 'lucide-react';

const PaymentSettings = () => {
  const { saAdminToken, backendUrl } = useContext(SalonAdminContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    paymentIntegrationEnabled: false,
    upiName: '',
    upiMobileNumber: '',
    upiId: '',
  });

  useEffect(() => {
    axios.get(`${backendUrl}/api/salon-admin/payment-settings`, {
      headers: { saadmintoken: saAdminToken },
    }).then(({ data }) => {
      if (data.success) {
        setForm({
          paymentIntegrationEnabled: data.paymentIntegrationEnabled,
          upiName: data.upiName,
          upiMobileNumber: data.upiMobileNumber,
          upiId: data.upiId,
        });
      }
    }).catch(() => toast.error('Failed to load payment settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (form.paymentIntegrationEnabled) {
      if (!form.upiId.trim()) return toast.warning('UPI ID is required when payment is enabled');
      if (!form.upiName.trim()) return toast.warning('UPI Name is required');
    }
    setSaving(true);
    try {
      const { data } = await axios.put(`${backendUrl}/api/salon-admin/payment-settings`, form, {
        headers: { saadmintoken: saAdminToken },
      });
      if (data.success) toast.success('Payment settings saved');
      else toast.error(data.message);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const dynamicQrUrl = form.upiId
    ? `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(`upi://pay?pa=${form.upiId}&pn=${form.upiName}&cu=INR`)}`
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard size={24} className="text-primary" /> Payment Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure UPI payment collection for your salon</p>
      </div>

      <div className="space-y-5">
        {/* Toggle */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="font-semibold text-gray-800">Enable UPI Payment</p>
            <p className="text-xs text-gray-500 mt-0.5">Allow customers to pay online via UPI during booking</p>
          </div>
          <button
            onClick={() => setForm(f => ({ ...f, paymentIntegrationEnabled: !f.paymentIntegrationEnabled }))}
            className="text-primary"
          >
            {form.paymentIntegrationEnabled
              ? <ToggleRight size={40} className="text-primary" />
              : <ToggleLeft size={40} className="text-gray-300" />
            }
          </button>
        </div>

        {/* UPI Fields */}
        <div className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 transition-opacity ${!form.paymentIntegrationEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <QrCode size={17} className="text-primary" /> UPI Details
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.upiId}
              onChange={(e) => setForm(f => ({ ...f, upiId: e.target.value }))}
              placeholder="e.g. salon@upi or 9876543210@paytm"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Info size={11} /> Used to generate a dynamic QR code with the exact booking amount
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.upiName}
              onChange={(e) => setForm(f => ({ ...f, upiName: e.target.value }))}
              placeholder="e.g. Glamour Salon"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="relative">
              <Smartphone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={form.upiMobileNumber}
                onChange={(e) => setForm(f => ({ ...f, upiMobileNumber: e.target.value }))}
                placeholder="e.g. 9876543210"
                className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Dynamic QR Preview */}
          {dynamicQrUrl && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Dynamic QR Preview</p>
              <div className="flex items-center gap-4">
                <img
                  src={dynamicQrUrl}
                  alt="UPI QR Preview"
                  className="w-28 h-28 border-2 border-gray-200 rounded-xl p-1 bg-white shadow"
                />
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="text-gray-400">UPI ID:</span> <span className="font-mono font-semibold">{form.upiId}</span></p>
                  <p><span className="text-gray-400">Name:</span> {form.upiName}</p>
                  <p className="text-xs text-blue-600">Amount is set dynamically per booking</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save Payment Settings'}
        </button>
      </div>
    </div>
  );
};

export default PaymentSettings;
