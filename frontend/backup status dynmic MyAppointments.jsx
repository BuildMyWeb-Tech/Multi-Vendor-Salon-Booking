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

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Function to format the date eg. ( 20_01_2000 => 20 Jan 2000 )
    const slotDateFormat = (slotDate) => {
        const dateArray = slotDate.split('_');
        return dateArray[0] + " " + months[Number(dateArray[1]) - 1] + " " + dateArray[2];
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
            
            const formattedDate = `${day}_${month}_${year}`;
            
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
        const dateArray = appointment.slotDate.split('_');
        const timeArray = appointment.slotTime.split(':');
        const timeStr = appointment.slotTime.toLowerCase();
        const isPM = timeStr.includes('pm');
        let hour = parseInt(timeArray[0]);
        if (isPM && hour < 12) hour += 12;
        if (!isPM && hour === 12) hour = 0;
        
        const minute = parseInt(timeArray[1].split(' ')[0]);
        
        const appointmentDate = new Date(
            parseInt(dateArray[2]),
            parseInt(dateArray[1]) - 1,
            parseInt(dateArray[0]),
            hour,
            minute
        );
        
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
            getAvailableSlots(appointment.stylistData?._id || appointment.docData?._id);
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
        return appointment.stylistData || appointment.docData;
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
                ) : appointments.length === 0 ? (
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
                                                        src={stylistData.image} 
                                                        alt={stylistData.name} 
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
                                                    
                                                    {/* Rating Prompt for completed appointments */}
                                                    {item.isCompleted && !item.userRated && (
                                                        <div className="absolute -bottom-2 right-0 transform translate-x-1/2">
                                                            <button 
                                                                className="bg-white rounded-full p-1 shadow-lg hover:bg-yellow-50 transition-colors group" 
                                                                title="Rate your experience"
                                                            >
                                                                <Star size={18} className="text-yellow-400 group-hover:fill-yellow-400" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Stylist Rating */}
                                                <div className="hidden sm:flex items-center justify-center gap-1 mt-2">
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map((_, i) => (
                                                            <Star 
                                                                key={i}
                                                                size={12} 
                                                                fill={i < (stylistData.rating || 4) ? "#FFC107" : "#E5E7EB"} 
                                                                stroke="none"
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-gray-500">{stylistData.reviewCount || 124}</span>
                                                </div>
                                            </div>
                                            
                                            {/* Appointment Details */}
                                            <div className="flex-1">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{stylistData.name}</h3>
                                                        <p className="text-primary text-sm font-medium">{stylistData.speciality}</p>
                                                    </div>
                                                    
                                                    {/* Mobile rating */}
                                                    <div className="flex sm:hidden items-center gap-1">
                                                        <div className="flex">
                                                            {[1, 2, 3, 4, 5].map((_, i) => (
                                                                <Star 
                                                                    key={i}
                                                                    size={12} 
                                                                    fill={i < (stylistData.rating || 4) ? "#FFC107" : "#E5E7EB"}
                                                                    stroke="none"
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-xs text-gray-500">{stylistData.reviewCount || 124}</span>
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
                                                                <p className="font-medium text-gray-800">{item.service || 'Hair Styling'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Location */}
                                                {stylistData.address && (
                                                    <div className="flex items-start gap-2 mb-5 text-sm text-gray-600">
                                                        <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                        <span>
                                                            {stylistData.address.line1}, {stylistData.address.line2}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {/* Reschedule Status */}
                                                {item.hasRescheduled && !item.cancelled && !item.isCompleted && (
                                                    <div className="mb-4 p-2 bg-blue-50 border border-blue-100 rounded-md text-xs text-blue-800 flex items-center gap-1.5">
                                                        <Info size={14} className="text-blue-500" />
                                                        This appointment has already been rescheduled once.
                                                    </div>
                                                )}
                                                
                                                {/* Price and Actions */}
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto pt-3 border-t border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-gray-800">{currencySymbol}{item.amount || (stylistData.price || stylistData.fees)}</p>
                                                        
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
                                                        {/* Reschedule Button - only if not already rescheduled and if within time window */}
                                                        {!item.cancelled && !item.isCompleted && item.payment && isRescheduleEligible && !item.hasRescheduled && (
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
                                                                onClick={() => navigate(`/appointment/${stylistData._id}`)}
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
                                                    {item.hasRescheduled 
                                                        ? "Each appointment can only be rescheduled once."
                                                        : "Appointments can only be rescheduled at least 3 hours before the scheduled time."}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
                
                {/* Reschedule Modal */}
                {rescheduleModal && appointmentToReschedule && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full overflow-hidden">
                            {/* Header */}
                            <div className="bg-primary/5 p-4 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-800 text-lg">Reschedule Appointment</h3>
                                    <button 
                                        onClick={() => {
                                            setRescheduleModal(false);
                                            setAppointmentToReschedule(null);
                                            setSelectedDate('');
                                            setSelectedTime('');
                                            setSuccessMessage('');
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-6">
                                {successMessage ? (
                                    <div className="text-center py-8">
                                        <div className="bg-green-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle size={28} className="text-green-500" />
                                        </div>
                                        <h4 className="text-lg font-medium text-gray-800 mb-2">Rescheduled Successfully!</h4>
                                        <p className="text-gray-600 max-w-md mx-auto mb-4">
                                            {successMessage}
                                        </p>
                                    </div>
                                ) : !canReschedule ? (
                                    <div className="text-center py-8">
                                        <div className="bg-yellow-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                                            <AlertTriangle size={28} className="text-yellow-500" />
                                        </div>
                                        <h4 className="text-lg font-medium text-gray-800 mb-2">Cannot Reschedule</h4>
                                        <p className="text-gray-600 max-w-md mx-auto">
                                            {hasUsedReschedule 
                                                ? "You can only reschedule an appointment once. This appointment has already been rescheduled."
                                                : "Appointments can only be rescheduled at least 3 hours before the scheduled time."}
                                        </p>
                                        <button
                                            onClick={() => {
                                                setRescheduleModal(false);
                                                setAppointmentToReschedule(null);
                                            }}
                                            className="mt-6 px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                        >
                                            Close
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Current Appointment Info */}
                                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Current Appointment</p>
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={getStylistData(appointmentToReschedule).image} 
                                                    alt={getStylistData(appointmentToReschedule).name} 
                                                    className="w-12 h-12 rounded-full object-cover"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800">{getStylistData(appointmentToReschedule).name}</p>
                                                    <p className="text-sm text-gray-600">{appointmentToReschedule.service || 'Hair Styling'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-800">{slotDateFormat(appointmentToReschedule.slotDate)}</p>
                                                    <p className="text-sm text-gray-600">{appointmentToReschedule.slotTime}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* One-time Reschedule Warning */}
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800 flex items-start gap-2">
                                            <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium">One-time Reschedule Policy:</p>
                                                <p className="mt-1">
                                                    You can only reschedule an appointment once. After rescheduling, you won't be able to change the appointment time again.
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <h4 className="font-medium text-gray-800 mb-4">Select New Date & Time</h4>
                                        
                                        {isRescheduling ? (
                                            <div className="flex justify-center items-center py-12">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Date Selection */}
                                                <div className="mb-6">
                                                    <label className="block text-sm text-gray-600 mb-2">Select Date</label>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                        {availableSlots.map((slot, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => {
                                                                    setSelectedDate(slot.date);
                                                                    setSelectedTime('');
                                                                }}
                                                                className={`p-3 border rounded-lg text-center transition-all ${
                                                                    selectedDate === slot.date 
                                                                        ? 'border-primary bg-primary/5' 
                                                                        : 'border-gray-200 hover:border-primary/30'
                                                                }`}
                                                            >
                                                                <p className="text-sm font-medium">
                                                                    {slotDateFormat(slot.date)}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {slot.times.length} available slots
                                                                </p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                {/* Time Selection */}
                                                {selectedDate && (
                                                    <div className="mb-6">
                                                        <label className="block text-sm text-gray-600 mb-2">Select Time</label>
                                                                                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                                            {availableSlots
                                                                .find(slot => slot.date === selectedDate)?.times
                                                                .map((time, index) => (
                                                                    <button
                                                                        key={index}
                                                                        onClick={() => setSelectedTime(time)}
                                                                        className={`py-2 px-3 text-sm border rounded-md text-center transition-all ${
                                                                            selectedTime === time 
                                                                                ? 'border-primary bg-primary text-white' 
                                                                                : 'border-gray-200 hover:border-primary/30'
                                                                        }`}
                                                                    >
                                                                        {time}
                                                                    </button>
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Note about rescheduling */}
                                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-800 flex items-start gap-2">
                                                    <Sparkles size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                                    <p>
                                                        You can reschedule your appointment once without any additional charges.
                                                        Please make sure your new appointment time works for you, as you won't be 
                                                        able to reschedule it again.
                                                    </p>
                                                </div>
                                                
                                                {/* Action Buttons */}
                                                <div className="flex gap-3 justify-end">
                                                    <button
                                                        onClick={() => {
                                                            setRescheduleModal(false);
                                                            setAppointmentToReschedule(null);
                                                            setSelectedDate('');
                                                            setSelectedTime('');
                                                        }}
                                                        className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                                        disabled={isRescheduling}
                                                    >
                                                        Cancel
                                                    </button>
                                                    
                                                    <button
                                                        onClick={rescheduleAppointment}
                                                        disabled={!selectedDate || !selectedTime || isRescheduling}
                                                        className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                                    >
                                                        {isRescheduling ? (
                                                            <>
                                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                <span>Rescheduling...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Calendar size={18} />
                                                                <span>Confirm Reschedule</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Cancellation Modal */}
                {cancelModal && appointmentToCancel && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
                            {/* Header */}
                            <div className="bg-red-50 p-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-800 text-lg">Cancel Appointment</h3>
                                    <button 
                                        onClick={() => {
                                            setCancelModal(false);
                                            setAppointmentToCancel(null);
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-6">
                                <div className="text-center">
                                    <div className="bg-red-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                                        <AlertTriangle size={28} className="text-red-500" />
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-800 mb-2">Are you sure you want to cancel?</h4>
                                    <p className="text-gray-600 mb-6">
                                        This will cancel your appointment with {getStylistData(appointmentToCancel).name} on {slotDateFormat(appointmentToCancel.slotDate)} at {appointmentToCancel.slotTime}.
                                    </p>
                                    
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800 text-left">
                                        <p className="font-medium mb-1">Cancellation Policy:</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Free cancellation up to 24 hours before your appointment.</li>
                                            <li>Cancellations within 24 hours may be subject to a fee.</li>
                                            <li>No-shows will be charged the full amount.</li>
                                        </ul>
                                    </div>
                                    
                                    <div className="flex gap-3 justify-center">
                                        <button
                                            onClick={() => {
                                                setCancelModal(false);
                                                setAppointmentToCancel(null);
                                            }}
                                            className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Keep Appointment
                                        </button>
                                        
                                        <button
                                            onClick={cancelAppointment}
                                            className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                        >
                                            Yes, Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
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
