// frontend/src/pages/MyAppointments.jsx
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
  Scissors,
  X,
  ChevronLeft,
  Check,
  CheckCircle,
  AlertCircle,
  BadgeCheck,
  ChevronsUp,
  Info,
  AlertTriangle,
  Calendar as CalendarIcon,
  User,
  MapPin,
  Phone,
  ArrowRight,
  CalendarCheck,
  CalendarX,
  RefreshCw,
  Sparkles,
  IndianRupee,
} from 'lucide-react';

// ─── 12hr format helper ──────────────────────────────────────────────────────
const to12Hr = (time24) => {
  if (!time24) return '';
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};
// ─────────────────────────────────────────────────────────────────────────────

const MyAppointments = () => {
  const { backendUrl, token, currencySymbol = '₹' } = useContext(AppContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);
  const [canReschedule, setCanReschedule] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [localAppointments, setLocalAppointments] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const slotDateFormat = (slotDate) => {
    if (!slotDate) return '';
    const dateObj = new Date(slotDate);
    const day = dateObj.getDate();
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    return `${day} ${months[month]} ${year}`;
  };

  const getUserAppointments = async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(backendUrl + '/api/user/appointments', {
        headers: { token },
      });
      setAppointments(data.appointments.reverse());
      setLocalAppointments(data.appointments.reverse());
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelAppointment = async () => {
    if (!appointmentToCancel) return;

    try {
      setLocalAppointments((prev) =>
        prev.map((app) =>
          app._id === appointmentToCancel._id
            ? { ...app, cancelled: true, cancelledBy: 'user' }
            : app
        )
      );
      setActiveTab('cancelled');

      const { data } = await axios.post(
        backendUrl + '/api/user/cancel-appointment',
        { appointmentId: appointmentToCancel._id },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        setCancelModal(false);
        setAppointmentToCancel(null);
        getUserAppointments();
      } else {
        toast.error(data.message);
        setLocalAppointments((prev) =>
          prev.map((app) =>
            app._id === appointmentToCancel._id
              ? { ...app, cancelled: false, cancelledBy: null }
              : app
          )
        );
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
      setLocalAppointments((prev) =>
        prev.map((app) =>
          app._id === appointmentToCancel._id
            ? { ...app, cancelled: false, cancelledBy: null }
            : app
        )
      );
    }
  };

  const getAvailableSlots = async (stylistId, appointmentDate) => {
    setIsRescheduling(true);
    try {
      const response = await axios.get(backendUrl + `/api/user/available-slots`, {
        params: { date: appointmentDate, docId: stylistId },
        headers: { token },
      });

      if (response.data.success) {
        const now = new Date();
        const selDate = new Date(appointmentDate);
        const isToday = selDate.toDateString() === now.toDateString();
        let slots = response.data.slots || [];

        if (isToday) {
          const currentTime = now.getHours() * 60 + now.getMinutes();
          slots = slots.filter((slot) => {
            const [hours, minutes] = slot.startTime.split(':').map(Number);
            return hours * 60 + minutes > currentTime;
          });
        }

        setAvailableSlots(slots);
        if (slots.length === 0) {
          toast.info('No available slots for this date. Please select another date.');
        }
      } else {
        toast.error(response.data.message);
        setAvailableSlots([]);
      }
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch available slots');
      setAvailableSlots([]);
    } finally {
      setIsRescheduling(false);
    }
  };

  const checkRescheduleEligibility = (appointment) => {
    if (!appointment || appointment.isCompleted) return false;
    const appointmentDateTime = new Date(appointment.slotDateTime);
    const diffHours = (appointmentDateTime - new Date()) / (1000 * 60 * 60);
    return diffHours > 3;
  };

  const checkCancellationEligibility = (appointment) => {
    if (!appointment || appointment.cancelled || appointment.isCompleted) return false;
    const appointmentDateTime = new Date(appointment.slotDateTime);
    const diffHours = (appointmentDateTime - new Date()) / (1000 * 60 * 60);
    return diffHours > 3;
  };

  const openRescheduleModal = (appointment) => {
    const eligible = appointment.cancelled || checkRescheduleEligibility(appointment);
    setCanReschedule(eligible);
    setAppointmentToReschedule(appointment);

    if (eligible) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCurrentMonth(tomorrow);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      setSelectedDate(tomorrowStr);
      setSelectedCalendarDate(tomorrow);
      getAvailableSlots(appointment.doctorId, tomorrowStr);
    }
    setRescheduleModal(true);
  };

  const openCancelModal = (appointment) => {
    setAppointmentToCancel(appointment);
    setCancelModal(true);
  };

  const rescheduleAppointment = async () => {
    if (!selectedDate || !selectedTime || !appointmentToReschedule) {
      toast.error('Please select both date and time');
      return;
    }

    setIsRescheduling(true);
    try {
      const { data } = await axios.post(
        backendUrl + '/api/user/reschedule-appointment',
        {
          userId: appointmentToReschedule.userId,
          appointmentId: appointmentToReschedule._id,
          slotDate: selectedDate,
          slotTime: selectedTime,
          oldSlotDate: appointmentToReschedule.slotDate,
          oldSlotTime: appointmentToReschedule.slotTime,
        },
        { headers: { token } }
      );

      if (data.success) {
        toast.success('Appointment rescheduled successfully!');
        setRescheduleModal(false);
        setSelectedDate('');
        setSelectedTime('');
        setAppointmentToReschedule(null);
        setSelectedCalendarDate(null);
        setActiveTab('upcoming');
        getUserAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment');
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
    if (appointments.length > 0) {
      setLocalAppointments(appointments);
    }
  }, [appointments]);

  const filteredAppointments = localAppointments.filter((appointment) => {
    if (activeTab === 'upcoming') return !appointment.cancelled && !appointment.isCompleted;
    if (activeTab === 'completed') return appointment.isCompleted && !appointment.cancelled;
    if (activeTab === 'cancelled') return appointment.cancelled;
    return true;
  });

  const upcomingCount = localAppointments.filter(
    (app) => !app.cancelled && !app.isCompleted
  ).length;
  const completedCount = localAppointments.filter(
    (app) => app.isCompleted && !app.cancelled
  ).length;
  const cancelledCount = localAppointments.filter((app) => app.cancelled).length;

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay(),
      year,
      month,
    };
  };

  const handleDateClick = (day) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const clickedDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (clickedDate < today) return;

    setSelectedCalendarDate(clickedDate);
    const dateStr = clickedDate.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setSelectedTime('');

    if (appointmentToReschedule) {
      getAvailableSlots(appointmentToReschedule.doctorId, dateStr);
    }
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const isDateDisabled = (day) => {
    const { year, month } = getDaysInMonth(currentMonth);
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (day) => {
    if (!selectedCalendarDate) return false;
    const { year, month } = getDaysInMonth(currentMonth);
    return (
      selectedCalendarDate.getDate() === day &&
      selectedCalendarDate.getMonth() === month &&
      selectedCalendarDate.getFullYear() === year
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 pt-6 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent h-64 pointer-events-none" />

      <div className="max-w-5xl mx-auto relative">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-gray-600 hover:text-primary transition-colors bg-white p-2 rounded-lg shadow-sm"
          >
            <ChevronLeft size={20} />
            <span className="font-medium hidden sm:inline">Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2">
            My Appointments
          </h1>
          <div className="w-[40px] sm:w-[56px]"></div>
        </div>

        {/* ── Tab Bar ── */}
        <div
          className={`sticky top-[60px] z-10 transition-all duration-300 ${
            scrolled ? 'py-2 bg-white/95 backdrop-blur-sm shadow-md' : 'py-1 bg-transparent'
          } rounded-xl mb-6`}
        >
          <div
            className={`bg-white rounded-xl shadow-sm border border-gray-200 ${scrolled ? 'mx-4' : ''}`}
          >
            <div className="flex">
              {[
                { id: 'upcoming', icon: <CalendarCheck size={18} />, label: 'Upcoming', count: upcomingCount },
                { id: 'completed', icon: <CheckCircle size={18} />, label: 'Completed', count: completedCount },
                { id: 'cancelled', icon: <CalendarX size={18} />, label: 'Cancelled', count: cancelledCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg transition-all relative ${
                    activeTab === tab.id
                      ? 'bg-primary text-white shadow-inner'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </div>
                  {tab.count > 0 && (
                    <span
                      className={`absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                        activeTab === tab.id ? 'bg-white text-primary' : 'bg-primary text-white'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-500">Loading appointments...</p>
          </div>
        ) : localAppointments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Scissors size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Appointments Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              You haven't booked any styling appointments. Schedule your first session with one of
              our expert stylists.
            </p>
            <button
              onClick={() => navigate('/stylists')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 mx-auto"
            >
              <Scissors size={18} />
              <span>Browse Stylists</span>
            </button>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              {activeTab === 'upcoming' ? (
                <CalendarCheck size={30} className="text-gray-400" />
              ) : activeTab === 'completed' ? (
                <CheckCircle size={30} className="text-gray-400" />
              ) : (
                <CalendarX size={30} className="text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No {activeTab} appointments</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              {activeTab === 'upcoming'
                ? "You don't have any upcoming appointments scheduled."
                : activeTab === 'completed'
                  ? "You don't have any completed appointments yet."
                  : "You don't have any cancelled appointments."}
            </p>
            {activeTab === 'upcoming' && (
              <button
                onClick={() => navigate('/stylists')}
                className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 mx-auto"
              >
                <Calendar size={16} />
                <span>Book an Appointment</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredAppointments.map((item, index) => {
              const isRescheduleEligible = item.cancelled || checkRescheduleEligibility(item);
              const isCancellable = checkCancellationEligibility(item);

              const now = new Date();
              const appointmentDate = new Date(item.slotDateTime);
              const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60);
              const isComingSoon = hoursUntilAppointment > 0 && hoursUntilAppointment < 24;

              const totalAmount = item.amount || 0;
              const paidAmount = item.paidAmount || 0;
              const remainingAmount = item.remainingAmount || 0;
              const hasPartialPayment = paidAmount > 0 && remainingAmount > 0;

              // ✅ FIX S06-004: rescheduled flag
              const isRescheduled = item.rescheduled === true && !item.cancelled && !item.isCompleted;

              return (
                <motion.div
                  key={item._id || index}
                  className={`bg-white rounded-xl shadow-sm overflow-hidden border transition-all ${
                    isComingSoon && activeTab === 'upcoming'
                      ? 'border-primary/50'
                      : isRescheduled
                        ? 'border-purple-300'
                        : 'border-gray-100'
                  } hover:shadow-md`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  {isComingSoon && activeTab === 'upcoming' && (
                    <div className="bg-primary/10 border-b border-primary/20 py-2 px-4 text-xs font-medium text-primary flex items-center justify-center gap-1">
                      <Clock size={14} />
                      <span>Coming Soon — Your appointment is within 24 hours</span>
                    </div>
                  )}

                  {/* ✅ FIX S06-004: Rescheduled top banner */}
                  {isRescheduled && (
                    <div className="bg-purple-50 border-b border-purple-200 py-2 px-4 text-xs font-medium text-purple-700 flex items-center justify-center gap-1.5">
                      <RefreshCw size={13} />
                      <span>Rescheduled — showing your updated date &amp; time below</span>
                    </div>
                  )}

                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-6">

                      {/* ── Stylist Image + Status Badge ── */}
                      <div className="sm:w-1/4 lg:w-1/5">
                        <div className="relative mx-auto sm:mx-0 w-32 sm:w-full max-w-[160px] group">
                          <div className="rounded-xl overflow-hidden shadow-sm border-2 border-gray-100 aspect-square">
                            <img
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              src={item.docData?.image || assets.defaultProfile}
                              alt={item.docData?.name || 'Stylist'}
                            />
                          </div>

                          <div className="absolute -top-2 -right-2">
                            {item.cancelled && item.cancelledBy === 'system' ? (
                              <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full shadow-sm whitespace-nowrap flex items-center gap-1">
                                <X size={12} />
                                Stylist on Leave
                              </div>
                            ) : item.cancelled && item.cancelledBy === 'admin' ? (
                              <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-sm whitespace-nowrap flex items-center gap-1">
                                <X size={12} />
                                Cancelled by Admin
                              </div>
                            ) : item.cancelled && item.cancelledBy === 'user' ? (
                              <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full shadow-sm whitespace-nowrap flex items-center gap-1">
                                <X size={12} />
                                Cancelled by You
                              </div>
                            ) : item.isCompleted ? (
                              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                <Check size={12} />
                                Completed
                              </div>
                            ) : isRescheduled ? (
                              // ✅ FIX S06-004: Purple "Rescheduled" status badge
                              <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                <RefreshCw size={12} />
                                Rescheduled
                              </div>
                            ) : item.payment ? (
                              <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                <BadgeCheck size={12} />
                                Confirmed
                              </div>
                            ) : (
                              <div className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                <Clock size={12} />
                                Pending
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── Appointment Details ── */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                              {item.docData?.name || 'Stylist'}
                              {activeTab === 'upcoming' && isComingSoon && (
                                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                                  <Clock size={10} />
                                  Soon
                                </span>
                              )}
                              {/* ✅ FIX S06-004: inline "Rescheduled" chip next to name */}
                              {isRescheduled && (
                                <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                                  <RefreshCw size={10} />
                                  Rescheduled
                                </span>
                              )}
                            </h3>
                          </div>
                        </div>

                        <div className="border-b border-gray-100 mb-4 mt-2"></div>

                        {/* ✅ FIX S06-004: Rescheduled info banner inside card */}
                        {isRescheduled && (
                          <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5 flex items-start gap-2 text-sm text-purple-800 animate-slideDown">
                            <RefreshCw size={15} className="text-purple-500 mt-0.5 flex-shrink-0" />
                            <span>
                              This appointment was rescheduled. The date &amp; time shown below reflect
                              your <strong>new</strong> booking.
                            </span>
                          </div>
                        )}

                        {/* Date / Time / Service Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                          <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors group">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                                <CalendarIcon size={18} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-medium">Date</p>
                                <p className="font-medium text-gray-800">
                                  {slotDateFormat(item.slotDate)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors group">
                            <div className="flex gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                                <Clock size={18} />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-medium">Time</p>
                                <p className="font-medium text-gray-800">{to12Hr(item.slotTime)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors group">
                            <div className="flex gap-3 items-start">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                                <Scissors size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs text-gray-500 uppercase font-medium">Service</p>
                                <p className="font-medium text-gray-800 leading-snug break-words">
                                  {item.service || 'Hair Styling'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Payment Information */}
                        <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className="font-semibold text-gray-800">Payment Details</h4>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Amount:</span>
                              <span className="font-bold text-gray-900">
                                {currencySymbol}{totalAmount}
                              </span>
                            </div>

                            {hasPartialPayment && (
                              <>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Paid Amount:</span>
                                  <span className="font-semibold text-green-600">
                                    {currencySymbol}{paidAmount}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Remaining (Pay at Salon):</span>
                                  <span className="font-semibold text-orange-600">
                                    {currencySymbol}{remainingAmount}
                                  </span>
                                </div>
                              </>
                            )}

                            {item.payment && (
                              <div className="mt-2 pt-2 border-t border-blue-200">
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                  <Check size={12} />
                                  {hasPartialPayment ? 'Advance payment completed' : 'Payment completed'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-auto pt-3 border-t border-gray-100">
                          <div className="flex flex-wrap gap-3">
                            {item.cancelled && item.payment && (
                              <button
                                onClick={() => openRescheduleModal(item)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
                              >
                                <RefreshCw size={16} />
                                Reschedule
                              </button>
                            )}

                            {!item.cancelled && !item.isCompleted && isRescheduleEligible && (
                              <button
                                onClick={() => openRescheduleModal(item)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
                              >
                                <RefreshCw size={16} />
                                Reschedule
                              </button>
                            )}

                            {!item.cancelled && !item.isCompleted && isCancellable && (
                              <button
                                onClick={() => openCancelModal(item)}
                                className="flex items-center gap-1.5 px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors text-sm"
                              >
                                <X size={16} />
                                Cancel
                              </button>
                            )}

                            {(item.isCompleted || (item.cancelled && !item.payment)) && (
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

                    {/* Cancellation reason banner */}
                    {item.cancelled && item.cancelledBy && (
                      <div
                        className={`mt-4 border rounded-lg p-3 flex items-start gap-2 text-sm animate-slideDown ${
                          item.cancelledBy === 'system'
                            ? 'bg-orange-50 border-orange-100'
                            : 'bg-red-50 border-red-100'
                        }`}
                      >
                        <AlertCircle
                          size={18}
                          className={`mt-0.5 flex-shrink-0 ${
                            item.cancelledBy === 'system' ? 'text-orange-500' : 'text-red-500'
                          }`}
                        />
                        <span
                          className={
                            item.cancelledBy === 'system' ? 'text-orange-800' : 'text-red-800'
                          }
                        >
                          {item.cancellationReason
                            ? item.cancellationReason
                            : item.cancelledBy === 'admin'
                              ? 'Cancelled by Admin — You can reschedule to a new time slot'
                              : 'Cancelled by You — You may reschedule if payment was made'}
                        </span>
                      </div>
                    )}

                    {!item.cancelled && !item.isCompleted && !isCancellable && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-lg p-3 flex items-center gap-2 text-sm animate-slideDown">
                        <AlertTriangle size={16} className="text-yellow-500" />
                        <span className="text-yellow-800">
                          Appointments can only be cancelled at least 3 hours before the scheduled time.
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Reschedule Modal ── */}
        <AnimatePresence>
          {rescheduleModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            >
              <motion.div
                className="bg-white rounded-xl overflow-hidden max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, y: -50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: -50 }}
              >
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 flex justify-between items-center p-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <RefreshCw size={18} className="text-primary" />
                    Reschedule Appointment
                  </h3>
                  <button
                    onClick={() => {
                      setRescheduleModal(false);
                      setAppointmentToReschedule(null);
                      setSelectedDate('');
                      setSelectedTime('');
                      setSelectedCalendarDate(null);
                    }}
                    className="text-gray-400 hover:text-gray-500 bg-white p-1 rounded-full"
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
                  ) : (
                    <div className="space-y-4">
                      {/* Current appointment summary */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                          <User size={16} className="text-primary" />
                          Current Appointment
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-gray-400" />
                            <div>
                              <p className="text-gray-500">Date</p>
                              <p className="font-medium">
                                {slotDateFormat(appointmentToReschedule?.slotDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-gray-400" />
                            <div>
                              <p className="text-gray-500">Time</p>
                              <p className="font-medium">
                                {to12Hr(appointmentToReschedule?.slotTime)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Calendar */}
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Select New Date
                        </label>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-4">
                            <button
                              type="button"
                              onClick={() => navigateMonth(-1)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <ChevronLeft size={20} className="text-gray-600" />
                            </button>
                            <h3 className="text-base font-semibold text-gray-800">
                              {currentMonth.toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric',
                              })}
                            </h3>
                            <button
                              type="button"
                              onClick={() => navigateMonth(1)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <ChevronLeft size={20} className="text-gray-600 rotate-180" />
                            </button>
                          </div>

                          <div className="grid grid-cols-7 gap-1">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                                {day}
                              </div>
                            ))}
                            {(() => {
                              const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
                              const days = [];
                              for (let i = 0; i < startingDayOfWeek; i++) {
                                days.push(<div key={`empty-${i}`} className="aspect-square" />);
                              }
                              for (let day = 1; day <= daysInMonth; day++) {
                                const disabled = isDateDisabled(day);
                                const selected = isDateSelected(day);
                                days.push(
                                  <button
                                    key={day}
                                    type="button"
                                    onClick={() => !disabled && handleDateClick(day)}
                                    disabled={disabled}
                                    className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                                      disabled
                                        ? 'text-gray-300 cursor-not-allowed'
                                        : selected
                                          ? 'bg-primary text-white shadow-sm scale-105'
                                          : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    {day}
                                  </button>
                                );
                              }
                              return days;
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Time Slots */}
                      {selectedDate && (
                        <div className="space-y-2">
                          <label className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Select New Time</span>
                            <span className="text-xs text-primary">All times are in local time</span>
                          </label>
                          <div className="border border-gray-200 rounded-lg p-3">
                            {isRescheduling ? (
                              <div className="py-8 text-center">
                                <div className="inline-block animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mb-2"></div>
                                <p className="text-sm text-gray-500">Loading available slots...</p>
                              </div>
                            ) : availableSlots.length === 0 ? (
                              <div className="p-4 text-center">
                                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                  <Calendar size={20} className="text-gray-400" />
                                </div>
                                <p className="text-gray-700 font-medium">No Available Slots</p>
                                <p className="text-xs text-gray-500 mt-1">Please try selecting another date</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                                {availableSlots.map((slot, idx) => {
                                  if (!slot?.startTime) return null;
                                  return (
                                    <button
                                      key={`${slot.date}-${slot.startTime}-${idx}`}
                                      type="button"
                                      onClick={() => setSelectedTime(slot.startTime)}
                                      className={`p-2.5 text-sm rounded-md transition-all ${
                                        selectedTime === slot.startTime
                                          ? 'bg-primary text-white font-medium shadow-sm'
                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      {to12Hr(slot.startTime)}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 flex items-start gap-2 mt-4">
                        <Info size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium mb-1">Rescheduling Policy</p>
                          <p className="text-blue-700 text-xs">
                            Rescheduling must be done at least 3 hours before your appointment time.
                            Your payment will be applied to the new appointment.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                        <button
                          type="button"
                          onClick={() => {
                            setRescheduleModal(false);
                            setAppointmentToReschedule(null);
                            setSelectedDate('');
                            setSelectedTime('');
                            setSelectedCalendarDate(null);
                          }}
                          className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={rescheduleAppointment}
                          disabled={!selectedDate || !selectedTime || isRescheduling}
                          className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 ${
                            !selectedDate || !selectedTime || isRescheduling
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                          }`}
                        >
                          {isRescheduling ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Processing...
                            </>
                          ) : (
                            <>
                              <RefreshCw size={18} />
                              Confirm Reschedule
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

        {/* ── Cancel Modal ── */}
        <AnimatePresence>
          {cancelModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            >
              <motion.div
                className="bg-white rounded-xl overflow-hidden max-w-md w-full shadow-xl"
                initial={{ scale: 0.9, y: -50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: -50 }}
              >
                <div className="bg-gradient-to-r from-red-50 to-white p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <div className="p-2 bg-red-100 rounded-full">
                      <AlertTriangle size={16} className="text-red-500" />
                    </div>
                    Cancel Appointment
                  </h3>
                </div>

                <div className="p-6">
                  <div className="text-center">
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to cancel your appointment on{' '}
                      <span className="font-medium text-gray-800">
                        {slotDateFormat(appointmentToCancel?.slotDate)}
                      </span>{' '}
                      at{' '}
                      <span className="font-medium text-gray-800">
                        {to12Hr(appointmentToCancel?.slotTime)}
                      </span>{' '}
                      with{' '}
                      <span className="font-medium text-gray-800">
                        {appointmentToCancel?.docData?.name}
                      </span>?
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm border border-gray-200">
                      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                            <img
                              src={appointmentToCancel?.docData?.image || assets.defaultProfile}
                              alt={appointmentToCancel?.docData?.name || 'Stylist'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-800">{appointmentToCancel?.service}</p>
                            <p className="text-xs text-gray-500">
                              {currencySymbol}{appointmentToCancel?.amount}
                            </p>
                          </div>
                        </div>
                        <div className="border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-6 mt-2 md:mt-0">
                          <div className="flex items-center gap-2 text-left">
                            <Calendar size={16} className="text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Appointment Date</p>
                              <p className="text-gray-800">
                                {slotDateFormat(appointmentToCancel?.slotDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6 text-sm text-yellow-800 text-left">
                      <p className="flex items-start gap-2">
                        <Info size={18} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span>
                          {appointmentToCancel?.payment
                            ? 'Cancellations may be subject to our refund policy. Please contact customer support for refund details if needed.'
                            : 'You can cancel unpaid appointments without any charge.'}
                        </span>
                      </p>
                    </div>

                    <div className="flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setCancelModal(false);
                          setAppointmentToCancel(null);
                        }}
                        className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        No, Keep It
                      </button>
                      <button
                        type="button"
                        onClick={cancelAppointment}
                        className="px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium shadow-sm"
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

        {/* ── Scroll-to-top Button ── */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed bottom-6 right-6 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all duration-300 flex items-center justify-center transform ${
            scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
          }`}
        >
          <ChevronsUp size={20} />
        </button>

        <style>{`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-10px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .animate-slideDown { animation: slideDown 0.3s ease-out; }

          @media (max-width: 640px) {
            .bg-white.rounded-xl { border-radius: 12px; }
            .p-5.sm\\:p-6 { padding: 1.25rem; }
          }

          .bg-white.rounded-xl.shadow-sm:hover {
            transform: translateY(-2px);
            transition: all 0.3s ease;
          }

          .max-h-60.overflow-y-auto::-webkit-scrollbar { width: 6px; }
          .max-h-60.overflow-y-auto::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
          .max-h-60.overflow-y-auto::-webkit-scrollbar-thumb { background: #cfcfcf; border-radius: 10px; }
          .max-h-60.overflow-y-auto::-webkit-scrollbar-thumb:hover { background: #a3a3a3; }
        `}</style>
      </div>
    </div>
  );
};

export default MyAppointments;