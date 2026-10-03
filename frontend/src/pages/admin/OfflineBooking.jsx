import React, { useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SalonAdminContext } from '../../context/SalonAdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Calendar, User, Phone, Scissors, Clock, CheckCircle2, Loader2, UserPlus,
  ChevronLeft, Banknote, Smartphone, Package, ArrowRight,
  IndianRupee, Tag, Check,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildCalendarDates() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return { date: d, iso, isToday: i === 0 };
  });
}

const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

// ── component ─────────────────────────────────────────────────────────────────
const OfflineBooking = () => {
  const { saAdminToken, backendUrl, shopInfo, doctors, getAllDoctors } = useContext(SalonAdminContext);
  const navigate = useNavigate();
  const headers = { satoken: saAdminToken };

  // Guard: redirect if feature not enabled
  useEffect(() => {
    if (shopInfo && !shopInfo.offlineBookingEnabled) navigate(`/${shopInfo.slug}/admin/dashboard`);
  }, [shopInfo]);

  useEffect(() => { if (saAdminToken) getAllDoctors(); }, [saAdminToken]);

  // ── step ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── raw data ──────────────────────────────────────────────────────────────
  const [allServices, setAllServices] = useState([]); // flat ServiceCategory docs
  const [allPackages, setAllPackages] = useState([]); // active packages

  // ── derived (filtered by stylist) ─────────────────────────────────────────
  const [stylistServices, setStylistServices] = useState([]);
  const [stylistPackages, setStylistPackages] = useState([]);

  // ── slots ─────────────────────────────────────────────────────────────────
  const [slots, setSlots]               = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // ── available dates (filtered by leave/holiday/daysOpen) ──────────────────
  const [availableDates, setAvailableDates] = useState([]);
  const [datesLoading,   setDatesLoading]   = useState(false);
  const [dateSlotsMap,   setDateSlotsMap]   = useState({}); // { iso: slotCount }

  // ── selections ────────────────────────────────────────────────────────────
  const [selectedDoctor,   setSelectedDoctor]   = useState(null);
  const [selectedServices, setSelectedServices] = useState([]); // [{_id,name,price}]
  const [selectedPackages, setSelectedPackages] = useState([]); // [{_id,name,serviceIds,discountPercent}]
  const [selectedDate,     setSelectedDate]     = useState('');
  const [selectedSlot,     setSelectedSlot]     = useState('');
  const [customerName,     setCustomerName]     = useState('');
  const [customerPhone,    setCustomerPhone]    = useState('');
  const [paymentMethod,    setPaymentMethod]    = useState('cash');
  const [submitting,       setSubmitting]       = useState(false);

  // ── fetch services & packages once shopInfo is ready ─────────────────────
  useEffect(() => {
    if (!shopInfo?.slug || !saAdminToken) return;

    // Use admin endpoint so we get all services (not just active public ones can vary)
    axios.get(`${backendUrl}/api/salon-admin/services`, { headers })
      .then(({ data }) => {
        if (data.success) {
          // Flat list of ServiceCategory docs: { _id, name, basePrice, isActive }
          const svcs = (data.services || [])
            .filter(s => s.isActive !== false)
            .map(s => ({ _id: String(s._id), name: s.name, price: s.basePrice ?? 0 }));
          setAllServices(svcs);
        }
      }).catch(() => {});

    if (shopInfo.packageEnabled) {
      axios.get(`${backendUrl}/api/salon-admin/packages`, { headers })
        .then(({ data }) => {
          if (data.success) setAllPackages(data.packages.filter(p => p.isActive));
        }).catch(() => {});
    }
  }, [shopInfo?.slug, saAdminToken]);

  // ── filter services & packages when doctor or allServices changes ──────────
  useEffect(() => {
    if (!selectedDoctor || allServices.length === 0) {
      setStylistServices([]);
      setStylistPackages([]);
      return;
    }

    // Doctor specialty is an array of service name strings
    const specialtySet = new Set(
      (selectedDoctor.specialty || []).map(s => s.toLowerCase().trim())
    );

    // If specialty is empty, show all services (stylist does everything)
    const filtered = specialtySet.size === 0
      ? allServices
      : allServices.filter(s => specialtySet.has(s.name.toLowerCase().trim()));

    setStylistServices(filtered);

    // Filter packages: show only if ALL required services exist in stylist's service list
    const filteredIds = new Set(filtered.map(s => String(s._id)));
    const pkgs = allPackages.filter(pkg =>
      Array.isArray(pkg.serviceIds) &&
      pkg.serviceIds.length > 0 &&
      pkg.serviceIds.every(id => filteredIds.has(String(id)))
    );
    setStylistPackages(pkgs);

    // Reset selections when doctor changes
    setSelectedServices([]);
    setSelectedPackages([]);
  }, [selectedDoctor, allServices, allPackages]);

  // ── fetch available dates + slot counts ───────────────────────────────────
  const fetchAvailableDates = useCallback(async (docId) => {
    setDatesLoading(true);
    setAvailableDates([]);
    setDateSlotsMap({});
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/salon-admin/available-dates/${docId}`, { headers }
      );
      if (!data.success || !data.dates?.length) { setDatesLoading(false); return; }

      const todayStr = (() => {
        const t = new Date(); t.setHours(0,0,0,0);
        return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
      })();

      const dateObjs = data.dates.map(iso => ({
        date: new Date(iso + 'T00:00:00'),
        iso,
        isToday: iso === todayStr,
      }));

      // Fetch slot counts for all dates in parallel
      const counts = {};
      await Promise.all(dateObjs.map(async ({ iso }) => {
        try {
          const { data: sd } = await axios.get(
            `${backendUrl}/api/salon-admin/available-slots`,
            { headers, params: { docId, date: iso } }
          );
          counts[iso] = sd.success ? (sd.slots?.length || 0) : 0;
        } catch { counts[iso] = 0; }
      }));

      setDateSlotsMap(counts);
      setAvailableDates(dateObjs.filter(d => counts[d.iso] > 0));
    } catch { toast.error('Could not load available dates'); }
    setDatesLoading(false);
  }, [backendUrl, saAdminToken]);

  // ── fetch slots ───────────────────────────────────────────────────────────
  const fetchSlots = useCallback(async (docId, date) => {
    if (!docId || !date) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot('');
    try {
      const { data } = await axios.get(`${backendUrl}/api/salon-admin/available-slots`, {
        headers, params: { docId, date },
      });
      if (data.success) setSlots(data.slots || []);
      else toast.error(data.message || 'No slots available');
    } catch { toast.error('Could not load slots'); }
    setSlotsLoading(false);
  }, [backendUrl, saAdminToken]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleDoctorSelect = (doc) => {
    setSelectedDoctor(doc);
    setSelectedDate('');
    setSelectedSlot('');
    setSlots([]);
    setAvailableDates([]);
    setDateSlotsMap({});
    setStep(2);
    fetchAvailableDates(doc._id);
  };

  const handleDateSelect = (iso) => {
    setSelectedDate(iso);
    setSelectedSlot('');
    fetchSlots(selectedDoctor._id, iso);
  };

  const toggleService = (svc) => {
    setSelectedServices(prev =>
      prev.find(s => s._id === svc._id) ? prev.filter(s => s._id !== svc._id) : [...prev, svc]
    );
  };

  const togglePackage = (pkg) => {
    const alreadySelected = !!selectedPackages.find(p => p._id === pkg._id);
    if (alreadySelected) {
      setSelectedPackages(prev => prev.filter(p => p._id !== pkg._id));
      // Remove services that belong exclusively to this package (not in other selected packages)
      const otherPkgIds = new Set(
        selectedPackages.filter(p => p._id !== pkg._id).flatMap(p => p.serviceIds.map(String))
      );
      setSelectedServices(prev => prev.filter(s => !pkg.serviceIds.map(String).includes(String(s._id)) || otherPkgIds.has(String(s._id))));
    } else {
      setSelectedPackages(prev => [...prev, pkg]);
      // Auto-add all of this package's services if not already selected
      const pkgSvcs = stylistServices.filter(s => pkg.serviceIds.map(String).includes(String(s._id)));
      setSelectedServices(prev => {
        const merged = [...prev];
        pkgSvcs.forEach(s => { if (!merged.find(x => x._id === s._id)) merged.push(s); });
        return merged;
      });
    }
  };

  // ── totals ────────────────────────────────────────────────────────────────
  // For each selected package, calculate discount on its services
  const pkgDiscountMap = {};
  selectedPackages.forEach(pkg => {
    const pkgSvcTotal = stylistServices
      .filter(s => pkg.serviceIds.map(String).includes(String(s._id)))
      .reduce((t, s) => t + s.price, 0);
    pkgDiscountMap[pkg._id] = Math.round(pkgSvcTotal * pkg.discountPercent / 100);
  });
  const totalPkgDiscount = Object.values(pkgDiscountMap).reduce((a, b) => a + b, 0);
  const subtotal = selectedServices.reduce((s, sv) => s + sv.price, 0);
  const totalAmount = Math.max(0, subtotal - totalPkgDiscount);

  // ── submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!customerName.trim()) { toast.error('Customer name is required'); return; }
    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/salon-admin/offline-appointment`,
        {
          doctorId: selectedDoctor._id,
          services: selectedServices,
          slotDate: selectedDate,
          slotTime: selectedSlot,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          paymentMethod,
          finalAmount: totalAmount,
          packages: selectedPackages.map(pkg => {
            const pkgSvcs = stylistServices.filter(s => pkg.serviceIds.map(String).includes(String(s._id)));
            const origTotal = pkgSvcs.reduce((t, s) => t + s.price, 0);
            const discAmt = Math.round(origTotal * pkg.discountPercent / 100);
            return {
              name: pkg.name,
              discountPercent: pkg.discountPercent,
              discountAmount: discAmt,
              finalAmount: origTotal - discAmt,
            };
          }),
        },
        { headers }
      );
      if (data.success) {
        toast.success('Walk-in booking created!');
        setStep(1);
        setSelectedDoctor(null);
        setSelectedServices([]);
        setSelectedPackages([]);
        setSelectedDate('');
        setSelectedSlot('');
        setCustomerName('');
        setCustomerPhone('');
        setPaymentMethod('cash');
      } else {
        toast.error(data.message || 'Failed to create booking');
      }
    } catch { toast.error('Network error. Please try again.'); }
    setSubmitting(false);
  };

  // ── step labels ───────────────────────────────────────────────────────────
  const STEPS = ['Stylist', 'Services', 'Date & Time', 'Confirm'];

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

      {/* Step indicator */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-1.5 min-w-0">
                <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 transition-all ${
                  step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > i + 1 ? <Check size={13} /> : i + 1}
                </div>
                <span className={`text-[11px] font-medium hidden sm:block truncate ${step === i + 1 ? 'text-primary' : step > i + 1 ? 'text-emerald-500' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 transition-all min-w-2 ${step > i + 1 ? 'bg-emerald-400' : 'bg-gray-100'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── STEP 1: Select Stylist ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Scissors size={15} className="text-primary" /> Select Stylist
          </p>
          {doctors.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No stylists available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {doctors.map((doc) => (
                <button
                  key={doc._id}
                  onClick={() => handleDoctorSelect(doc)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-primary/10">
                    {doc.image
                      ? <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><User size={20} className="text-primary/40" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{doc.name}</p>
                    {doc.specialty?.length > 0 && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{doc.specialty.join(' · ')}</p>
                    )}
                  </div>
                  <ArrowRight size={14} className="text-gray-300 group-hover:text-primary flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: Services & Packages ───────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Stylist pill */}
          <StylistPill doc={selectedDoctor} onChange={() => { setStep(1); }} />

          {/* Packages */}
          {stylistPackages.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Package size={15} className="text-primary" /> Combo Packages
                <span className="text-xs text-gray-400 font-normal">optional</span>
              </p>
              <div className="space-y-2">
                {stylistPackages.map((pkg) => {
                  const isSelected = !!selectedPackages.find(p => p._id === pkg._id);
                  const pkgSvcs = stylistServices.filter(s => pkg.serviceIds.map(String).includes(String(s._id)));
                  const origTotal = pkgSvcs.reduce((t, s) => t + s.price, 0);
                  const discAmt = Math.round(origTotal * pkg.discountPercent / 100);
                  const finalAmt = origTotal - discAmt;
                  return (
                    <label
                      key={pkg._id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePackage(pkg)}
                        className="accent-primary mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-gray-800'}`}>{pkg.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{pkgSvcs.map(s => s.name).join(' + ')}</p>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-0.5">
                        <p className="text-[11px] font-bold text-emerald-600">-{pkg.discountPercent}% (₹{discAmt} off)</p>
                        <p className="text-xs text-gray-400 line-through">₹{origTotal}</p>
                        <p className="text-sm font-bold text-gray-800">₹{finalAmt}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Individual Services */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CheckCircle2 size={15} className="text-primary" /> Services
              <span className="text-xs text-gray-400 font-normal">optional</span>
            </p>
            {stylistServices.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">
                {allServices.length === 0
                  ? 'No services have been added yet.'
                  : 'No services assigned to this stylist specialties.'}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-0.5">
                {stylistServices.map((svc) => {
                  const isSelected = !!selectedServices.find(s => s._id === svc._id);
                  const inPackage = selectedPackages.some(p => p.serviceIds.map(String).includes(String(svc._id)));
                  return (
                    <label
                      key={svc._id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm ${
                        isSelected ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 hover:border-primary/30 text-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(svc)}
                        className="accent-primary flex-shrink-0"
                      />
                      <span className="flex-1 truncate font-medium">{svc.name}</span>
                      <div className="flex-shrink-0 text-right">
                        <span className="font-semibold">₹{svc.price}</span>
                        {inPackage && (
                          <span className="block text-[10px] text-emerald-500 font-medium">in combo</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Selection summary */}
            {selectedServices.length > 0 && (
              <div className="mt-2 pt-3 border-t border-gray-50 space-y-1.5">
                {selectedServices.map(s => (
                  <div key={s._id} className="flex justify-between text-xs text-gray-600">
                    <span>{s.name}</span>
                    <span>₹{s.price}</span>
                  </div>
                ))}
                {totalPkgDiscount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-medium">
                    <span>Combo discount</span>
                    <span>– ₹{totalPkgDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-800 border-t border-gray-100 pt-1.5 mt-1">
                  <span>Total</span>
                  <span className="text-primary">₹{totalAmount}</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setStep(3)}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 transition-all text-sm"
          >
            Continue to Date & Time <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* ── STEP 3: Date & Time ───────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <BackBtn onClick={() => setStep(2)} label="Back to Services" />

          {/* Date picker */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Calendar size={15} className="text-primary" /> Select Date
            </p>
            {datesLoading ? (
              <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                <Loader2 size={18} className="animate-spin" /> Loading available dates…
              </div>
            ) : availableDates.length === 0 ? (
              <p className="text-center py-6 text-gray-400 text-sm">No available dates for this stylist.</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {availableDates.map(({ date, iso, isToday }) => {
                  const sel = selectedDate === iso;
                  const count = dateSlotsMap[iso] ?? 0;
                  return (
                    <button
                      key={iso}
                      onClick={() => handleDateSelect(iso)}
                      className={`flex-shrink-0 w-[60px] py-2.5 px-1 rounded-xl text-center transition-all border-2 ${
                        sel
                          ? 'bg-primary text-white border-primary shadow-md scale-105'
                          : 'bg-white text-gray-700 border-gray-100 hover:border-primary/30 hover:shadow-sm'
                      }`}
                    >
                      <div className={`text-[9px] font-bold uppercase mb-0.5 ${sel ? 'text-white/70' : 'text-gray-400'}`}>
                        {isToday ? 'TODAY' : DAY_NAMES[date.getDay()]}
                      </div>
                      <div className={`text-lg font-bold leading-none ${sel ? 'text-white' : 'text-gray-800'}`}>
                        {date.getDate()}
                      </div>
                      <div className={`text-[9px] mt-0.5 ${sel ? 'text-white/70' : 'text-gray-400'}`}>
                        {MONTH_NAMES[date.getMonth()]}
                      </div>
                      <div className={`mt-1 text-[9px] font-semibold rounded-full px-1 leading-tight ${
                        sel ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                      }`}>
                        {count} slots
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock size={15} className="text-primary" /> Select Time
              </p>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
                  <Loader2 size={18} className="animate-spin" /> Loading slots…
                </div>
              ) : slots.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-sm">No available slots for this date.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {slots.map((slot) => {
                    const sel = selectedSlot === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        onClick={() => setSelectedSlot(slot.startTime)}
                        className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                          sel ? 'bg-primary text-white border-primary shadow-sm' : 'border-gray-100 text-gray-700 hover:border-primary/30'
                        }`}
                      >
                        {fmt12(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <button
            disabled={!selectedDate || !selectedSlot}
            onClick={() => setStep(4)}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
          >
            Continue to Confirm <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* ── STEP 4: Customer + Payment + Submit ───────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <BackBtn onClick={() => setStep(3)} label="Back to Date & Time" />

          {/* Summary card */}
          <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-primary uppercase tracking-wide mb-3">Booking Summary</p>
            <div className="space-y-1.5 text-sm">
              <SummaryRow label="Stylist" value={selectedDoctor?.name} />
              <SummaryRow
                label="Date"
                value={selectedDate
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                  : '—'}
              />
              <SummaryRow label="Time" value={fmt12(selectedSlot)} />
              {selectedPackages.length > 0 && (
                <SummaryRow label="Combos" value={selectedPackages.map(p => p.name).join(', ')} />
              )}
              {selectedServices.length > 0 && (
                <SummaryRow label="Services" value={selectedServices.map(s => s.name).join(', ')} />
              )}
              {totalPkgDiscount > 0 && (
                <SummaryRow label="Combo discount" value={`– ₹${totalPkgDiscount}`} valueClass="text-emerald-600 font-semibold" />
              )}
              <div className="pt-2 border-t border-primary/10 flex justify-between">
                <span className="font-semibold text-gray-700">Total</span>
                <span className="font-bold text-primary text-base">₹{totalAmount}</span>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User size={15} className="text-primary" /> Customer Details
            </p>
            <FieldInput
              icon={<User size={14} className="text-gray-400" />}
              label="Name *"
              value={customerName}
              onChange={setCustomerName}
              placeholder="Customer name"
            />
            <FieldInput
              icon={<Phone size={14} className="text-gray-400" />}
              label="Mobile Number"
              type="tel"
              value={customerPhone}
              onChange={setCustomerPhone}
              placeholder="Phone number (optional)"
            />
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <IndianRupee size={15} className="text-primary" /> Payment Method
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'cash', label: 'Cash', Icon: Banknote },
                { id: 'upi',  label: 'UPI',  Icon: Smartphone },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setPaymentMethod(id)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    paymentMethod === id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-100 text-gray-600 hover:border-primary/30'
                  }`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !customerName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-sm shadow-primary/20"
          >
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> Creating Booking…</>
              : <><UserPlus size={16} /> Create Walk-in Booking</>}
          </button>
        </div>
      )}
    </div>
  );
};

// ── small helper components ───────────────────────────────────────────────────
const StylistPill = ({ doc, onChange }) => (
  <div className="flex items-center gap-3 bg-primary/5 border border-primary/15 rounded-2xl px-4 py-3">
    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-primary/10">
      {doc?.image
        ? <img src={doc.image} alt={doc.name} className="w-full h-full object-cover" />
        : <div className="w-full h-full flex items-center justify-center"><User size={16} className="text-primary/40" /></div>}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-800">{doc?.name}</p>
      {doc?.specialty?.length > 0 && <p className="text-xs text-gray-400 truncate">{doc.specialty.join(' · ')}</p>}
    </div>
    <button onClick={onChange} className="text-xs text-primary font-semibold hover:underline flex-shrink-0">Change</button>
  </div>
);

const BackBtn = ({ onClick, label }) => (
  <button onClick={onClick} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary font-medium transition-colors">
    <ChevronLeft size={16} /> {label}
  </button>
);

const SummaryRow = ({ label, value, valueClass = 'text-gray-800 font-semibold' }) => (
  <div className="flex justify-between gap-3 text-sm">
    <span className="text-gray-500 flex-shrink-0">{label}</span>
    <span className={`text-right ${valueClass}`}>{value || '—'}</span>
  </div>
);

const FieldInput = ({ icon, label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 border border-gray-200 rounded-xl py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
      />
    </div>
  </div>
);

export default OfflineBooking;
