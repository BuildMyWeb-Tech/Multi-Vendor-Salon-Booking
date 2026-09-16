import React, { useContext, useEffect, useState } from 'react';
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

const Appointment = () => {
    const { docId } = useParams();
    const { doctors: stylists, currencySymbol, backendUrl, token, getDoctosData: getStylesData } = useContext(AppContext);

    const stripePromise = loadStripe('pk_test_51NpjZGSJQz3QA6GnHyUmwbQtcYfeTHfQdl0i7YpeCor7Vl6qXn2nKUDRdx6AldHDhxnRUiUJRuAdBECFIwE0QQGy00Ys6rUGi8');
    const razorpayKeyId = 'rzp_test_8NBbBv2vkvuTtj';

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

    // ✅ DEBUG: Add console logging
    useEffect(() => {
        console.log('🔍 DEBUG - Current State:', {
            token: token ? 'EXISTS' : 'MISSING',
            backendUrl,
            docId,
            stylistInfo: stylistInfo ? 'LOADED' : 'NULL',
            slotSettings: slotSettings ? 'LOADED' : 'NULL',
            availableDates: availableDates.length,
            dateLoading
        });
    }, [token, backendUrl, docId, stylistInfo, slotSettings, availableDates, dateLoading]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const fetchAllServices = async () => {
        try {
            console.log('📡 Fetching services from:', `${backendUrl}/api/user/services`);
            const { data } = await axios.get(`${backendUrl}/api/user/services`);
            console.log('✅ Services response:', data);
            if (data.success) {
                setAllServices(data.services);
            }
        } catch (error) {
            console.error("❌ Error fetching services:", error);
            console.error("Error details:", error.response?.data);
            toast.error("Failed to load services");
        }
    };

    const filterStylistServices = () => {
        if (!stylistInfo || !allServices.length) return;
        const filtered = allServices.filter(service => 
            stylistInfo.specialty.includes(service.name)
        );
        console.log('🎯 Filtered services:', filtered);
        setStylistServices(filtered);
    };

    const fetchSlotSettings = async () => {
        try {
            console.log('📡 Fetching slot settings from:', `${backendUrl}/api/admin/public/slot-settings`);
            const { data } = await axios.get(backendUrl + '/api/admin/public/slot-settings');
            console.log('✅ Slot settings response:', data);
            
            if (data.success) {
                setSlotSettings(data);
            } else {
                console.warn('⚠️ Slot settings not successful, using defaults');
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
            console.error("❌ Error fetching slot settings:", error);
            console.error("Error details:", error.response?.data);
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
    };

    const fetchStylistInfo = async () => {
        const stylistInfo = stylists.find((stylist) => stylist._id === docId);
        console.log('👤 Stylist info:', stylistInfo);
        setStylistInfo(stylistInfo);
    };

    const generateAvailableDates = async () => {
        if (!slotSettings) {
            console.warn('⚠️ Slot settings not loaded yet');
            return;
        }
        
        if (!token) {
            console.warn('⚠️ Token missing, cannot fetch available dates');
            toast.warning('Please login to view available dates');
            return;
        }
        
        console.log('📅 Generating available dates...');
        setDateLoading(true);
        const dates = [];
        const today = new Date();
        const maxDays = slotSettings.maxAdvanceBookingDays || 30;
        
        console.log('Settings for date generation:', {
            maxDays,
            daysOpen: slotSettings.daysOpen,
            startTime: slotSettings.slotStartTime,
            endTime: slotSettings.slotEndTime
        });
        
        for (let i = 0; i < maxDays && dates.length < 30; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            
            if (slotSettings.daysOpen && slotSettings.daysOpen.includes(dayName)) {
                try {
                    const dateStr = date.toISOString().split("T")[0];
                    console.log(`📡 Fetching slots for ${dateStr} (${dayName})`);
                    
                    const { data } = await axios.get(
                        `${backendUrl}/api/user/available-slots`,
                        {
                            params: { date: dateStr, docId },
                            headers: { token }
                        }
                    );
                    
                    console.log(`Response for ${dateStr}:`, data);
                    
                    const slotCount = data.success ? data.slots.length : 0;
                    
                    if (slotCount > 0) {
                        dates.push({
                            date: date,
                            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
                            dayNumber: date.getDate(),
                            month: date.toLocaleDateString('en-US', { month: 'short' }),
                            isToday: i === 0,
                            slotCount: slotCount
                        });
                    } else {
                        console.log(`No slots available for ${dateStr}`);
                    }
                } catch (error) {
                    console.error(`❌ Error fetching slots for ${dateStr}:`, error);
                    console.error("Error details:", error.response?.data);
                }
            } else {
                console.log(`Skipping ${dayName} - not in daysOpen`);
            }
        }
        
        console.log('✅ Generated dates:', dates);
        setAvailableDates(dates);
        setDateLoading(false);
    };

    const fetchSlots = async (dateObj) => {
        if (!token) {
            console.warn('⚠️ Token missing, cannot fetch slots');
            toast.warning('Please login to view available slots');
            return;
        }
        
        try {
            setLoading(true);
            const dateStr = dateObj.toISOString().split("T")[0];
            console.log('📡 Fetching slots for specific date:', dateStr);

            const { data } = await axios.get(
                `${backendUrl}/api/user/available-slots`,
                {
                    params: { date: dateStr, docId },
                    headers: { token }
                }
            );

            console.log('✅ Slots response:', data);

            if (data.success) {
                setAvailableSlots(data.slots);
            } else {
                setAvailableSlots([]);
                toast.warning(data.message);
            }
        } catch (error) {
            console.error("❌ Error fetching slots:", error);
            console.error("Error details:", error.response?.data);
            toast.error("Failed to load slots");
            setAvailableSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const toggleService = (service) => {
        const isSelected = selectedServices.find(s => s._id === service._id);
        
        if (isSelected) {
            setSelectedServices(selectedServices.filter(s => s._id !== service._id));
        } else {
            setSelectedServices([...selectedServices, service]);
        }
    };

    const getTotalPrice = () => {
        return selectedServices.reduce((total, service) => total + service.basePrice, 0);
    };

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
    }, [selectedServices, slotSettings]);

    const processPayment = async (method) => {
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
                    description: `Booking with ${stylistInfo.name}`,
                    image: assets.logo || "https://example.com/your_logo.png",
                    handler: function (response) {
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
    };

    const initiateBooking = () => {
        if (!token) {
            toast.warning('Login to book appointment');
            return navigate('/login');
        }

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
    };

    const completeBooking = async (paymentMethod) => {
        setBookingLoading(true);
        const slotDate = selectedDate.toISOString().split("T")[0];

        try {
            const servicesData = selectedServices.map(s => ({
                name: s.name,
                price: s.basePrice
            }));

            console.log('📡 Booking appointment:', {
                docId,
                slotDate,
                slotTime: selectedSlotISO,
                services: servicesData,
                totalAmount: getTotalPrice(),
                paymentMethod
            });

            const { data } = await axios.post(
                backendUrl + '/api/user/book-appointment',
                {
                    docId,
                    slotDate,
                    slotTime: selectedSlotISO,
                    services: servicesData,
                    totalAmount: getTotalPrice(),
                    paymentMethod
                },
                { headers: { token } }
            );

            console.log('✅ Booking response:', data);

            if (data.success) {
                toast.success(data.message);
                await fetchSlots(selectedDate);
                setSelectedSlotISO('');
                setSelectedServices([]);
                getStylesData();

                setTimeout(() => {
                    setBookingLoading(false);
                    navigate('/my-appointments');
                }, 1500);
            } else {
                toast.error(data.message);
                setBookingLoading(false);
            }
        } catch (error) {
            console.error("❌ Booking error:", error);
            console.error("Error details:", error.response?.data);
            toast.error(error.response?.data?.message || 'Error booking appointment');
            setBookingLoading(false);
        }
    };

    useEffect(() => {
        console.log('🚀 Initial setup - fetching slot settings and services');
        fetchSlotSettings();
        fetchAllServices();
    }, []);

    useEffect(() => {
        if (stylists && stylists.length > 0) {
            console.log('👥 Stylists loaded, fetching stylist info');
            fetchStylistInfo();
        }
    }, [stylists, docId]);

    useEffect(() => {
        if (stylistInfo && allServices.length > 0) {
            console.log('🎯 Filtering stylist services');
            filterStylistServices();
        }
    }, [stylistInfo, allServices]);

    useEffect(() => {
        if (slotSettings && docId && token) {
            console.log('📅 Settings and docId ready, generating dates');
            generateAvailableDates();
        } else {
            console.log('⏳ Waiting for:', {
                slotSettings: !!slotSettings,
                docId: !!docId,
                token: !!token
            });
        }
    }, [slotSettings, docId, token]);

    if (!stylistInfo || !slotSettings) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Rest of your JSX remains the same... */}
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
                
                {/* Debug Info - Remove in production */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm font-mono">
                            Token: {token ? '✅ Present' : '❌ Missing'} | 
                            Dates: {availableDates.length} | 
                            Loading: {dateLoading ? 'Yes' : 'No'}
                        </p>
                    </div>
                )}
                
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {/* Stylist Profile Section */}
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
                    
                    {/* Booking Form Container */}
                    <div className="p-6 sm:p-8">
                        {currentStep === 1 && (
                            <div className="animate-fadeIn">
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
                                                {/* ✅ Show payment breakdown */}
                                                {slotSettings.advancePaymentRequired && slotSettings.advancePaymentPercentage < 100 && (
                                                    <p className="text-sm text-blue-700 mt-1">
                                                        Pay {slotSettings.advancePaymentPercentage}% now ({currencySymbol}{paymentAmount})
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
                        
                        {currentStep === 2 && (
                            <div className="animate-fadeIn">
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
                                        </div>
                                    ) : (
                                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                            {availableDates.map((dateInfo, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => {
                                                        setSelectedDate(dateInfo.date);
                                                        setSelectedSlotISO('');
                                                        fetchSlots(dateInfo.date);
                                                    }}
                                                    className={`flex-shrink-0 w-28 p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                                                        selectedDate?.toDateString() === dateInfo.date.toDateString()
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-xl scale-105'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-lg'
                                                    }`}
                                                >
                                                    <div className="text-center">
                                                        <div className={`text-xs font-semibold mb-1 ${
                                                            selectedDate?.toDateString() === dateInfo.date.toDateString() ? 'text-blue-200' : 'text-gray-500'
                                                        }`}>
                                                            {dateInfo.isToday ? 'TODAY' : dateInfo.dayName}
                                                        </div>
                                                        <div className="text-3xl font-bold mb-1">
                                                            {dateInfo.dayNumber}
                                                        </div>
                                                        <div className={`text-xs mb-2 ${
                                                            selectedDate?.toDateString() === dateInfo.date.toDateString() ? 'text-blue-200' : 'text-gray-600'
                                                        }`}>
                                                            {dateInfo.month}
                                                        </div>
                                                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                                            selectedDate?.toDateString() === dateInfo.date.toDateString()
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-green-100 text-green-700'
                                                        }`}>
                                                            {dateInfo.slotCount} slots
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Time Selection */}
                                {selectedDate && (
                                    <div className="mb-8">
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
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                                {availableSlots.map((slot, index) => {
                                                    let displayStartTime = slot.displayTime;
                                                    if (slot.startTime) {
                                                        const startDate = new Date(slot.startTime);
                                                        displayStartTime = startDate.toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        });
                                                    }
                                                    
                                                    return (
                                                        <div
                                                            key={index}
                                                            onClick={() => setSelectedSlotISO(slot.startTime)}
                                                            className={`py-4 px-4 text-center rounded-xl cursor-pointer transition-all font-semibold border-2 ${
                                                                slot.startTime === selectedSlotISO 
                                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105' 
                                                                    : 'bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md'
                                                            }`}
                                                        >
                                                            {displayStartTime}
                                                        </div>
                                                    );
                                                })}
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
                        
                        {currentStep === 3 && (
                            <div className="animate-fadeIn max-w-2xl mx-auto">
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
                                            <p className="text-blue-600 font-semibold mt-1">
                                                {selectedSlotISO ? new Date(selectedSlotISO).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : ''}
                                            </p>
                                        </div>
                                        
                                        <div className="space-y-3 pt-2">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-gray-700">Total Amount</span>
                                                <span className="font-bold text-gray-900 text-xl">{currencySymbol}{getTotalPrice()}</span>
                                            </div>
                                            
                                            {/* ✅ Show payment breakdown if partial payment */}
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
                                
                                {/* ✅ Payment info notice */}
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
                            <h3 className="font-bold text-yellow-900 mb-2 text-lg">Cancellation Policy</h3>
                            <p className="text-sm text-yellow-800 leading-relaxed">
                                {slotSettings.allowRescheduling 
                                    ? `Free cancellation up to ${slotSettings.rescheduleHoursBefore} hours before your appointment.`
                                    : 'Please contact us for cancellation policy details.'
                                } After that, you may be charged a cancellation fee of 50% of the service price.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </div>
    );
};

export default Appointment;