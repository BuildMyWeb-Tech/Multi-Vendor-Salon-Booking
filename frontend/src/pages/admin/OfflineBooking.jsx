import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SalonAdminContext } from '../../context/SalonAdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Calendar, User, Phone, Scissors, Clock, CheckCircle2, Loader2, UserPlus,
} from 'lucide-react';

const OfflineBooking = () => {
  const { saAdminToken, backendUrl, shopInfo, doctors, getAllDoctors } = useContext(SalonAdminContext);
  const navigate = useNavigate();

  const [allServices, setAllServices] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Guard: redirect if feature not enabled
  useEffect(() => {
    if (shopInfo && !shopInfo.offlineBookingEnabled) {
      navigate(`/${shopInfo.slug}/admin/dashboard`);
    }
  }, [shopInfo]);

  // Load doctors
  useEffect(() => {
    if (saAdminToken) getAllDoctors();
  }, [saAdminToken]);

  // Load services
  useEffect(() => {
    if (!shopInfo?.slug) return;
    axios
      .get(`${backendUrl}/api/shop/${shopInfo.slug}/services`)
      .then(({ data }) => {
        if (data.success) {
          const flat = [];
          (data.services || []).forEach((cat) => {
            (cat.services || []).forEach((svc) => {
              if (svc.isActive !== false) flat.push({ name: svc.name, price: svc.price });
            });
          });
          setAllServices(flat);
        }
      })
      .catch(() => {});
  }, [shopInfo?.slug]);

  const toggleService = (svc) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.name === svc.name);
      if (exists) return prev.filter((s) => s.name !== svc.name);
      return [...prev, svc];
    });
  };

  const totalAmount = selectedServices.reduce((s, sv) => s + (sv.price || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) { toast.error('Please select a stylist'); return; }
    if (!slotDate) { toast.error('Please select a date'); return; }
    if (!slotTime) { toast.error('Please enter a time'); return; }
    if (!customerName.trim()) { toast.error('Customer name is required'); return; }

    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/salon-admin/offline-appointment`,
        {
          doctorId: selectedDoctor,
          services: selectedServices,
          slotDate,
          slotTime,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
        },
        { headers: { satoken: saAdminToken } }
      );
      if (data.success) {
        toast.success('Walk-in booking created!');
        setSelectedDoctor('');
        setSelectedServices([]);
        setSlotDate('');
        setSlotTime('');
        setCustomerName('');
        setCustomerPhone('');
      } else {
        toast.error(data.message || 'Failed to create booking');
      }
    } catch {
      toast.error('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <UserPlus size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Walk-in Booking</h1>
          <p className="text-sm text-gray-500">Create an offline appointment for a walk-in customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Stylist */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
            <Scissors size={16} className="text-primary" />
            Select Stylist
          </div>
          {doctors.length === 0 ? (
            <p className="text-sm text-gray-400">No stylists available.</p>
          ) : (
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            >
              <option value="">-- Choose a stylist --</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} {d.speciality ? `• ${d.speciality}` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Services */}
        {allServices.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
              <CheckCircle2 size={16} className="text-primary" />
              Select Services (optional)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {allServices.map((svc) => {
                const checked = !!selectedServices.find((s) => s.name === svc.name);
                return (
                  <label
                    key={svc.name}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${
                      checked ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(svc)}
                      className="accent-primary"
                    />
                    <span className="flex-1">{svc.name}</span>
                    <span className="font-medium">₹{svc.price}</span>
                  </label>
                );
              })}
            </div>
            {selectedServices.length > 0 && (
              <div className="text-sm text-gray-600 font-medium">
                Total: <span className="text-primary font-bold">₹{totalAmount}</span>
              </div>
            )}
          </div>
        )}

        {/* Date & Time */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
            <Calendar size={16} className="text-primary" />
            Date & Time
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Date</label>
              <input
                type="date"
                value={slotDate}
                onChange={(e) => setSlotDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">
                <Clock size={12} className="inline mr-1" />Time
              </label>
              <input
                type="time"
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-semibold text-sm">
            <User size={16} className="text-primary" />
            Customer Details
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Customer Name *</label>
              <div className="relative">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full pl-9 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number (optional)"
                  className="w-full pl-9 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-sm"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating Booking...
            </>
          ) : (
            <>
              <UserPlus size={18} />
              Create Walk-in Booking
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default OfflineBooking;
