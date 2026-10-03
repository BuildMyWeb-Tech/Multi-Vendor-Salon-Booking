// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\frontend\src\pages\Appointment.jsx
import React, { useCallback, useContext, useEffect, useState, useMemo, memo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import {
  ChevronLeft, CreditCard, CheckCircle, CheckCircle2, ArrowRight,
  Shield, AlertTriangle, Loader2, Clock, Calendar, Award, User, Scissors,
  QrCode, Smartphone, Upload, X, ImageIcon, Tag, IndianRupee, Percent
} from "lucide-react";

// Lazy: only init Stripe when payment step is reached
let stripePromise = null;
const getStripe = () => {
  if (!stripePromise) stripePromise = loadStripe('pk_test_51NpjZGSJQz3QA6GnHyUmwbQtcYfeTHfQdl0i7YpeCor7Vl6qXn2nKUDRdx6AldHDhxnRUiUJRuAdBECFIwE0QQGy00Ys6rUGi8');
  return stripePromise;
};

// Memoized components remain the same
const StylistProfile = memo(({ stylistInfo }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-4 sm:p-5 border-b border-blue-100">
      <div className="flex gap-4 items-center">
        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-white shadow-md">
          {stylistInfo.image ? (
            <img src={stylistInfo.image} alt={stylistInfo.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <User size={32} className="text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{stylistInfo.name}</h1>
            <img className="w-4 h-4" src={assets.verified_icon} alt="Verified" />
          </div>
          <p className="text-blue-600 font-semibold text-sm mt-0.5 truncate">{stylistInfo.specialty.join(' • ')}</p>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            {stylistInfo.experience && (
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Award size={12} className="text-blue-500" />{stylistInfo.experience}
              </span>
            )}
            {stylistInfo.workingHours && (
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <Clock size={12} className="text-blue-500" />{stylistInfo.workingHours}
              </span>
            )}
          </div>
          {stylistInfo.about && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{stylistInfo.about}</p>
          )}
        </div>
      </div>
    </div>
  );
});

const DateOption = memo(({ dateInfo, selectedDate, onDateSelect }) => {
  const isSelected = selectedDate && selectedDate.toDateString() === dateInfo.date.toDateString();
  const monthName = dateInfo.date.toLocaleDateString('en-US', { month: 'short' });
  
  return (
    <div
      onClick={() => onDateSelect(dateInfo.date)}
      className={`flex-shrink-0 w-20 p-3 rounded-xl cursor-pointer transition-all border-2 ${
        isSelected
          ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      <div className="text-center">
        <div className={`text-[10px] font-semibold mb-0.5 ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>
          {dateInfo.isToday ? 'TODAY' : dateInfo.dayName}
        </div>
        <div className="text-2xl font-bold mb-0.5">{dateInfo.dayNumber}</div>
        <div className={`text-[10px] mb-1.5 ${isSelected ? 'text-blue-200' : 'text-gray-500'}`}>{monthName}</div>
        <div className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
          isSelected ? 'bg-blue-500 text-white' : 'bg-green-100 text-green-700'
        }`}>
          {dateInfo.slotCount}
        </div>
      </div>
    </div>
  );
});

const TimeSlot = memo(({ slot, selectedSlotISO, onSelectSlot }) => {
  const [h, m] = slot.startTime.split(':');
  
  const displayTime = new Date(1970, 0, 1, h, m).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  const isSelected = slot.startTime === selectedSlotISO;
  
  return (
    <div
      onClick={() => onSelectSlot(slot.startTime)}
      className={`py-3 px-3 text-center rounded-xl cursor-pointer transition-all font-semibold border-2 ${
        isSelected 
          ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' 
          : 'bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      {displayTime}
    </div>
  );
});

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  return new Date(1970, 0, 1, h, m).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Helper function to filter out past time slots for today
const filterPastTimeSlots = (slots, selectedDate) => {
  const today = new Date();
  const isToday = selectedDate && selectedDate.toDateString() === today.toDateString();
  
  if (!isToday) return slots;
  
  const currentTime = today.getHours() * 60 + today.getMinutes();
  
  return slots.filter(slot => {
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    const slotTime = hours * 60 + minutes;
    return slotTime > currentTime;
  });
};

const CONFETTI_COLORS = ['#a855f7', '#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
const ConfettiOverlay = () => {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.2}s`,
    duration: `${1.5 + Math.random() * 1.5}s`,
    size: `${6 + Math.floor(Math.random() * 8)}px`,
    rotate: `${Math.floor(Math.random() * 360)}deg`,
  }));
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: 0, left: p.left,
          width: p.size, height: p.size,
          backgroundColor: p.color,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          transform: `rotate(${p.rotate})`,
          animation: `confettiFall ${p.duration} ${p.delay} ease-in forwards`,
        }} />
      ))}
    </div>
  );
};

// Main component with CRITICAL performance fixes
const Appointment = () => {
  const { docId, shopSlug } = useParams();
  const { doctors: stylists, currencySymbol, backendUrl, token, getDoctosData: getStylesData } = useContext(AppContext);
  const { currentShop } = useContext(ShopContext);

  const razorpayKeyId = 'rzp_test_8NBbBv2vkvuTtj';

  const hasFetchedSettings = useRef(false);
  const hasFetchedDates = useRef(false);
  const lastDocId = useRef(null);
  const hasCheckedAuth = useRef(false);

  // State management
  const [stylistInfo, setStylistInfo] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlotISO, setSelectedSlotISO] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [slotSettings, setSlotSettings] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState([]);
  const [dateLoading, setDateLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [shopPaymentInfo, setShopPaymentInfo] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState(null);
  const screenshotInputRef = useRef(null);
  const stepTopRef = useRef(null);

  // Discount state
  const [couponCode, setCouponCode]       = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0); // percent
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError]     = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponOpen, setCouponOpen]       = useState(false);
  const [packageDiscount, setPackageDiscount] = useState(0); // percent

  // Package selection
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');

  const navigate = useNavigate();

  // Check if user is logged in on page load (with ref to prevent double toast)
  useEffect(() => {
    if (!token && !hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      toast.warning('Please login to book an appointment');
      navigate(shopSlug ? `/${shopSlug}/login` : '/login');
    }
  }, [token, navigate, shopSlug]);


  // Fast-load: fetch THIS doctor directly by ID — no need to wait for the full list
  useEffect(() => {
    if (!docId || !backendUrl || stylistInfo) return;
    axios.get(`${backendUrl}/api/doctor/${docId}`)
      .then(({ data }) => {
        if (data.success && data.doctor) setStylistInfo(data.doctor);
      })
      .catch(() => {
        // Fallback: search in full list if single-doctor endpoint unavailable
        axios.get(`${backendUrl}/api/doctor/list`)
          .then(({ data }) => {
            if (data.success) {
              const found = data.doctors.find(d => d._id === docId);
              if (found) setStylistInfo(found);
            }
          })
          .catch(() => {});
      });
  }, [docId, backendUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helpers
  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const getTotalPrice = useCallback(() => {
    return selectedServices.reduce((total, service) => total + service.basePrice, 0);
  }, [selectedServices]);

  // Final price after package + coupon discounts applied sequentially
  const getFinalPrice = useCallback(() => {
    let price = getTotalPrice();
    if (packageDiscount > 0) price = Math.round(price * (1 - packageDiscount / 100));
    if (couponDiscount  > 0) price = Math.round(price * (1 - couponDiscount  / 100));
    return price;
  }, [getTotalPrice, packageDiscount, couponDiscount]);

  // Auto-match package discount when selected services change
  useEffect(() => {
    if (!shopPaymentInfo?.packageEnabled || !shopPaymentInfo?.shopId || selectedServices.length < 2) {
      setPackageDiscount(0);
      return;
    }
    const ids = selectedServices.map((s) => String(s._id));
    axios.post(`${backendUrl}/api/user/match-package`, { shopId: shopPaymentInfo.shopId, serviceIds: ids })
      .then(({ data }) => {
        if (data.success && data.matched) setPackageDiscount(data.discountPercent);
        else setPackageDiscount(0);
      })
      .catch(() => setPackageDiscount(0));
  }, [selectedServices, shopPaymentInfo, backendUrl]);

  // Apply coupon
  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) { setCouponError('Enter a coupon code.'); return; }
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data } = await axios.post(`${backendUrl}/api/user/validate-coupon`, {
        shopId: shopPaymentInfo?.shopId,
        code: couponCode.trim(),
      });
      if (data.success) {
        setCouponDiscount(data.discountPercent);
        setCouponApplied(true);
        setCouponError('');
      } else {
        setCouponError(data.message || 'Invalid coupon code.');
        setCouponDiscount(0);
        setCouponApplied(false);
      }
    } catch {
      setCouponError('Could not validate coupon. Try again.');
    } finally { setCouponLoading(false); }
  }, [couponCode, shopPaymentInfo, backendUrl]);

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponApplied(false);
    setCouponError('');
  };

  const fetchAllServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const [svcRes, pkgRes] = await Promise.all([
        axios.get(`${backendUrl}/api/user/services`, { params: { shopSlug } }),
        axios.get(`${backendUrl}/api/user/packages?shopSlug=${shopSlug}`).catch(() => ({ data: { success: false } })),
      ]);
      if (svcRes.data.success) setAllServices(svcRes.data.services);
      if (pkgRes.data.success) setPackages((pkgRes.data.packages || []).filter(p => p.isActive));
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setServicesLoading(false);
    }
  }, [backendUrl, shopSlug]);

  const stylistServices = useMemo(() => {
    if (!stylistInfo || !allServices.length) return [];
    const specialtySet = new Set(
      (stylistInfo.specialty || []).map(s => s.toLowerCase().trim())
    );
    if (specialtySet.size === 0) return allServices;
    const filtered = allServices.filter(s => specialtySet.has(s.name.toLowerCase().trim()));
    return filtered.length > 0 ? filtered : allServices;
  }, [stylistInfo, allServices]);

  // Packages eligible for this stylist: ALL serviceIds must be in stylistServices
  const stylistPackages = useMemo(() => {
    if (!packages.length || !stylistServices.length) return [];
    const svcIdSet = new Set(stylistServices.map(s => String(s._id)));
    return packages.filter(pkg =>
      Array.isArray(pkg.serviceIds) &&
      pkg.serviceIds.length > 0 &&
      pkg.serviceIds.every(id => svcIdSet.has(String(id)))
    );
  }, [packages, stylistServices]);

  const fetchSlotSettings = useCallback(async () => {
    if (hasFetchedSettings.current || !shopSlug) return;
    hasFetchedSettings.current = true;
    try {
      const { data } = await axios.get(`${backendUrl}/api/shop/${shopSlug}/slot-settings`);
      if (data.success && data.settings) {
        setSlotSettings(data.settings);
      }
    } catch (error) {
      hasFetchedSettings.current = false;
      console.error("Error fetching slot settings:", error);
    }
  }, [backendUrl, shopSlug]);

  const fetchStylistInfo = useCallback(() => {
    const found = stylists.find((stylist) => stylist._id === docId);
    if (found) setStylistInfo(found);
  }, [stylists, docId]);

  const generateAvailableDates = useCallback(async () => {
    if (!docId || !token) return;

    if (hasFetchedDates.current && lastDocId.current === docId) return;

    setDateLoading(true);
    hasFetchedDates.current = true;
    lastDocId.current = docId;

    try {
      const response = await axios.get(`${backendUrl}/api/user/available-dates/${docId}`, {
        headers: { token },
      });

      if (!response.data.success || !Array.isArray(response.data.dates)) {
        setAvailableDates([]);
        return;
      }

      const promises = response.data.dates.map(dateStr => 
        axios.get(`${backendUrl}/api/user/available-slots`, {
          params: { date: dateStr, docId },
          headers: { token }
        }).catch(() => ({ data: { success: false, slots: [] } }))
      );

      const results = await Promise.all(promises);
      
      const datesWithSlots = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        // Parse the date string properly
        const [year, month, day] = response.data.dates[i].split('-').map(Number);
        const date = new Date(year, month - 1, day);
        
        // Filter past time slots for today
        let availableSlots = result.data.slots || [];
        const isToday = date.toDateString() === new Date().toDateString();
        
        if (isToday) {
          const now = new Date();
          const currentTime = now.getHours() * 60 + now.getMinutes();
          
          availableSlots = availableSlots.filter(slot => {
            const [hours, minutes] = slot.startTime.split(':').map(Number);
            const slotTime = hours * 60 + minutes;
            return slotTime > currentTime;
          });
        }
        
        // Only include dates with available slots
        if (!result.data.success || availableSlots.length === 0) continue;
        
        datesWithSlots.push({
          date,
          dateStr: response.data.dates[i],
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
          dayNumber: date.getDate(),
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          isToday: isToday,
          slotCount: availableSlots.length
        });
      }

      setAvailableDates(datesWithSlots);
    } catch (error) {
      console.error("Error loading available dates:", error);
      toast.error("Failed to load available dates");
      setAvailableDates([]);
    } finally {
      setDateLoading(false);
    }
  }, [docId, token, backendUrl]);

  const fetchSlots = useCallback(async (dateObj) => {
    if (!token) {
      toast.warning('Please login to view available slots');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      const dateStr = formatDate(dateObj);

      const { data } = await axios.get(`${backendUrl}/api/user/available-slots`, {
        params: { date: dateStr, docId },
        headers: { token },
      });

      if (data.success) {
        // Filter out past time slots for today
        const filteredSlots = filterPastTimeSlots(data.slots, dateObj);
        setAvailableSlots(filteredSlots);
        
        if (filteredSlots.length === 0 && data.slots.length > 0) {
          toast.info('All slots for today have passed. Please select another date.');
        } else if (filteredSlots.length === 0) {
          toast.warning('No slots available for this date');
        }
      } else {
        setAvailableSlots([]);
        toast.warning(data.message || 'No slots available');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load slots');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }, [docId, backendUrl, token, navigate]);

  const toggleService = useCallback((service) => {
    setSelectedPackage(null); // deselect package when individual service toggled
    setSelectedServices(prevServices => {
      const isSelected = prevServices.find(s => s._id === service._id);
      if (isSelected) return prevServices.filter(s => s._id !== service._id);
      return [...prevServices, service];
    });
  }, []);

  const selectPackage = useCallback((pkg) => {
    if (selectedPackage?._id === pkg._id) {
      setSelectedPackage(null);
      setSelectedServices([]);
      return;
    }
    const pkgServices = allServices.filter(s =>
      pkg.serviceIds?.some(id => String(id) === String(s._id))
    );
    setSelectedPackage(pkg);
    setSelectedServices(pkgServices);
  }, [allServices, selectedPackage]);

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    setSelectedSlotISO('');
    fetchSlots(date);
  }, [fetchSlots]);

  const completeBooking = useCallback(async (paymentMethod, screenshotFile) => {
    if (!selectedDate) return;

    setBookingLoading(true);
    const slotDate = formatDate(selectedDate);

    try {
      const servicesData = selectedServices.map(s => ({
        name: s.name,
        price: s.basePrice
      }));

      let data;
      if (screenshotFile) {
        // UPI payment — send as FormData (do NOT manually set Content-Type; axios adds boundary)
        const fd = new FormData();
        fd.append('docId', docId);
        fd.append('slotDate', slotDate);
        fd.append('slotTime', selectedSlotISO);
        fd.append('services', JSON.stringify(servicesData));
        fd.append('totalAmount', getFinalPrice());
        fd.append('paidAmount', getFinalPrice());
        fd.append('remainingAmount', 0);
        fd.append('paymentMethod', 'upi');
        fd.append('paymentScreenshot', screenshotFile);
        const res = await axios.post(backendUrl + '/api/user/book-appointment', fd, {
          headers: { token }, // No Content-Type — axios sets it with boundary automatically
        });
        data = res.data;
      } else {
        const res = await axios.post(
          backendUrl + '/api/user/book-appointment',
          {
            docId,
            slotDate,
            slotTime: selectedSlotISO,
            services: servicesData,
            totalAmount: getFinalPrice(),
            paidAmount: paymentAmount,
            remainingAmount: remainingAmount,
            paymentMethod,
          },
          { headers: { token } }
        );
        data = res.data;
      }

      if (data.success) {
        toast.success(data.message || 'Appointment booked successfully!');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
        // Reset state before navigating — wrap in try so unmount errors don't show a false failure toast
        try {
          setSelectedSlotISO('');
          setSelectedServices([]);
          setPaymentScreenshot(null);
          setPaymentScreenshotPreview(null);
          setUtrNumber('');
        } catch (_) { /* component may already be unmounting */ }
        setBookingLoading(false);
        setTimeout(() => {
          navigate(shopSlug ? `/${shopSlug}/my-appointments` : '/my-appointments');
        }, 2000);
        return; // prevent finally from running after navigate
      } else {
        toast.error(data.message || 'Booking failed.');
      }
    } catch (error) {
      // Only show error if the booking itself failed — not if navigation cleanup threw
      if (error?.response || error?.message?.includes('Network') || error?.message?.includes('timeout')) {
        toast.error(error.response?.data?.message || 'Booking failed. Please try again.');
      } else {
        // Likely a post-success unmount error — booking succeeded, ignore silently
        console.warn('Post-booking navigation error (booking was successful):', error?.message);
      }
    } finally {
      setBookingLoading(false);
    }
  }, [
    backendUrl,
    docId,
    selectedDate,
    selectedServices,
    selectedSlotISO,
    getTotalPrice, getFinalPrice,
    paymentAmount,
    remainingAmount,
    token,
    navigate,
    shopSlug,
  ]);

  const processPayment = useCallback(async (method) => {
    setPaymentMethod(method);
    setPaymentLoading(true);
  
    try {
      if (method === 'razorpay') {
        const res = await loadRazorpayScript();
        if (!res) {
          toast.error("Razorpay SDK failed to load");
          setPaymentLoading(false);
          return;
        }
  
        const options = {
          key: razorpayKeyId,
          amount: paymentAmount * 100,
          currency: "INR",
          name: currentShop?.shopName || "Salvexa",
          description: `Booking with ${stylistInfo?.name || 'stylist'} at ${currentShop?.shopName || 'our salon'}`,
          image: currentShop?.logo || "",
          handler: function() {
            setPaymentLoading(false);
            setPaymentSuccess(true);
            completeBooking('razorpay');
          },
          prefill: {
            name: "Customer Name",
            email: "customer@example.com",
            contact: "9999999999"
          },
          theme: {
            color: "#9333EA"
          },
          modal: {
            ondismiss: function() {
              setPaymentLoading(false);
            }
          }
        };
        
        const rzpay = new window.Razorpay(options);
        rzpay.open();
      } else {
        setTimeout(() => {
          setPaymentLoading(false);
          setPaymentSuccess(true);
          completeBooking(method);
        }, 1500);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setPaymentLoading(false);
      toast.error("Payment failed. Please try again.");
    }
  }, [
    loadRazorpayScript,
    paymentAmount,
    razorpayKeyId,
    stylistInfo,
    completeBooking
  ]);

  const initiateBooking = useCallback(() => {
    if (!selectedSlotISO) {
      return toast.warning('Please select a time slot');
    }

    if (selectedServices.length === 0) {
      return toast.warning('Please select at least one service');
    }

    if (!paymentMethod) {
      return toast.warning('Please select a payment method');
    }

    processPayment(paymentMethod);
  }, [selectedSlotISO, selectedServices, paymentMethod, processPayment]);

  // Fire all on mount in parallel
  useEffect(() => {
    if (!shopSlug) return;
    Promise.all([fetchSlotSettings(), fetchAllServices()]);
    axios.get(`${backendUrl}/api/shop/${shopSlug}/payment-info`)
      .then(({ data }) => { if (data.success) setShopPaymentInfo(data); })
      .catch(() => {});
  }, [shopSlug, fetchSlotSettings, fetchAllServices]);

  useEffect(() => {
    if (stylists && stylists.length > 0) {
      fetchStylistInfo();
    }
  }, [stylists, fetchStylistInfo]);

  useEffect(() => {
    if (docId && token) {
      generateAvailableDates();
    }
  }, [docId, token, generateAvailableDates]);

  useEffect(() => {
    if (selectedServices.length > 0 && slotSettings) {
      const total = getFinalPrice();

      if (slotSettings.advancePaymentRequired) {
        const percentage = slotSettings.advancePaymentPercentage || 100;
        const advanceAmount = Math.round((total * percentage) / 100);
        setPaymentAmount(advanceAmount);
        setRemainingAmount(total - advanceAmount);
      } else {
        setPaymentAmount(total);
        setRemainingAmount(0);
      }
    } else {
      setPaymentAmount(0);
      setRemainingAmount(0);
    }
  }, [selectedServices, slotSettings, getFinalPrice, packageDiscount, couponDiscount]);

  return (
    <div className="bg-gray-50 min-h-screen relative">
      {showConfetti && <ConfettiOverlay />}
      <div className="max-w-3xl mx-auto px-4 py-4 md:py-6">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <h1 className="text-lg font-bold text-gray-800">Book Your Appointment</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Show skeleton until stylist loads, then show profile immediately */}
          {!stylistInfo ? (
            <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-6 sm:p-8 animate-pulse">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/4 lg:w-1/5">
                  <div className="w-full aspect-square rounded-2xl bg-gray-200" />
                </div>
                <div className="md:w-3/4 flex-1 space-y-4 py-2">
                  <div className="h-8 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-20 bg-gray-200 rounded mt-4" />
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="h-20 bg-gray-200 rounded-xl" />
                    <div className="h-20 bg-gray-200 rounded-xl" />
                    <div className="h-20 bg-gray-200 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <StylistProfile stylistInfo={stylistInfo} />
          )}

          {/* Show booking section skeleton until stylist is ready */}
          {!stylistInfo && (
            <div className="p-6 sm:p-8 animate-pulse space-y-4">
              <div className="flex gap-4 items-center justify-between max-w-xs mx-auto">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 h-1 bg-gray-200" />
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 h-1 bg-gray-200" />
                <div className="w-10 h-10 rounded-full bg-gray-200" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-36 bg-gray-100 rounded-2xl" />
                ))}
              </div>
            </div>
          )}

          {/* Booking Steps + Content: render as soon as stylist is ready */}
          {stylistInfo && (
            <>
              <div ref={stepTopRef} className="px-4 sm:px-6 py-3 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {currentStep > 1 ? <CheckCircle2 size={14} /> : '1'}
                  </div>
                  <div
                    className={`flex-1 h-0.5 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'} transition-all`}
                  />
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {currentStep > 2 ? <CheckCircle2 size={14} /> : '2'}
                  </div>
                  <div
                    className={`flex-1 h-0.5 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'} transition-all`}
                  />
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    {currentStep > 3 ? <CheckCircle2 size={14} /> : '3'}
                  </div>
                </div>
                <div className="flex justify-between text-xs mt-1.5 px-0.5">
                  <span
                    className={currentStep === 1 ? 'font-semibold text-blue-600' : 'text-gray-500'}
                  >
                    Services
                  </span>
                  <span
                    className={currentStep === 2 ? 'font-semibold text-blue-600' : 'text-gray-500'}
                  >
                    Date & Time
                  </span>
                  <span
                    className={currentStep === 3 ? 'font-semibold text-blue-600' : 'text-gray-500'}
                  >
                    Payment
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {/* Step 1: Service Selection */}
                {currentStep === 1 && (
                  <div className="animate-slideDown">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Select Services</h2>

                    {servicesLoading ? (
                      <div className="flex items-center gap-3 py-6 text-gray-400">
                        <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin flex-shrink-0" />
                        <span className="text-sm">Loading services…</span>
                      </div>
                    ) : (
                      <>
                        {/* Individual services */}
                        {stylistServices.length === 0 ? (
                          <p className="text-gray-500 text-sm">
                            No services available for this stylist
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {stylistServices.map((service) => {
                              const isSelected = selectedServices.find(
                                (s) => s._id === service._id
                              );
                              return (
                                <div
                                  key={service._id}
                                  onClick={() => toggleService(service)}
                                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                                    isSelected
                                      ? 'border-2 border-blue-600 bg-blue-50 shadow-md'
                                      : 'border border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                                        {service.name}
                                      </h3>
                                      {service.description && (
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                          {service.description}
                                        </p>
                                      )}
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2
                                        size={16}
                                        className="text-blue-600 flex-shrink-0 mt-0.5"
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-gray-100">
                                    <span className="font-bold text-gray-900 text-sm">
                                      {currencySymbol}
                                      {service.basePrice}
                                    </span>
                                    <span
                                      className={`text-xs px-3 py-1 rounded-lg font-semibold ${
                                        isSelected
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-blue-100 text-blue-700'
                                      }`}
                                    >
                                      {isSelected ? 'Selected' : 'Select'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Trending Combo Packs */}
                        {stylistPackages.length > 0 && (
                          <div className="mb-5">
                            <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
                              <div className="flex-1 h-px bg-gray-100" />
                              <span>or Choose Combo Services</span>
                              <div className="flex-1 h-px bg-gray-100" />
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <Tag size={15} className="text-blue-600" />
                              <h3 className="font-semibold text-gray-800 text-sm">
                                Trending Combo Packs
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {stylistPackages.map((pkg) => {
                                const pkgServices = allServices.filter((s) =>
                                  pkg.serviceIds?.some((id) => String(id) === String(s._id))
                                );
                                const subtotal = pkgServices.reduce(
                                  (sum, s) => sum + s.basePrice,
                                  0
                                );
                                const comboPrice = pkg.discountPercent
                                  ? Math.round(subtotal * (1 - pkg.discountPercent / 100))
                                  : subtotal;
                                const isSelected = selectedPackage?._id === pkg._id;
                                return (
                                  <div
                                    key={pkg._id}
                                    onClick={() => selectPackage(pkg)}
                                    className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${
                                      isSelected
                                        ? 'border-blue-600 bg-blue-50 shadow-md'
                                        : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-md'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <h4 className="font-bold text-gray-800 text-sm">
                                        {pkg.name}
                                      </h4>
                                      <span className="flex items-center gap-0.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                        <Percent size={10} />
                                        {pkg.discountPercent}% OFF
                                      </span>
                                    </div>
                                    {pkgServices.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mb-2">
                                        {pkgServices.map((s) => (
                                          <span
                                            key={s._id}
                                            className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                                          >
                                            {s.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                      <div className="flex items-center gap-2">
                                        {subtotal > 0 && (
                                          <span className="text-gray-400 line-through text-xs">
                                            {currencySymbol}
                                            {subtotal}
                                          </span>
                                        )}
                                        <span className="font-bold text-gray-900 text-sm">
                                          {currencySymbol}
                                          {comboPrice}
                                        </span>
                                      </div>
                                      {isSelected && (
                                        <CheckCircle2 size={16} className="text-blue-600" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            
                          </div>
                        )}
                      </>
                    )}

                    {selectedServices.length > 0 && (
                      <div className="mt-4 flex items-center justify-between bg-blue-600 text-white rounded-xl px-5 py-3.5 shadow-lg">
                        <div>
                          <p className="text-xs text-blue-200">
                            {selectedServices.length} service(s) selected
                          </p>
                          <p className="font-bold text-base">
                            {currencySymbol}
                            {getFinalPrice()}
                          </p>
                          {slotSettings?.advancePaymentRequired &&
                            slotSettings?.advancePaymentPercentage < 100 && (
                              <p className="text-xs text-blue-200 mt-0.5">
                                Pay {slotSettings.advancePaymentPercentage}% now ({currencySymbol}
                                {Math.round(
                                  (getFinalPrice() * slotSettings.advancePaymentPercentage) / 100
                                )}
                                )
                              </p>
                            )}
                        </div>
                        <button
                          onClick={() => { setCurrentStep(2); setTimeout(() => stepTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
                          className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-all"
                        >
                          Continue <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Date & Time Selection */}
                {currentStep === 2 && (
                  <div className="animate-slideDown">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="flex items-center text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
                      >
                        <ChevronLeft size={18} />
                        <span>Back</span>
                      </button>
                      <h2 className="text-base font-bold text-gray-900">Select Date & Time</h2>
                      <div className="w-14" />
                    </div>

                    {/* Date Selection */}
                    <div className="mb-5">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Select Date
                      </label>

                      {dateLoading ? (
                        <div className="flex justify-center py-12">
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        </div>
                      ) : availableDates.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
                          <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
                          <p className="text-gray-600 font-medium">
                            No available dates at the moment
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Please check back later or contact support
                          </p>
                        </div>
                      ) : (
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                          {availableDates.map((dateInfo, index) => (
                            <DateOption
                              key={index}
                              dateInfo={dateInfo}
                              selectedDate={selectedDate}
                              onDateSelect={handleDateSelect}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Time Selection */}
                    {selectedDate && (
                      <div className="mb-5 animate-slideDown">
                        <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Clock size={15} className="text-blue-600" />
                          Select Time
                        </label>

                        {loading ? (
                          <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
                            <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-600 font-medium">
                              No slots available for this date
                            </p>
                            <p className="text-sm text-gray-500 mt-2">Please select another date</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {availableSlots.map((slot, index) => (
                              <TimeSlot
                                key={index}
                                slot={slot}
                                selectedSlotISO={selectedSlotISO}
                                onSelectSlot={setSelectedSlotISO}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedSlotISO && (
                      <div className="mt-4 flex items-center justify-between bg-blue-600 text-white rounded-xl px-5 py-3.5 shadow-lg">
                        <div>
                          <p className="text-xs text-blue-200">Selected</p>
                          <p className="font-bold text-sm">
                            {selectedDate?.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            · {formatTime(selectedSlotISO)}
                          </p>
                        </div>
                        <button
                          onClick={() => { setCurrentStep(3); setTimeout(() => stepTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
                          className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-all"
                        >
                          Continue <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
                    {!selectedSlotISO && (
                      <div className="mt-4 flex justify-end">
                        <button
                          disabled
                          className="flex items-center gap-2 bg-gray-200 text-gray-400 px-6 py-2.5 rounded-xl font-semibold text-sm cursor-not-allowed"
                        >
                          Select a time to continue <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 3 && (
                  <div className="animate-slideDown max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="flex items-center text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
                      >
                        <ChevronLeft size={18} />
                        <span>Back</span>
                      </button>
                      <h2 className="text-base font-bold text-gray-900">
                        {shopPaymentInfo?.paymentIntegrationEnabled
                          ? 'Review & Pay'
                          : 'Confirm Booking'}
                      </h2>
                      <div className="w-14" />
                    </div>

                    {/* Appointment Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-6 rounded-2xl border-2 border-blue-200 mb-6 shadow-sm">
                      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                        <CheckCircle2 size={20} className="text-blue-600" />
                        Appointment Summary
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-blue-200">
                          <div>
                            <p className="text-xs text-gray-500">Stylist</p>
                            <p className="font-bold text-gray-900">{stylistInfo.name}</p>
                          </div>
                          {stylistInfo.image ? (
                            <img
                              src={stylistInfo.image}
                              alt={stylistInfo.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-white shadow flex items-center justify-center">
                              <User size={22} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="pb-4 border-b border-blue-200">
                          <p className="text-xs text-gray-500 mb-2">Services</p>
                          {selectedServices.map((service) => (
                            <div
                              key={service._id}
                              className="flex justify-between items-center bg-white px-3 py-2 rounded-lg mb-1"
                            >
                              <span className="text-sm font-medium text-gray-800">
                                {service.name}
                              </span>
                              <span className="text-sm font-bold text-blue-600">
                                {currencySymbol}
                                {service.basePrice}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="pb-4 border-b border-blue-200">
                          <p className="text-xs text-gray-500">Date & Time</p>
                          <p className="font-bold text-gray-900">
                            {selectedDate?.toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-blue-600 font-semibold text-sm">
                            {formatTime(selectedSlotISO)}
                          </p>
                        </div>
                        {/* Discount breakdown */}
                        {(packageDiscount > 0 || couponDiscount > 0) && (
                          <div className="space-y-1 pb-2 border-b border-blue-200">
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>Subtotal</span>
                              <span>
                                {currencySymbol}
                                {getTotalPrice()}
                              </span>
                            </div>
                            {packageDiscount > 0 && (
                              <div className="flex justify-between text-sm text-emerald-600">
                                <span>Package discount ({packageDiscount}%)</span>
                                <span>
                                  -{currencySymbol}
                                  {getTotalPrice() -
                                    Math.round(getTotalPrice() * (1 - packageDiscount / 100))}
                                </span>
                              </div>
                            )}
                            {couponDiscount > 0 && (
                              <div className="flex justify-between text-sm text-emerald-600">
                                <span>Coupon discount ({couponDiscount}%)</span>
                                <span>
                                  -{currencySymbol}
                                  {Math.round(getTotalPrice() * (1 - packageDiscount / 100)) -
                                    getFinalPrice()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex justify-between items-center font-bold text-lg">
                          <span className="text-gray-700">Total Amount</span>
                          <span className="text-gray-900">
                            {currencySymbol}
                            {getFinalPrice()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── Coupon Code (when enabled for this salon) ── */}
                    {shopPaymentInfo?.couponEnabled && (
                      <div className="mb-5">
                        {!couponOpen && !couponApplied && (
                          <button
                            type="button"
                            onClick={() => setCouponOpen(true)}
                            className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-xl transition-all w-full justify-center"
                          >
                            <Tag size={14} />
                            Add Coupon
                          </button>
                        )}
                        <div
                          className={`bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-sm ${!couponOpen && !couponApplied ? 'hidden' : ''}`}
                        >
                          <h3 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-2">
                            <Tag size={15} className="text-blue-600" />
                            Have a Coupon Code?
                          </h3>
                          {couponApplied ? (
                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                              <div>
                                <p className="text-sm font-semibold text-emerald-700">
                                  Coupon applied — {couponDiscount}% off!
                                </p>
                                <p className="text-xs text-emerald-500 font-mono">
                                  {couponCode.toUpperCase()}
                                </p>
                              </div>
                              <button
                                onClick={removeCoupon}
                                className="text-emerald-600 hover:text-red-500 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Enter coupon code"
                                value={couponCode}
                                onChange={(e) => {
                                  setCouponCode(e.target.value);
                                  setCouponError('');
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-gray-50"
                              />
                              <button
                                onClick={applyCoupon}
                                disabled={couponLoading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                              >
                                {couponLoading ? '…' : 'Apply'}
                              </button>
                            </div>
                          )}
                          {couponError && (
                            <p className="text-xs text-red-500 mt-2">{couponError}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── UPI Payment (when enabled for this salon) ── */}
                    {shopPaymentInfo?.paymentIntegrationEnabled ? (
                      <div className="space-y-5">
                        {/* UPI Payment Details — Name, Mobile, QR only */}
                        <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 shadow-sm">
                          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <QrCode size={18} className="text-blue-600" />
                            Scan & Pay via UPI
                          </h3>
                          <div className="flex flex-col sm:flex-row gap-6 items-start">
                            {shopPaymentInfo.upiId && (
                              <div className="flex-shrink-0 text-center">
                                <img
                                  src={`${backendUrl}/api/shop/${shopSlug}/upi-qr?amount=${getFinalPrice()}`}
                                  alt="UPI QR Code"
                                  className="w-44 h-44 object-contain border-2 border-gray-200 rounded-xl p-2 bg-white shadow"
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                  Scan to pay ₹{getFinalPrice()}
                                </p>
                              </div>
                            )}
                            <div className="flex-1 space-y-3">
                              {shopPaymentInfo.upiName && (
                                <div className="bg-blue-50 rounded-xl px-4 py-3">
                                  <p className="text-xs text-gray-500 mb-0.5">Pay To</p>
                                  <p className="font-bold text-blue-700 text-base">
                                    {shopPaymentInfo.upiName}
                                  </p>
                                </div>
                              )}
                              {shopPaymentInfo.upiMobileNumber && (
                                <div className="bg-blue-50 rounded-xl px-4 py-3">
                                  <p className="text-xs text-gray-500 mb-0.5">Mobile Number</p>
                                  <p className="font-bold text-blue-700 text-base flex items-center gap-2">
                                    <Smartphone size={15} />
                                    {shopPaymentInfo.upiMobileNumber}
                                  </p>
                                </div>
                              )}
                              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                                <p className="text-xs text-gray-500 mb-0.5">Amount to Pay</p>
                                <p className="font-bold text-green-700 text-2xl">
                                  {currencySymbol}
                                  {getFinalPrice()}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Screenshot Upload */}
                        <div className="bg-white border-2 border-dashed border-blue-200 rounded-2xl p-6">
                          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <Upload size={17} className="text-blue-600" />
                            Upload Payment Screenshot
                          </h3>
                          <p className="text-sm text-gray-500 mb-4">
                            Upload a screenshot of your completed UPI payment as proof.
                          </p>

                          {paymentScreenshotPreview ? (
                            <div className="relative inline-block">
                              <img
                                src={paymentScreenshotPreview}
                                alt="Payment proof"
                                className="max-h-52 rounded-xl border border-gray-200 shadow"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentScreenshot(null);
                                  setPaymentScreenshotPreview(null);
                                }}
                                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow"
                              >
                                <X size={14} />
                              </button>
                              <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                                <CheckCircle size={13} /> Screenshot uploaded
                              </p>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => screenshotInputRef.current?.click()}
                              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                            >
                              <ImageIcon size={32} />
                              <span className="text-sm font-medium">
                                Click to upload screenshot
                              </span>
                              <span className="text-xs">PNG, JPG up to 5MB</span>
                            </button>
                          )}
                          <input
                            ref={screenshotInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('File must be under 5MB');
                                return;
                              }
                              setPaymentScreenshot(file);
                              const reader = new FileReader();
                              reader.onload = () => setPaymentScreenshotPreview(reader.result);
                              reader.readAsDataURL(file);
                            }}
                          />
                        </div>

                        {/* Confirm Button */}
                        <button
                          onClick={() => {
                            if (!paymentScreenshot) {
                              toast.warning('Please upload your payment screenshot');
                              return;
                            }
                            completeBooking('upi', paymentScreenshot);
                          }}
                          disabled={bookingLoading || !paymentScreenshot}
                          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          {bookingLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Confirming...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={22} />
                              <span>
                                Confirm Booking — {currencySymbol}
                                {getFinalPrice()}
                              </span>
                            </>
                          )}
                        </button>
                        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                          <Shield size={12} /> Screenshot submitted — admin will verify your payment
                        </p>
                      </div>
                    ) : (
                      /* ── No payment integration — direct booking ── */
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                          <Shield size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-blue-800">
                            Your appointment will be confirmed instantly. Payment can be made at the
                            salon.
                          </p>
                        </div>
                        <button
                          onClick={() => completeBooking('cash', null)}
                          disabled={bookingLoading}
                          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {bookingLoading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Confirming...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={22} />
                              <span>Book Appointment</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {slotSettings && (
          <div className="max-w-2xl mx-auto mt-8 bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 shadow-md">
            <div className="flex items-start gap-4">
              <AlertTriangle size={24} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-yellow-900 mb-2 text-lg">
                  Cancellation & Rescheduling Policy
                </h3>
                <div className="text-sm text-yellow-800 leading-relaxed space-y-2">
                  <p>
                    <strong>Free Cancellation:</strong>{' '}
                    {slotSettings.allowRescheduling
                      ? `You may cancel or reschedule your appointment free of charge up to ${slotSettings.rescheduleHoursBefore} hours (${Math.floor(slotSettings.rescheduleHoursBefore / 24)} ${Math.floor(slotSettings.rescheduleHoursBefore / 24) === 1 ? 'day' : 'days'}) before your scheduled time.`
                      : 'Please contact us at least 24 hours in advance to cancel or reschedule your appointment.'}
                  </p>
                  <p>
                    <strong>Late Cancellations:</strong> Cancellations made less than{' '}
                    {slotSettings.rescheduleHoursBefore || 24} hours before your appointment will
                    incur a cancellation fee of 50% of the service price.
                  </p>
                  <p>
                    <strong>No-Shows:</strong> If you fail to show up for your appointment without
                    prior notice, you will be charged the full service price.
                  </p>
                  <p>
                    <strong>How to Cancel:</strong> You can cancel your appointment anytime through
                    the "My Appointments" section or by contacting our support team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .animate-slideDown { animation: slideDown 0.4s ease-out; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>
      </div>
    </div>
  );
};

export default Appointment;