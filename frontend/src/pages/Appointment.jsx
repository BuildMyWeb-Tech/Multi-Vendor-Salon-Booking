// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\frontend\src\pages\Appointment.jsx
import React, { useCallback, useContext, useEffect, useState, useMemo, memo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import { 
  ChevronLeft, CreditCard, CheckCircle, CheckCircle2, ArrowRight,
  Shield, AlertTriangle, Loader2, Clock, Calendar, Award, User, Scissors
} from "lucide-react";

const stripePromise = loadStripe('pk_test_51NpjZGSJQz3QA6GnHyUmwbQtcYfeTHfQdl0i7YpeCor7Vl6qXn2nKUDRdx6AldHDhxnRUiUJRuAdBECFIwE0QQGy00Ys6rUGi8');

// Memoized components remain the same
const StylistProfile = memo(({ stylistInfo, slotSettings }) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-6 sm:p-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/4 lg:w-1/5">
          <div className="relative">
            <img 
              src={stylistInfo.image} 
              alt={stylistInfo.name} 
              className="w-full aspect-square object-cover rounded-2xl shadow-lg border-4 border-white" 
            />
            {stylistInfo.available && (
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5">
                <CheckCircle size={14} />
                Available 
              </div>
            )}
          </div>
        </div>
        
        <div className="md:w-3/4 lg:w-4/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{stylistInfo.name}</h1>
                <img className="w-6 h-6" src={assets.verified_icon} alt="Verified" />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-gray-600">
                <p className="text-blue-600 font-semibold text-lg">{stylistInfo.specialty.join(' • ')}</p>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm">
                  <Award size={16} className="text-blue-600" />
                  <span className="font-medium">{stylistInfo.experience}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <User size={18} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">About</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">{stylistInfo.about}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-all border border-blue-100">
              <div className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                <Award size={16} className="text-blue-600" />
                Experience
              </div>
              <div className="text-2xl font-bold text-gray-900">{stylistInfo.experience}</div>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-all border border-blue-100">
              <div className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                <Clock size={16} className="text-blue-600" />
                Working Hours
              </div>
              <div className="text-lg font-bold text-gray-900">{stylistInfo.workingHours || `${slotSettings.slotStartTime} - ${slotSettings.slotEndTime}`}</div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-all border border-blue-100">
              <div className="text-sm text-gray-600 flex items-center gap-2 mb-2">
                <Scissors size={16} className="text-blue-600" />
                Specialties
              </div>
              <div className="text-lg font-bold text-gray-900">{stylistInfo.specialty.length} Services</div>
            </div>
          </div>
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
      className={`flex-shrink-0 w-28 p-4 rounded-2xl cursor-pointer transition-all border-2 ${
        isSelected
          ? 'bg-blue-600 text-white border-blue-600 shadow-xl scale-105'
          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-lg'
      }`}
    >
      <div className="text-center">
        <div className={`text-xs font-semibold mb-1 ${
          isSelected ? 'text-blue-200' : 'text-gray-500'
        }`}>
          {dateInfo.isToday ? 'TODAY' : dateInfo.dayName}
        </div>
        <div className="text-3xl font-bold mb-1">
          {dateInfo.dayNumber}
        </div>
        <div className={`text-xs mb-2 ${
          isSelected ? 'text-blue-200' : 'text-gray-600'
        }`}>
          {monthName}
        </div>
        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
          isSelected
            ? 'bg-blue-500 text-white'
            : 'bg-green-100 text-green-700'
        }`}>
          {dateInfo.slotCount} slots
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
      className={`py-4 px-4 text-center rounded-xl cursor-pointer transition-all font-semibold border-2 ${
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

// Main component with CRITICAL performance fixes
const Appointment = () => {
  const { docId } = useParams();
  const { doctors: stylists, currencySymbol, backendUrl, token, getDoctosData: getStylesData } = useContext(AppContext);

  const razorpayKeyId = 'rzp_test_8NBbBv2vkvuTtj';

  const hasFetchedSettings = useRef(false);
  const hasFetchedServices = useRef(false);
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
  const [slotSettings, setSlotSettings] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [stylistServices, setStylistServices] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [dateLoading, setDateLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);

  const navigate = useNavigate();

  // Check if user is logged in on page load (with ref to prevent double toast)
  useEffect(() => {
    if (!token && !hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      toast.warning('Please login to book an appointment');
      navigate('/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 DEBUG - Current State:', {
        token: token ? 'EXISTS' : 'MISSING',
        docId,
        stylistInfo: stylistInfo ? 'LOADED' : 'NULL',
        slotSettings: slotSettings ? 'LOADED' : 'NULL',
        availableDates: availableDates.length
      });
    }
  }, [token, docId, stylistInfo, slotSettings]);

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

  const fetchAllServices = useCallback(async () => {
    if (hasFetchedServices.current) return;
    
    try {
      hasFetchedServices.current = true;
      const { data } = await axios.get(`${backendUrl}/api/user/services`);
      if (data.success) {
        console.log('📦 Services fetched:', data.services.length);
        setAllServices(data.services);
      }
    } catch (error) {
      hasFetchedServices.current = false;
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
    }
  }, [backendUrl]);

  const filterStylistServices = useCallback(() => {
    if (!stylistInfo || !allServices.length) return;
    const filtered = allServices.filter(service => 
      stylistInfo.specialty.includes(service.name)
    );
    console.log('🔍 Filtered stylist services:', filtered.length);
    setStylistServices(filtered);
  }, [stylistInfo, allServices]);

  const fetchSlotSettings = useCallback(async () => {
    if (hasFetchedSettings.current) return;
    
    try {
      hasFetchedSettings.current = true;
      const { data } = await axios.get(backendUrl + '/api/admin/public/slot-settings');
      if (data.success) {
        console.log('⚙️ Slot settings loaded - Times:', {
          start: data.slotStartTime,
          end: data.slotEndTime,
          duration: data.slotDuration
        });
        setSlotSettings(data);
      } else {
        setSlotSettings({
          slotStartTime: "09:00",
          slotEndTime: "17:00",
          slotDuration: 30,
          breakTime: false,
          daysOpen: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          allowRescheduling: true,
          rescheduleHoursBefore: 24,
          maxAdvanceBookingDays: 30,
          minBookingTimeBeforeSlot: 0,
          advancePaymentRequired: true,
          advancePaymentPercentage: 100
        });
      }
    } catch (error) {
      hasFetchedSettings.current = false;
      console.error("Error fetching slot settings:", error);
    }
  }, [backendUrl]);

  const fetchStylistInfo = useCallback(() => {
    const stylistInfo = stylists.find((stylist) => stylist._id === docId);
    console.log('💇 Stylist info:', stylistInfo?.name || 'Not found');
    setStylistInfo(stylistInfo);
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
    setSelectedServices(prevServices => {
      const isSelected = prevServices.find(s => s._id === service._id);
      
      if (isSelected) {
        return prevServices.filter(s => s._id !== service._id);
      } else {
        return [...prevServices, service];
      }
    });
  }, []);

  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
    setSelectedSlotISO('');
    fetchSlots(date);
  }, [fetchSlots]);

  const completeBooking = useCallback(async (paymentMethod) => {
    if (!selectedDate) return;

    setBookingLoading(true);
    const slotDate = formatDate(selectedDate);

    try {
      const servicesData = selectedServices.map(s => ({
        name: s.name,
        price: s.basePrice
      }));

      const { data } = await axios.post(
        backendUrl + '/api/user/book-appointment',
        {
          docId,
          slotDate,
          slotTime: selectedSlotISO,
          services: servicesData,
          totalAmount: getTotalPrice(),
          paidAmount: paymentAmount,
          remainingAmount: remainingAmount,
          paymentMethod
        },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        await fetchSlots(selectedDate);
        setSelectedSlotISO('');
        setSelectedServices([]);
        navigate('/my-appointments');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  }, [
    backendUrl,
    docId,
    selectedDate,
    selectedServices,
    selectedSlotISO,
    getTotalPrice,
    paymentAmount,
    remainingAmount,
    token,
    fetchSlots,
    navigate
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
          name: "Salon Stylist",
          description: `Booking with ${stylistInfo?.name || 'stylist'}`,
          image: assets.logo || "https://example.com/your_logo.png",
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

  useEffect(() => {
    fetchSlotSettings();
    fetchAllServices();
  }, []);

  useEffect(() => {
    if (stylists && stylists.length > 0) {
      fetchStylistInfo();
    }
  }, [stylists, fetchStylistInfo]);

  useEffect(() => {
    if (stylistInfo && allServices.length > 0) {
      filterStylistServices();
    }
  }, [stylistInfo, allServices, filterStylistServices]);

  useEffect(() => {
    if (slotSettings && docId && token) {
      generateAvailableDates();
    }
  }, [slotSettings, docId, token, generateAvailableDates]);

  useEffect(() => {
    if (selectedServices.length > 0 && slotSettings) {
      const total = getTotalPrice();
      
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
  }, [selectedServices, slotSettings, getTotalPrice]);

  if (!stylistInfo || !slotSettings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <div className="mb-8 flex items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors mr-4"
          >
            <ChevronLeft size={24} className="text-gray-500" />
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Book Your Appointment</h1>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <StylistProfile stylistInfo={stylistInfo} slotSettings={slotSettings} />
          
          {/* Booking Steps Indicator */}
          <div className="px-6 sm:px-8 py-6 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <div className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'} flex items-center justify-center font-semibold shadow-sm transition-all`}>
                  {currentStep > 1 ? <CheckCircle2 size={20} /> : '1'}
                </div>
                <div className={`h-1 flex-1 mx-2 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'} transition-all`}></div>
                <div className={`w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'} flex items-center justify-center font-semibold shadow-sm transition-all`}>
                  {currentStep > 2 ? <CheckCircle2 size={20} /> : '2'}
                </div>
                <div className={`h-1 flex-1 mx-2 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'} transition-all`}></div>
                <div className={`w-10 h-10 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'} flex items-center justify-center font-semibold shadow-sm transition-all`}>
                  {currentStep > 3 ? <CheckCircle2 size={20} /> : '3'}
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-3 max-w-3xl mx-auto px-2">
              <span className={currentStep === 1 ? "font-semibold text-blue-600" : ""}>Select Services</span>
              <span className={currentStep === 2 ? "font-semibold text-blue-600" : ""}>Choose Time</span>
              <span className={currentStep === 3 ? "font-semibold text-blue-600" : ""}>Payment</span>
            </div>
          </div>
          
          <div className="p-6 sm:p-8">
            {/* Step 1: Service Selection */}
            {currentStep === 1 && (
              <div className="animate-slideDown">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Services</h2>
                
                {stylistServices.length === 0 ? (
                  <p className="text-gray-500">No services available for this stylist</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {stylistServices.map((service) => {
                      const isSelected = selectedServices.find(s => s._id === service._id);
                      return (
                        <div 
                          key={service._id}
                          onClick={() => toggleService(service)}
                          className={`p-6 rounded-2xl cursor-pointer transition-all transform hover:scale-105 ${
                            isSelected
                              ? 'border-2 border-blue-600 bg-blue-50 shadow-xl'
                              : 'border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg bg-white'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg mb-1">{service.name}</h3>
                              <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 size={24} className="text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                            <span className="font-bold text-gray-900 text-xl">{currencySymbol}{service.basePrice}</span>
                            <button className={`text-sm px-4 py-2 rounded-lg font-semibold transition-all ${
                              isSelected 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            }`}>
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedServices.length > 0 && (
                  <div className="mt-8 bg-gradient-to-r from-blue-50 to-pink-50 p-6 rounded-2xl border-2 border-blue-200 shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-700 mb-1">{selectedServices.length} service(s) selected</p>
                        <p className="text-2xl font-bold text-gray-900">Total: {currencySymbol}{getTotalPrice()}</p>
                        {slotSettings.advancePaymentRequired && slotSettings.advancePaymentPercentage < 100 && (
                          <p className="text-sm text-blue-700 mt-1">
                            Pay {slotSettings.advancePaymentPercentage}% now ({currencySymbol}{Math.round((getTotalPrice() * slotSettings.advancePaymentPercentage) / 100)})
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => setCurrentStep(2)}
                        className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <span>Continue</span>
                        <ArrowRight size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Step 2: Date & Time Selection */}
            {currentStep === 2 && (
              <div className="animate-slideDown">
                <div className="mb-6">
                  <button 
                    onClick={() => setCurrentStep(1)} 
                    className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
                  >
                    <ChevronLeft size={20} />
                    <span>Back to Services</span>
                  </button>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-6 rounded-2xl border border-blue-200 mb-8 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg">Selected Services</h3>
                  <div className="space-y-3">
                    {selectedServices.map(service => (
                      <div key={service._id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                        <span className="text-gray-800 font-medium">{service.name}</span>
                        <span className="font-bold text-blue-600">{currencySymbol}{service.basePrice}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t-2 border-blue-200 flex justify-between items-center">
                      <span className="font-bold text-gray-900 text-lg">Total</span>
                      <span className="text-2xl font-bold text-blue-600">{currencySymbol}{getTotalPrice()}</span>
                    </div>
                  </div>
                </div>
              
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Date & Time</h2>
                
                {/* Date Selection */}
                <div className="mb-8">
                  <label className="block text-base font-semibold text-gray-900 mb-4">Select Date</label>
                  
                  {dateLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  ) : availableDates.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
                      <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">No available dates at the moment</p>
                      <p className="text-sm text-gray-500 mt-2">Please check back later or contact support</p>
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
                  <div className="mb-8 animate-slideDown">
                    <label className="block text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock size={20} className="text-blue-600" />
                      Select Time
                    </label>
                    
                    {loading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
                        <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
                        <p className="text-gray-600 font-medium">No slots available for this date</p>
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

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => {
                      if (selectedSlotISO) {
                        setCurrentStep(3);
                      } else {
                        toast.warning("Please select a time slot");
                      }
                    }}
                    disabled={!selectedSlotISO}
                    className={`flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all shadow-lg ${
                      !selectedSlotISO
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl transform hover:scale-105'
                    }`}
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {currentStep === 3 && (
              <div className="animate-slideDown max-w-2xl mx-auto">
                <div className="mb-6">
                  <button 
                    onClick={() => setCurrentStep(2)} 
                    className="flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
                  >
                    <ChevronLeft size={20} />
                    <span>Back to Schedule</span>
                  </button>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Review and Pay</h2>
                
                <div className="bg-gradient-to-r from-blue-50 to-pink-50 p-8 rounded-2xl border-2 border-blue-200 mb-8 shadow-lg">
                  <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
                    <CheckCircle2 size={22} className="text-blue-600" />
                    Appointment Summary
                  </h3>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-start pb-5 border-b-2 border-blue-200">
                      <div>
                        <span className="text-gray-600 text-sm font-medium">Stylist</span>
                        <p className="font-bold text-gray-900 text-lg">{stylistInfo.name}</p>
                      </div>
                      <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white shadow-lg">
                        <img src={stylistInfo.image} alt={stylistInfo.name} className="w-full h-full object-cover" />
                      </div>
                    </div>
                    
                    <div className="pb-5 border-b-2 border-blue-200">
                      <span className="text-gray-600 text-sm font-medium">Services</span>
                      <div className="space-y-3 mt-3">
                        {selectedServices.map(service => (
                          <div key={service._id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                            <p className="font-semibold text-gray-900">{service.name}</p>
                            <p className="font-bold text-blue-600">{currencySymbol}{service.basePrice}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="pb-5 border-b-2 border-blue-200">
                      <span className="text-gray-600 text-sm font-medium">Date & Time</span>
                      <p className="font-bold text-gray-900 text-lg mt-1">
                        {selectedDate?.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>                    
                      <p className="text-blue-600 font-semibold mt-1">{formatTime(selectedSlotISO)}</p>
                    </div>
                    
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">Total Amount</span>
                        <span className="font-bold text-gray-900 text-xl">{currencySymbol}{getTotalPrice()}</span>
                      </div>
                      
                      {slotSettings.advancePaymentRequired && slotSettings.advancePaymentPercentage < 100 && (
                        <>
                          <div className="flex justify-between items-center bg-blue-100 px-4 py-3 rounded-lg">
                            <span className="font-semibold text-blue-900">
                              Pay Now ({slotSettings.advancePaymentPercentage}%)
                            </span>
                            <span className="font-bold text-blue-900 text-xl">{currencySymbol}{paymentAmount}</span>
                          </div>
                          <div className="flex justify-between items-center text-gray-600">
                            <span className="text-sm">Pay at Salon</span>
                            <span className="font-semibold">{currencySymbol}{remainingAmount}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {slotSettings.advancePaymentRequired && slotSettings.advancePaymentPercentage < 100 && (
                  <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Shield size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-1">Advance Payment Required</h4>
                        <p className="text-sm text-blue-800">
                          You'll pay {slotSettings.advancePaymentPercentage}% ({currencySymbol}{paymentAmount}) now to confirm your booking. 
                          The remaining {currencySymbol}{remainingAmount} will be paid at the salon.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-5">
                  <h3 className="font-bold text-gray-900 text-lg">Select Payment Method</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod('stripe')}
                      className={`flex items-center justify-between p-5 border-2 rounded-2xl transition-all ${
                        paymentMethod === 'stripe'
                          ? 'border-blue-600 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                      disabled={paymentLoading}
                    >
                      <div className="flex items-center gap-4">
                        <img src={assets.stripe_logo} alt="Stripe" className="h-8 w-auto" />
                        <span className="font-semibold text-gray-900">Pay with Stripe</span>
                      </div>
                      {paymentMethod === 'stripe' && !paymentLoading && <CheckCircle2 size={24} className="text-blue-600" />}
                    </button>
                    
                    <button
                      onClick={() => setPaymentMethod('razorpay')}
                      className={`flex items-center justify-between p-5 border-2 rounded-2xl transition-all ${
                        paymentMethod === 'razorpay'
                          ? 'border-blue-600 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                      disabled={paymentLoading}
                    >
                      <div className="flex items-center gap-4">
                        <img src={assets.razorpay_logo} alt="Razorpay" className="h-8 w-auto" />
                        <span className="font-semibold text-gray-900">Pay with Razorpay</span>
                      </div>
                      {paymentMethod === 'razorpay' && !paymentLoading && <CheckCircle2 size={24} className="text-blue-600" />}
                    </button>
                  </div>
                </div>
                
                <div className="mt-8">
                  <button 
                    onClick={initiateBooking}
                    disabled={paymentLoading || bookingLoading}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing Payment...</span>
                      </>
                    ) : bookingLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Confirming Booking...</span>
                      </>
                    ) : paymentSuccess ? (
                      <>
                        <CheckCircle2 size={24} />
                        <span>Payment Successful!</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={24} />
                        <span>
                          Pay & Confirm {currencySymbol}
                          {slotSettings.advancePaymentRequired && slotSettings.advancePaymentPercentage < 100 
                            ? paymentAmount 
                            : getTotalPrice()
                          }
                        </span>
                      </>
                    )}
                  </button>
                  
                  <p className="text-sm text-gray-600 text-center mt-4 flex items-center justify-center gap-2">
                    <Shield size={16} />
                    Your payment information is securely processed
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-8 bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 shadow-md">
          <div className="flex items-start gap-4">
            <AlertTriangle size={24} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-yellow-900 mb-2 text-lg">Cancellation & Rescheduling Policy</h3>
              <div className="text-sm text-yellow-800 leading-relaxed space-y-2">
                <p>
                  <strong>Free Cancellation:</strong> {slotSettings.allowRescheduling 
                    ? `You may cancel or reschedule your appointment free of charge up to ${slotSettings.rescheduleHoursBefore} hours (${Math.floor(slotSettings.rescheduleHoursBefore / 24)} ${Math.floor(slotSettings.rescheduleHoursBefore / 24) === 1 ? 'day' : 'days'}) before your scheduled time.`
                    : 'Please contact us at least 24 hours in advance to cancel or reschedule your appointment.'
                  }
                </p>
                <p>
                  <strong>Late Cancellations:</strong> Cancellations made less than {slotSettings.rescheduleHoursBefore || 24} hours before your appointment will incur a cancellation fee of 50% of the service price.
                </p>
                <p>
                  <strong>No-Shows:</strong> If you fail to show up for your appointment without prior notice, you will be charged the full service price.
                </p>
                <p>
                  <strong>How to Cancel:</strong> You can cancel your appointment anytime through the "My Appointments" section or by contacting our support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>
        {`
        @keyframes slideDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .animate-slideDown {
          animation: slideDown 0.4s ease-out;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        `}
      </style>
    </div>
  );
};

export default Appointment;