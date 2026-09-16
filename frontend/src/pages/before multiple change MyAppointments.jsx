import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  X, 
  ChevronLeft, 
  Scissors, 
  CreditCard,
  Check,
  Sparkles,
  CheckCircle,
  AlertCircle,
  BadgeCheck,
  Star,
  ChevronsRight,
  ChevronsUp,
  Info
} from 'lucide-react';

const MyAppointments = () => {
    const { backendUrl, token, currencySymbol = "₹" } = useContext(AppContext);
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [rescheduleModal, setRescheduleModal] = useState(false);
    const [cancelModal, setCancelModal] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);
    const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);
    const [appointmentToPay, setAppointmentToPay] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [canReschedule, setCanReschedule] = useState(true);
    const [hasUsedReschedule, setHasUsedReschedule] = useState(false);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [localAppointments, setLocalAppointments] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [paymentLoading, setPaymentLoading] = useState(false);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Function to format the date eg. ( 2026-01-23 => 23 Jan 2026 )
    const slotDateFormat = (slotDate) => {
        if (!slotDate) return '';
        
        const dateObj = new Date(slotDate);
        const day = dateObj.getDate();
        const month = dateObj.getMonth();
        const year = dateObj.getFullYear();
        
        return `${day} ${months[month]} ${year}`;
    };

    // Getting User Appointments Data Using API
    const getUserAppointments = async () => {
        setIsLoading(true);
        try {
            const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } });
            setAppointments(data.appointments.reverse());
            setLocalAppointments(data.appointments.reverse());
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to cancel appointment Using API
    const cancelAppointment = async () => {
        if (!appointmentToCancel) return;
        
        try {
            // Update local state immediately
            setLocalAppointments(prevAppointments => 
                prevAppointments.map(app => 
                    app._id === appointmentToCancel._id ? 
                    { ...app, cancelled: true } : 
                    app
                )
            );
            
            // Show in cancelled tab
            setActiveTab('cancelled');
            
            // API call
            const { data } = await axios.post(
                backendUrl + '/api/user/cancel-appointment', 
                { appointmentId: appointmentToCancel._id }, 
                { headers: { token } }
            );

            if (data.success) {
                toast.success(data.message);
                setCancelModal(false);
                setAppointmentToCancel(null);
                // Update server data
                getUserAppointments();
            } else {
                toast.error(data.message);
                // Rollback local state if server fails
                setLocalAppointments(prevAppointments => 
                    prevAppointments.map(app => 
                        app._id === appointmentToCancel._id ? 
                        { ...app, cancelled: false } : 
                        app
                    )
                );
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
            // Rollback local state if API fails
            setLocalAppointments(prevAppointments => 
                prevAppointments.map(app => 
                    app._id === appointmentToCancel._id ? 
                    { ...app, cancelled: false } : 
                    app
                )
            );
        }
    };

    // Open payment modal
    const openPaymentModal = (appointment) => {
        setAppointmentToPay(appointment);
        setShowPaymentModal(true);
    };

    // Simulate completing an appointment (for demo/testing)
    const markAppointmentComplete = (appointmentId) => {
        // Update local state immediately
        setLocalAppointments(prevAppointments => 
            prevAppointments.map(app => 
                app._id === appointmentId ? 
                { ...app, isCompleted: true } : 
                app
            )
        );
        
        // Switch to completed tab to show the newly completed appointment
        setActiveTab('completed');
        
        // In a real app, you'd make an API call here
        // For demo purposes, we'll just use a toast
        toast.success("Appointment marked as completed!");
    };

    // Process payment when user selects a payment method
    const processPayment = (method) => {
        if (!appointmentToPay) return;
        
        setPaymentMethod(method);
        setPaymentLoading(true);
        
        // Update local state immediately
        setLocalAppointments(prevAppointments => 
            prevAppointments.map(app => 
                app._id === appointmentToPay._id ? 
                { ...app, payment: true } : 
                app
            )
        );
        
        // Simulated payment process (in a real app, integrate with actual payment gateway)
        setTimeout(() => {
            setPaymentLoading(false);
            toast.success(`Payment successful via ${method}!`);
            setShowPaymentModal(false);
            setAppointmentToPay(null);
            setPaymentMethod(null);
            getUserAppointments(); // Refresh from server
        }, 1500);
    };

    // Function to get available slots for rescheduling - using stylist's actual available slots
    const getAvailableSlots = async (stylistId) => {
        setIsRescheduling(true);
        
        try {
            // In a real implementation, this would fetch from your backend
            // Here we'll simulate it with some API-like behavior
            
            const response = await axios.get(
                backendUrl + `/api/user/stylist-slots/${stylistId}`, 
                { headers: { token } }
            ).catch(() => {
                // Fallback to demo data if API doesn't exist
                return { data: { success: true, slots: generateDemoSlots() } };
            });
            
            if (response.data.success) {
                setAvailableSlots(response.data.slots);
            } else {
                // Fallback to demo data
                setAvailableSlots(generateDemoSlots());
            }
            
        } catch (error) {
            console.log(error);
            toast.error("Failed to fetch available slots");
            // Fallback to demo data
            setAvailableSlots(generateDemoSlots());
        } finally {
            setIsRescheduling(false);
        }
    };
    
    // Generate demo slots for testing
    const generateDemoSlots = () => {
        const demoSlots = [];
        const today = new Date();
        
        // Create demo data for next 7 days
        for(let i=0; i<7; i++) {
            const currentDate = new Date();
            currentDate.setDate(today.getDate() + i);
            
            const day = currentDate.getDate();
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();
            
            const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // Create random times
            const times = [];
            for(let h = 9; h <= 18; h++) {
                // More available slots in the morning, fewer in the evening
                if(Math.random() > 0.3) times.push(`${h}:00 ${h < 12 ? 'AM' : 'PM'}`);
                if(Math.random() > 0.5) times.push(`${h}:30 ${h < 12 ? 'AM' : 'PM'}`);
            }
            
            demoSlots.push({
                date: formattedDate,
                times: times
            });
        }
        
        return demoSlots;
    };

    // Check if appointment can be rescheduled (at least 3 hours before)
    const checkRescheduleEligibility = (appointment) => {
        if (!appointment || appointment.cancelled || appointment.isCompleted) return false;
        if (appointment.hasRescheduled) return false; // Already used one-time reschedule
        
        // Parse the appointment date and time
        const appointmentDate = new Date(appointment.slotDateTime);
        
        // Current time
        const now = new Date();
        
        // Time difference in milliseconds
        const diffMs = appointmentDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);
        
        // Can reschedule if more than 3 hours before appointment
        return diffHours > 3;
    };

    // Open reschedule modal
    const openRescheduleModal = (appointment) => {
        const canReschedule = checkRescheduleEligibility(appointment);
        setCanReschedule(canReschedule);
        setHasUsedReschedule(appointment.hasRescheduled);
        
        setAppointmentToReschedule(appointment);
        if (canReschedule && !appointment.hasRescheduled) {
            getAvailableSlots(appointment.doctorId);
        }
        setRescheduleModal(true);
    };

    // Open cancel confirmation modal
    const openCancelModal = (appointment) => {
        setAppointmentToCancel(appointment);
        setCancelModal(true);
    };

    // Reschedule appointment function with local state update
    const rescheduleAppointment = async () => {
        if (!selectedDate || !selectedTime || !appointmentToReschedule) {
            toast.error("Please select both date and time");
            return;
        }

        setIsRescheduling(true);
        
        try {
            // Update local state immediately
            const updatedAppointment = {
                ...appointmentToReschedule,
                slotDate: selectedDate,
                slotTime: selectedTime
            };
            
            setLocalAppointments(prevAppointments => 
                prevAppointments.map(app => 
                    app._id === appointmentToReschedule._id ? 
                    updatedAppointment : 
                    app
                )
            );
            
            // In a real app, make an API call to reschedule
            // This is mocked for demonstration purposes
            
            setTimeout(() => {
                toast.success("Appointment rescheduled successfully!");
                setRescheduleModal(false);
                setSelectedDate('');
                setSelectedTime('');
                setAppointmentToReschedule(null);
                setActiveTab('upcoming'); // Switch to upcoming tab
                getUserAppointments(); // Refresh from server
            }, 1000);
        } catch (error) {
            console.log(error);
            toast.error("Failed to reschedule appointment");
            
            // Rollback local state if API fails
            setLocalAppointments(prevAppointments => [...prevAppointments]);
        } finally {
            setIsRescheduling(false);
        }
    };

    useEffect(() => {
        if (token) {
            getUserAppointments();
        } else {
            navigate('/login');
        }
    }, [token]);

    useEffect(() => {
        // Update local appointments when server data changes
        if (appointments.length > 0) {
            setLocalAppointments(appointments);
        }
    }, [appointments]);

    // Determine which data field to use (supporting both old and new structure)
    const getStylistData = (appointment) => {
        // Return stylist info for display purposes
        return {
            _id: appointment.doctorId,
            name: "Stylist",
            image: assets.defaultProfile,
            price: appointment.amount || 0,
            speciality: "Salon Service"
        };
    };
    
    // Filter appointments based on active tab
    const filteredAppointments = localAppointments.filter(appointment => {
        if (activeTab === 'upcoming') {
            return !appointment.cancelled && !appointment.isCompleted;
        } else if (activeTab === 'completed') {
            return appointment.isCompleted;
        } else if (activeTab === 'cancelled') {
            return appointment.cancelled;
        }
        return true;
    });

    return (
        <div className="bg-gray-50 min-h-screen pb-20 pt-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between mb-8">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="ml-1">Back</span>
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <Scissors size={24} className="text-primary" />
                        My Appointments
                    </h1>
                    <div className="w-[56px]"></div> {/* Empty div for flex centering */}
                </div>
                
                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm mb-6 p-1 border border-gray-200">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg ${
                                activeTab === 'upcoming'
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Upcoming
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg ${
                                activeTab === 'completed'
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Completed
                        </button>
                        <button
                            onClick={() => setActiveTab('cancelled')}
                            className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg ${
                                activeTab === 'cancelled'
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Cancelled
                        </button>
                    </div>
                </div>
                
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : localAppointments.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Scissors size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Appointments Yet</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                            You haven't booked any styling appointments. Schedule your first session with one of our expert stylists.
                        </p>
                        <button 
                            onClick={() => navigate('/stylists')} 
                            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                        >
                            Browse Stylists
                        </button>
                    </div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            {activeTab === 'upcoming' ? (
                                <Calendar size={24} className="text-gray-400" />
                            ) : activeTab === 'completed' ? (
                                <CheckCircle size={24} className="text-gray-400" />
                            ) : (
                                <X size={24} className="text-gray-400" />
                            )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-800 mb-2">
                            No {activeTab} appointments
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                            {activeTab === 'upcoming' 
                                ? "You don't have any upcoming appointments scheduled."
                                : activeTab === 'completed'
                                ? "You don't have any completed appointments yet."
                                : "You don't have any cancelled appointments."
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredAppointments.map((item, index) => {
                            const stylistData = getStylistData(item);
                            const isRescheduleEligible = checkRescheduleEligibility(item);
                            
                            return (
                                <motion.div 
                                    key={index} 
                                    className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <div className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row gap-6">
                                            {/* Stylist Image */}
                                            <div className="sm:w-1/4 lg:w-1/5">
                                                <div className="relative mx-auto sm:mx-0 w-32 sm:w-full max-w-[160px]">
                                                    <img 
                                                        className="aspect-square object-cover rounded-xl shadow-sm border border-gray-200" 
                                                        src={assets.defaultProfile}
                                                        alt="Stylist"
                                                    />
                                                    
                                                    {/* Status Badge */}
                                                    <div className="absolute -top-2 -right-2">
                                                        {item.cancelled ? (
                                                            <div className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">
                                                                Cancelled
                                                            </div>
                                                        ) : item.isCompleted ? (
                                                            <div className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">
                                                                Completed
                                                            </div>
                                                        ) : item.payment ? (
                                                            <div className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                                                                <BadgeCheck size={10} />
                                                                Confirmed
                                                            </div>
                                                        ) : (
                                                            <div className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">
                                                                Pending
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Appointment Details */}
                                            <div className="flex-1">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Stylist</h3>
                                                        <p className="text-primary text-sm font-medium">Salon Service</p>
                                                    </div>
                                                </div>
                                                
                                                {/* Divider */}
                                                <div className="border-b border-gray-100 mb-4"></div>
                                                
                                                {/* Appointment Info Cards */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="flex items-start gap-2">
                                                            <Calendar size={18} className="text-primary mt-0.5" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">Date</p>
                                                                <p className="font-medium text-gray-800">{slotDateFormat(item.slotDate)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="flex items-start gap-2">
                                                            <Clock size={18} className="text-primary mt-0.5" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">Time</p>
                                                                <p className="font-medium text-gray-800">{item.slotTime}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="bg-gray-50 p-3 rounded-lg">
                                                        <div className="flex items-start gap-2">
                                                            <Scissors size={18} className="text-primary mt-0.5" />
                                                            <div>
                                                                <p className="text-xs text-gray-500">Service</p>
                                                                <p className="font-medium text-gray-800">Hair Styling</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Price and Actions */}
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto pt-3 border-t border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-gray-800">{currencySymbol}{item.amount}</p>
                                                        
                                                        {/* Payment Badge */}
                                                        {item.payment ? (
                                                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                <Check size={12} />
                                                                Paid
                                                            </span>
                                                        ) : (
                                                            !item.cancelled && !item.isCompleted && (
                                                                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full">
                                                                    Payment Pending
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                    
                                                    {/* Action Buttons */}
                                                    <div className="flex flex-wrap gap-3">
                                                        {/* Payment Buttons */}
                                                        {!item.cancelled && !item.payment && !item.isCompleted && (
                                                            <button
                                                                onClick={() => openPaymentModal(item)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm"
                                                            >
                                                                <CreditCard size={16} />
                                                                Pay Now
                                                            </button>
                                                        )}
                                                        
                                                        {/* Reschedule Button */}
                                                        {!item.cancelled && item.payment && !item.isCompleted && isRescheduleEligible && (
                                                            <button
                                                                onClick={() => openRescheduleModal(item)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
                                                            >
                                                                <Calendar size={16} />
                                                                Reschedule
                                                            </button>
                                                        )}
                                                        
                                                        {/* Cancel Button */}
                                                        {!item.cancelled && !item.isCompleted && (
                                                            <button
                                                                onClick={() => openCancelModal(item)}
                                                                className="flex items-center gap-1.5 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors text-sm"
                                                            >
                                                                <X size={16} />
                                                                Cancel
                                                            </button>
                                                        )}
                                                        
                                                        {/* View Details Button for completed */}
                                                        {item.isCompleted && (
                                                            <button
                                                                className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                                            >
                                                                <ChevronsRight size={16} />
                                                                View Details
                                                            </button>
                                                        )}
                                                        
                                                        {/* Re-book Button for completed or cancelled */}
                                                        {(item.isCompleted || item.cancelled) && (
                                                            <button
                                                                onClick={() => navigate(`/appointment/${item.doctorId}`)}
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm"
                                                            >
                                                                <Calendar size={16} />
                                                                Book Again
                                                            </button>
                                                        )}
                                                        
                                                        
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Upcoming Appointment Reminder */}
                                        {!item.cancelled && !item.isCompleted && (
                                            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-2 text-sm">
                                                <AlertCircle size={16} className="text-blue-500" />
                                                <span className="text-blue-800">
                                                    {item.payment 
                                                        ? "Your appointment is confirmed. See you soon!" 
                                                        : "Please complete payment to confirm your appointment."}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Cannot Reschedule Warning */}
                                        {!item.cancelled && !item.isCompleted && !isRescheduleEligible && item.payment && (
                                            <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-3 flex items-center gap-2 text-xs">
                                                <AlertTriangle size={14} className="text-yellow-500" />
                                                <span className="text-yellow-800">
                                                    Appointments can only be rescheduled at least 3 hours before the scheduled time.
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
                
                {/* Payment Modal */}
                <AnimatePresence>
                    {showPaymentModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        >
                            <motion.div 
                                className="bg-white rounded-xl overflow-hidden max-w-md w-full shadow-xl"
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800">Complete Payment</h3>
                                        <button 
                                            onClick={() => {
                                                setShowPaymentModal(false);
                                                setAppointmentToPay(null);
                                                setPaymentMethod(null);
                                            }} 
                                            className="text-gray-400 hover:text-gray-500"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                    
                                    {appointmentToPay && (
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-gray-500">Appointment Date</span>
                                                    <span className="font-medium">{slotDateFormat(appointmentToPay.slotDate)}</span>
                                                </div>
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-gray-500">Time</span>
                                                    <span className="font-medium">{appointmentToPay.slotTime}</span>
                                                </div>
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-gray-500">Amount</span>
                                                    <span className="font-bold text-primary">{currencySymbol}{appointmentToPay.amount}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <p className="text-gray-700 text-sm">Select payment method:</p>
                                                
                                                <button
                                                    onClick={() => processPayment('card')}
                                                    disabled={paymentLoading}
                                                    className="w-full flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <CreditCard className="text-blue-500" size={20} />
                                                        <span className="font-medium">Credit/Debit Card</span>
                                                    </div>
                                                    {paymentMethod === 'card' && paymentLoading && (
                                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    )}
                                                </button>
                                                
                                                <button
                                                    onClick={() => processPayment('upi')}
                                                    disabled={paymentLoading}
                                                    className="w-full flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <img src={assets.upi_icon || "/upi-icon.svg"} alt="UPI" className="w-5 h-5" />
                                                        <span className="font-medium">UPI Payment</span>
                                                    </div>
                                                    {paymentMethod === 'upi' && paymentLoading && (
                                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Reschedule Modal */}
               <AnimatePresence>
    {rescheduleModal && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
            <motion.div 
                className="bg-white rounded-xl overflow-hidden max-w-lg w-full shadow-xl"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
            >
                <div className="flex justify-between items-center border-b border-gray-200 p-4">
                    <h3 className="text-lg font-semibold text-gray-800">Reschedule Appointment</h3>
                    <button 
                        onClick={() => {
                            setRescheduleModal(false);
                            setAppointmentToReschedule(null);
                            setSelectedDate('');
                            setSelectedTime('');
                        }} 
                        className="text-gray-400 hover:text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6">
                    {!canReschedule ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                            <AlertTriangle size={40} className="text-yellow-500 mx-auto mb-2" />
                            <p className="text-yellow-800 font-medium mb-1">Unable to Reschedule</p>
                            <p className="text-yellow-700 text-sm">
                                Appointments can only be rescheduled at least 3 hours before the scheduled time.
                            </p>
                        </div>
                    ) : hasUsedReschedule ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                            <AlertTriangle size={40} className="text-yellow-500 mx-auto mb-2" />
                            <p className="text-yellow-800 font-medium mb-1">Rescheduling Limit Reached</p>
                            <p className="text-yellow-700 text-sm">
                                You have already used your one-time reschedule for this appointment.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Current appointment details */}
                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <h4 className="font-medium text-gray-800 mb-3">Current Appointment</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-gray-500">Date</p>
                                        <p className="font-medium">{slotDateFormat(appointmentToReschedule?.slotDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Time</p>
                                        <p className="font-medium">{appointmentToReschedule?.slotTime}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Date selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select New Date</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-lg p-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                                    onChange={(e) => {
                                        setSelectedDate(e.target.value);
                                        setSelectedTime('');
                                        
                                        // Get available slots for this date if we have a selected date
                                        if (e.target.value) {
                                            const selectedSlot = availableSlots.find(
                                                slot => slot.date === e.target.value
                                            );
                                            
                                            if (!selectedSlot || selectedSlot.times.length === 0) {
                                                toast.info("No available slots for this date");
                                            }
                                        }
                                    }}
                                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                                />
                            </div>
                            
                            {/* Time selection */}
                            {selectedDate && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select New Time</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {isRescheduling ? (
                                            <div className="col-span-3 py-8 text-center">
                                                <div className="inline-block animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                                            </div>
                                        ) : (
                                            <>
                                                {availableSlots.find(slot => slot.date === selectedDate)?.times.map((time, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setSelectedTime(time)}
                                                        className={`p-2 text-sm rounded-md transition-colors ${
                                                            selectedTime === time 
                                                                ? 'bg-primary text-white' 
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                                
                                                {(!availableSlots.find(slot => slot.date === selectedDate) ||
                                                    availableSlots.find(slot => slot.date === selectedDate)?.times.length === 0) && (
                                                    <div className="col-span-3 p-4 text-center text-gray-500">
                                                        No available slots for this date
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* Note about rescheduling */}
                            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex items-start gap-2">
                                <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                <p>You can reschedule your appointment only once. Please make sure the new time works for you.</p>
                            </div>
                            
                            {/* Action buttons */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRescheduleModal(false);
                                        setAppointmentToReschedule(null);
                                        setSelectedDate('');
                                        setSelectedTime('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={rescheduleAppointment}
                                    disabled={!selectedDate || !selectedTime || isRescheduling}
                                    className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                                        !selectedDate || !selectedTime || isRescheduling
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                            : 'bg-primary text-white hover:bg-primary/90'
                                    }`}
                                >
                                    {isRescheduling ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Calendar size={18} />
                                            Reschedule
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )}
</AnimatePresence>

                
                {/* Cancel Confirmation Modal */}
                <AnimatePresence>
                    {cancelModal && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        >
                            <motion.div 
                                className="bg-white rounded-xl overflow-hidden max-w-md w-full shadow-xl"
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                            >
                                <div className="p-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                                            <AlertTriangle size={32} className="text-red-500" />
                                        </div>
                                        
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">Cancel Appointment?</h3>
                                        <p className="text-gray-600 mb-6">
                                            Are you sure you want to cancel your appointment on{' '}
                                            <span className="font-medium">{slotDateFormat(appointmentToCancel?.slotDate)}</span> at{' '}
                                            <span className="font-medium">{appointmentToCancel?.slotTime}</span>?
                                        </p>
                                        
                                        <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-6 text-sm text-yellow-800 text-left">
                                            <p className="flex items-start gap-2">
                                                <Info size={16} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                                                {appointmentToCancel?.payment 
                                                    ? "Cancellations may be subject to our refund policy. Please check your email for confirmation and refund details."
                                                    : "You can cancel unpaid appointments without any charge."
                                                }
                                            </p>
                                        </div>
                                        
                                        <div className="flex justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCancelModal(false);
                                                    setAppointmentToCancel(null);
                                                }}
                                                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                            >
                                                No, Keep It
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelAppointment}
                                                className="px-5 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                                            >
                                                Yes, Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {/* Success Message Toast */}
                {successMessage && (
                    <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm flex items-center gap-2">
                        <CheckCircle size={20} />
                        <p>{successMessage}</p>
                    </div>
                )}
                
                {/* Back to Top Button */}
                <button 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-24 md:bottom-6 right-6 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                >
                    <ChevronsUp size={20} />
                </button>
            </div>
        </div>
    );
};

export default MyAppointments;
