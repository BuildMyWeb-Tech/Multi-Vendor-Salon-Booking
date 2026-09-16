import React, { useEffect, useState } from 'react'
import { useContext } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { 
  Trash2, 
  Calendar, 
  XCircle, 
  Download, 
  Search,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  IndianRupee,
  X,
  Check,
  AlertCircle,
  Filter,
  Scissors,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCcw,
  FileText,
  Phone ,
  FileSpreadsheet
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { AnimatePresence, motion } from 'framer-motion'
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";


const AllAppointments = () => {
  const { 
    aToken, 
    appointments, 
    appointmentsLoading, 
    cancelAppointment, 
    getAllAppointments, 
    markAppointmentCompleted, 
    markAppointmentIncomplete 
  } = useContext(AdminContext)
  
  const { currency } = useContext(AppContext)
  
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState(null)
  const [localAppointments, setLocalAppointments] = useState([])
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [todayFilter, setTodayFilter] = useState(false)
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  
  // Calendar modal state
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [selectedQuickFilter, setSelectedQuickFilter] = useState(null)
  const [tempStartDate, setTempStartDate] = useState('')
  const [tempEndDate, setTempEndDate] = useState('')
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        await getAllAppointments();
      } catch (error) {
        console.error('Error in appointment fetch:', error);
      }
    };
    
    if (aToken) {
      fetchData();
    }
  }, [aToken]);
  
  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterPayment, searchTerm, startDate, endDate, todayFilter]);
  
  // Clear all filters
  const clearFilters = () => {
    setFilterStatus('all')
    setFilterPayment('all')
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSortBy('date-desc')
    setSelectedQuickFilter(null)
    setTodayFilter(false)
  }
  
  // Handle Today Filter — only sets date range, keeps filterStatus as 'all'
  const handleTodayFilter = () => {
    const newTodayFilter = !todayFilter;
    setTodayFilter(newTodayFilter);
    setFilterStatus('all');

    if (newTodayFilter) {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
      setSelectedQuickFilter('today');
    } else {
      setStartDate('');
      setEndDate('');
      setSelectedQuickFilter(null);
    }
  }
  
  // Quick date filter functions
  const applyQuickFilter = (filter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let start = new Date(today);
    let end = new Date(today);
    
    switch(filter) {
      case 'today':
        break;
      case 'yesterday':
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() - 1);
        break;
      case 'last7':
        start.setDate(start.getDate() - 6);
        break;
      case 'last30':
        start.setDate(start.getDate() - 29);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        start = new Date(today.getFullYear() - 1, 0, 1);
        end = new Date(today.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }
    
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    setStartDate(startStr);
    setEndDate(endStr);
    setSelectedQuickFilter(filter);
    setShowCalendarModal(false);
  }
  
  // Clear calendar dates
  const clearCalendarDates = () => {
    setStartDate('');
    setEndDate('');
    setTempStartDate('');
    setTempEndDate('');
    setSelectedQuickFilter(null);
    setTodayFilter(false);
  }

  const callPhoneNumber = (phone) => {
    if (!phone || phone === "-") {
      toast.error("Phone number not available");
      return;
    }
    window.location.href = `tel:${phone}`;
    toast.info(`Calling ${phone}...`);
  };
  
  // Open calendar modal
  const openCalendarModal = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setShowCalendarModal(true);
  }
  
  // Calendar component
  const CalendarModal = () => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    
    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days = [];
      
      // Previous month days
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        days.push({
          day: prevMonthLastDay - i,
          isCurrentMonth: false,
          date: new Date(year, month - 1, prevMonthLastDay - i)
        });
      }
      
      // Current month days
      for (let i = 1; i <= daysInMonth; i++) {
        days.push({
          day: i,
          isCurrentMonth: true,
          date: new Date(year, month, i)
        });
      }
      
      // Next month days to fill grid
      const totalCells = Math.ceil(days.length / 7) * 7;
      const remainingDays = totalCells - days.length;
      for (let i = 1; i <= remainingDays; i++) {
        days.push({
          day: i,
          isCurrentMonth: false,
          date: new Date(year, month + 1, i)
        });
      }
      
      return days;
    };
    
    const navigateMonth = (direction) => {
      if (direction === 'prev') {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
      } else {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
      }
    };
    
    const isDateInRange = (date) => {
      if (!tempStartDate || !tempEndDate) return false;
      const start = new Date(tempStartDate);
      const end = new Date(tempEndDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      return date >= start && date <= end;
    };
    
    const isDateSelected = (date) => {
      const start = tempStartDate ? new Date(tempStartDate) : null;
      const end = tempEndDate ? new Date(tempEndDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      return (start && date.getTime() === start.getTime()) || (end && date.getTime() === end.getTime());
    };
    
    const handleDateClick = (date) => {
      const dateStr = date.toISOString().split('T')[0];
      
      if (!tempStartDate || (tempStartDate && tempEndDate)) {
        setTempStartDate(dateStr);
        setTempEndDate('');
        setSelectedQuickFilter(null);
      } else {
        const start = new Date(tempStartDate);
        if (date < start) {
          setTempStartDate(dateStr);
          setTempEndDate(tempStartDate);
        } else {
          setTempEndDate(dateStr);
        }
        setSelectedQuickFilter('custom');
        
        // Auto apply when both dates selected
        setTimeout(() => {
          setStartDate(tempStartDate);
          setEndDate(dateStr);
          setShowCalendarModal(false);
        }, 200);
      }
    };
    
    const renderCalendar = () => {
      const days = getDaysInMonth(currentMonth);
      const monthName = fullMonths[currentMonth.getMonth()];
      const year = currentMonth.getFullYear();
      
      return (
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center font-bold text-gray-800 text-lg">
              {monthName} {year}
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
            {days.map((dayObj, idx) => {
              const isInRange = isDateInRange(dayObj.date);
              const isSelected = isDateSelected(dayObj.date);
              const isToday = dayObj.date.toDateString() === today.toDateString();
              
              return (
                <button
                  key={idx}
                  onClick={() => dayObj.isCurrentMonth && handleDateClick(dayObj.date)}
                  disabled={!dayObj.isCurrentMonth}
                  className={`
                    aspect-square p-1 text-sm rounded-lg transition-all font-medium
                    ${!dayObj.isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : 'text-gray-800 hover:bg-blue-50'}
                    ${isSelected ? 'bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md' : ''}
                    ${isInRange && !isSelected ? 'bg-blue-100 text-blue-900' : ''}
                    ${isToday && !isSelected && !isInRange ? 'ring-2 ring-blue-600 font-bold' : ''}
                  `}
                >
                  {dayObj.day}
                </button>
              );
            })}
          </div>
        </div>
      );
    };
    
    const formatDateRange = () => {
      if (!tempStartDate || !tempEndDate) return 'Select date range';
      const start = new Date(tempStartDate);
      const end = new Date(tempEndDate);
      return `${start.getMonth() + 1}/${start.getDate()}/${start.getFullYear()} - ${end.getMonth() + 1}/${end.getDate()}/${end.getFullYear()}`;
    };
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowCalendarModal(false)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with Close Button */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Select Date Range</h3>
            <button
              onClick={() => setShowCalendarModal(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          {/* Quick Filters */}
          <div className="mb-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Filters</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => applyQuickFilter('today')}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-700 hover:from-blue-100 hover:to-blue-200 hover:shadow-md"
              >
                Today
              </button>
              <button
                onClick={() => applyQuickFilter('yesterday')}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-700 hover:from-gray-100 hover:to-gray-200 hover:shadow-md"
              >
                Yesterday
              </button>
              <button
                onClick={() => applyQuickFilter('last7')}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 text-purple-700 hover:from-purple-100 hover:to-purple-200 hover:shadow-md"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => applyQuickFilter('last30')}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 text-indigo-700 hover:from-indigo-100 hover:to-indigo-200 hover:shadow-md"
              >
                Last 30 Days
              </button>
            </div>
          </div>
          
          {/* Selected Range Display */}
          {(tempStartDate || tempEndDate) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900 text-center">
                {formatDateRange()}
              </p>
            </div>
          )}
          
          {/* Calendar */}
          <div className="mb-5">
            {renderCalendar()}
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={clearCalendarDates}
              className="flex-1 px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all font-medium"
            >
              Clear
            </button>
            <button
              onClick={() => setShowCalendarModal(false)}
              className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };
  
  const slotDateFormat = (slotDate) => {
    if (!slotDate) return 'Invalid Date';
    
    if (slotDate.includes('_')) {
      const dateArray = slotDate.split('_');
      if (dateArray.length !== 3) return 'Invalid Date';
      
      const day = dateArray[0];
      const month = Number(dateArray[1]) - 1;
      const year = dateArray[2];
      
      if (month < 0 || month > 11) return 'Invalid Date';
      
      return `${day} ${months[month]} ${year}`;
    }
    
    try {
      const dateObj = new Date(slotDate);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      
      const day = dateObj.getDate();
      const month = dateObj.getMonth();
      const year = dateObj.getFullYear();
      
      return `${day} ${months[month]} ${year}`;
    } catch (error) {
      console.error('Date format error:', error);
      return 'Invalid Date';
    }
  };

  // ✅ Convert 24hr to 12hr format
  const formatTime12hr = (time) => {
    if (!time) return 'N/A';
    if (time.toLowerCase().includes('am') || time.toLowerCase().includes('pm')) return time;
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr);
    const minute = minuteStr || '00';
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${period}`;
  };
  
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date(NaN);
    
    if (dateStr.includes('_')) {
      const [day, month, year] = dateStr.split('_').map(Number);
      return new Date(year, month - 1, day);
    }
    
    return new Date(dateStr);
  };
  
  const isAppointmentTimePast = (appointment) => {
    if (!appointment || !appointment.slotDate || !appointment.slotTime) return false;
    
    const appointmentDate = parseDateString(appointment.slotDate);
    
    const timeParts = appointment.slotTime.match(/(\d+):(\d+)\s*([APap][Mm])/);
    if (timeParts) {
      let [, hours, minutes, period] = timeParts;
      hours = parseInt(hours);
      minutes = parseInt(minutes);
      
      if (period.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
      }
      
      appointmentDate.setHours(hours, minutes);
      appointmentDate.setMinutes(appointmentDate.getMinutes() + 30);
      
      return new Date() > appointmentDate;
    }
    
    return false;
  }

  const filteredAppointments = localAppointments.filter(appointment => {

    let matchesStatus = true;
    if (todayFilter) {
      matchesStatus = !appointment.cancelled && !appointment.isCompleted;
    } else if (filterStatus === 'upcoming') {
      matchesStatus = !appointment.isCompleted && !appointment.cancelled;
    } else if (filterStatus === 'completed') {
      matchesStatus = appointment.isCompleted === true && !appointment.cancelled;
    } else if (filterStatus === 'cancelled') {
      matchesStatus = appointment.cancelled === true;
    }

    const matchesPayment =
      filterPayment === 'all' ||
      (filterPayment === 'paid' && appointment.payment) ||
      (filterPayment === 'unpaid' && !appointment.payment);

    const searchString = [
      appointment.userData?.name || '',
      appointment.userData?.phone || '',
      appointment.docData?.name || '',
      appointment.service || '',
      appointment.docData?.specialty || appointment.docData?.speciality || ''
    ].map(s => s.toLowerCase()).join(' ');

    const matchesSearch = !searchTerm || searchString.includes(searchTerm.toLowerCase());

    let matchesDateRange = true;
    if (startDate || endDate) {
      const appointmentDate = parseDateString(appointment.slotDate);
      appointmentDate.setHours(0, 0, 0, 0);

      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = appointmentDate >= start && appointmentDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDateRange = appointmentDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = appointmentDate <= end;
      }
    }

    return matchesStatus && matchesPayment && matchesSearch && matchesDateRange;
  });
  
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = parseDateString(a.slotDate);
    const dateB = parseDateString(b.slotDate);
    
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    
    if (sortBy === 'date-asc') return dateA - dateB;
    if (sortBy === 'date-desc') return dateB - dateA;
    if (sortBy === 'price-asc') return (a.amount || 0) - (b.amount || 0);
    if (sortBy === 'price-desc') return (b.amount || 0) - (a.amount || 0);
    return 0;
  });
  
  const totalPages = Math.ceil(sortedAppointments.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedAppointments = sortedAppointments.slice(startIndex, endIndex);
  
  const handleMarkCompleted = (id) => {
    setLocalAppointments(prev => 
      prev.map(app => 
        app._id === id ? {...app, isCompleted: true} : app
      )
    );
    markAppointmentCompleted(id);
  }
  
  const handleUndoCompleted = (id) => {
    setLocalAppointments(prev => 
      prev.map(app => 
        app._id === id ? {...app, isCompleted: false} : app
      )
    );
    markAppointmentIncomplete(id);
  }
  
  const handleDeleteConfirmation = (appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  }
  
  const handleDeleteConfirmed = () => {
    if (appointmentToDelete) {
      setLocalAppointments(prev => 
        prev.filter(app => app._id !== appointmentToDelete._id)
      );
      cancelAppointment(appointmentToDelete._id);
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
    }
  }
  
  const StatusBadge = ({ appointment }) => {
    const isPastAndUnhandled = !appointment.isCompleted && !appointment.cancelled && isAppointmentTimePast(appointment);
    const isPaid = appointment.payment;
    
    if (appointment.cancelled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-full text-xs font-semibold shadow-sm border border-red-200">
          <XCircle size={13} />
          Cancelled
        </span>
      )
    } else if (appointment.isCompleted) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-full text-xs font-semibold shadow-sm border border-green-200">
          <CheckCircle size={13} />
          Completed {isPaid && '• Paid'}
        </span>
      )
    } else if (isPastAndUnhandled) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 rounded-full text-xs font-semibold shadow-sm border border-amber-200">
          <AlertCircle size={13} />
          Overdue {isPaid ? '• Paid' : '• Unpaid'}
        </span>
      )
    } else {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border ${
          isPaid 
            ? 'bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border-purple-200' 
            : 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-200'
        }`}>
          <Calendar size={13} />
          Upcoming {isPaid ? '• Paid' : '• Unpaid'}
        </span>
      )
    }
  }

  const getFileDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const getFullDateTime = () => {
    return new Date().toLocaleString();
  };

  const formatDateForExport = (dateStr) => {
    return slotDateFormat(dateStr) || dateStr;
  };

  const exportToPDF = () => {
    if (!sortedAppointments || sortedAppointments.length === 0) {
      alert("No appointment data available");
      return;
    }

    const doc = new jsPDF("landscape");
    const downloadDate = getFullDateTime();

    doc.setFontSize(18);
    doc.text("Salon Appointments Report", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Downloaded on: ${downloadDate}`, 14, 28);

    const tableData = sortedAppointments.map((item, index) => [
      index + 1,
      item.userData?.name || "-",
      item.userData?.phone || "-",
      item.docData?.name || "-",
      item.service || item.docData?.specialty || "-",
      formatDateForExport(item.slotDate) || "-",
      formatTime12hr(item.slotTime) || "-",
      item.cancelled
        ? "Cancelled"
        : item.isCompleted
        ? "Completed"
        : isAppointmentTimePast(item)
        ? "Overdue"
        : "Upcoming",
      item.payment ? "Paid" : "Unpaid",
      `Rs. ${item.amount || 0}`,
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["#", "Customer", "Phone", "Stylist", "Service", "Date", "Time", "Status", "Payment", "Amount"]],
      body: tableData,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`Salon_Appointments_${getFileDate()}.pdf`);
    setShowExportMenu(false);
  };

  const exportToExcel = () => {
    if (!sortedAppointments || sortedAppointments.length === 0) {
      alert("No appointment data available");
      return;
    }

    const downloadDate = getFullDateTime();

    const excelData = sortedAppointments.map((item, index) => ({
      "S.No": index + 1,
      "Customer Name": item.userData?.name || "",
      "Phone Number": item.userData?.phone || "",
      "Stylist Name": item.docData?.name || "",
      "Service": item.service || item.docData?.specialty || item.docData?.speciality || "",
      "Date": formatDateForExport(item.slotDate) || "",
      "Time": formatTime12hr(item.slotTime) || "",
      "Status": item.cancelled ? "Cancelled" : item.isCompleted ? "Completed" : isAppointmentTimePast(item) ? "Overdue" : "Upcoming",
      "Payment Status": item.payment ? "Paid" : "Unpaid",
      "Amount": `Rs. ${item.amount || 0}`,
    }));

    const worksheet = XLSX.utils.aoa_to_sheet([
      [`Downloaded on: ${downloadDate}`],
      [],
      Object.keys(excelData[0]),
      ...excelData.map(Object.values),
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments");

    worksheet["!cols"] = [
      { wch: 5 }, { wch: 20 }, { wch: 15 }, { wch: 18 }, { wch: 20 },
      { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 10 },
    ];

    XLSX.writeFile(workbook, `Salon_Appointments_${getFileDate()}.xlsx`);
    setShowExportMenu(false);
  };

  const manualRefresh = () => {
    window.location.reload();
  };

  const isFilterActive = () => {
    return (
      filterStatus !== 'all' || 
      filterPayment !== 'all' || 
      searchTerm !== '' || 
      startDate !== '' || 
      endDate !== '' || 
      todayFilter
    );
  };

  return (
    <div className='w-full max-w-[1600px] mx-auto p-3 sm:p-4 md:p-6'>
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Salon Appointments</h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">Manage all customer styling appointments</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={manualRefresh}
                className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-xs sm:text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <RefreshCcw size={16} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-3 sm:px-4 py-2 bg-white border-2 border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Export</span>
                </button>
                
                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-10"
                    >
                      <button
                        type="button"
                        onClick={exportToPDF}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-red-50 flex items-center gap-3 transition-colors border-b border-gray-100"
                      >
                        <FileText size={18} className="text-red-600" />
                        <span>PDF</span>
                      </button>
                      <button
                        onClick={exportToExcel}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-green-50 flex items-center gap-3 transition-colors"
                      >
                        <FileSpreadsheet size={18} className="text-green-600" />
                        <span>Excel</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters Bar */}
        <div className="p-3 sm:p-4 md:p-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-200">
          <div className="flex flex-col gap-3">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-semibold text-gray-700 mr-1">Status:</span>
              <div className="flex flex-wrap gap-2">
                {/* ALL */}
                <button 
                  onClick={() => { setFilterStatus('all'); setTodayFilter(false); setStartDate(''); setEndDate(''); setSelectedQuickFilter(null); }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
                    filterStatus === 'all' && !todayFilter
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  All
                </button>

                {/* TODAY */}
                <button 
                  onClick={handleTodayFilter}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
                    todayFilter
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg scale-105' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  Today
                </button>

                {/* UPCOMING */}
                <button 
                  onClick={() => { setFilterStatus('upcoming'); setTodayFilter(false); setStartDate(''); setEndDate(''); setSelectedQuickFilter(null); }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
                    filterStatus === 'upcoming' && !todayFilter
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-105' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  Upcoming
                </button>

                {/* COMPLETED */}
                <button 
                  onClick={() => { setFilterStatus('completed'); setTodayFilter(false); setStartDate(''); setEndDate(''); setSelectedQuickFilter(null); }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
                    filterStatus === 'completed' && !todayFilter
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  Completed
                </button>

                {/* CANCELLED */}
                <button 
                  onClick={() => { setFilterStatus('cancelled'); setTodayFilter(false); setStartDate(''); setEndDate(''); setSelectedQuickFilter(null); }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
                    filterStatus === 'cancelled' && !todayFilter
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg scale-105' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>
            
            {/* Search and Date Row */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by customer, stylist, service or phone..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full transition-all shadow-sm"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XCircle size={18} />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={openCalendarModal}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white border-2 border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm"
                >
                  <Calendar size={16} />
                  <span className="hidden sm:inline">
                    {startDate && endDate 
                      ? `${new Date(startDate).getMonth() + 1}/${new Date(startDate).getDate()}/${new Date(startDate).getFullYear().toString().slice(-2)} - ${new Date(endDate).getMonth() + 1}/${new Date(endDate).getDate()}/${new Date(endDate).getFullYear().toString().slice(-2)}`
                      : 'Date Range'
                    }
                  </span>
                  <span className="sm:hidden">Date</span>
                </button>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 sm:py-2.5 border-2 border-gray-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                </select>
                
                {isFilterActive() && (
                  <button
                    onClick={clearFilters}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs sm:text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Filter size={16} />
                    <span>Clear Filters</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          {appointmentsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
              <div className="relative">
                <div className="animate-spin h-16 w-16 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Scissors size={24} className="text-blue-600 animate-pulse" />
                </div>
              </div>
              <p className="mt-6 font-semibold text-lg">Loading appointments...</p>
            </div>
          ) : paginatedAppointments.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
              <Calendar size={64} className="text-gray-300 mb-4" />
              <p className="font-semibold text-lg">No appointments found</p>
              <p className="text-sm mt-2">Try changing your filters or search term</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 md:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Customer Details</th>
                  <th className="px-3 sm:px-4 md:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Stylist & Service</th>
                  <th className="px-3 sm:px-4 md:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Date & Time</th>
                  <th className="px-3 sm:px-4 md:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Status</th>
                  <th className="px-3 sm:px-4 md:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Price</th>
                  <th className="px-3 sm:px-4 md:px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedAppointments.map((appointment, index) => (
                  <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                    <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12">
                          {appointment.userData?.image ? (
                            <img className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl object-cover ring-2 ring-blue-100" src={appointment.userData.image} alt={appointment.userData.name} />
                          ) : (
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md">
                              {appointment.userData?.name?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div className="ml-3 sm:ml-4">
                          <div className="text-sm sm:text-base font-semibold text-gray-900">{appointment.userData?.name || "N/A"}</div>
                          <div onClick={() => callPhoneNumber(appointment.userData?.phone)} className="text-xs sm:text-sm text-gray-600 font-medium mt-0.5 flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-all">
                            <Phone className="w-3.5 h-3.5" />
                            {appointment.userData?.phone || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 sm:px-4 md:px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-8 w-8 sm:h-9 sm:w-9 mt-1">
                          {appointment.docData?.image ? (
                            <img className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg object-cover ring-2 ring-purple-100" src={appointment.docData.image} alt={appointment.docData.name} />
                          ) : (
                            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white shadow-md">
                              <Scissors size={14} />
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-xs sm:text-sm font-semibold text-gray-900">{appointment.docData?.name || "N/A"}</div>
                          <div className="text-xs text-gray-600 mt-1 max-w-[200px] leading-relaxed">{appointment.service || appointment.docData?.specialty || appointment.docData?.speciality || "N/A"}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-bold text-gray-900">{slotDateFormat(appointment.slotDate)}</div>
                      <div className="text-xs text-gray-600 font-medium mt-1">{formatTime12hr(appointment.slotTime)}</div>
                    </td>
                    
                    <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap">
                      <StatusBadge appointment={appointment} />
                    </td>
                    
                    <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap text-sm sm:text-base font-bold text-gray-900">
                      <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                        Rs. {appointment.amount || appointment.price || 0}
                      </div>
                    </td>
                    
                    <td className="px-3 sm:px-4 md:px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!appointment.cancelled && (
                          appointment.isCompleted ? (
                            <button onClick={() => handleUndoCompleted(appointment._id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110 shadow-sm hover:shadow-md" title="Undo completion">
                              <RotateCcw size={18} />
                            </button>
                          ) : (
                            <button onClick={() => handleMarkCompleted(appointment._id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all hover:scale-110 shadow-sm hover:shadow-md" title="Mark as completed">
                              <CheckCircle size={18} />
                            </button>
                          )
                        )}
                        <button onClick={() => handleDeleteConfirmation(appointment)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110 shadow-sm hover:shadow-md" title="Delete permanently">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer - Stats and Pagination */}
        {paginatedAppointments.length > 0 && (
          <div className="px-3 sm:px-4 md:px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-200">
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-center justify-between mb-4 pb-4 border-b border-gray-200">
              <div className="text-xs sm:text-sm text-gray-700 font-semibold">
                Showing <span className="text-blue-600">{startIndex + 1}</span> to <span className="text-blue-600">{Math.min(endIndex, sortedAppointments.length)}</span> of <span className="text-blue-600">{sortedAppointments.length}</span> total
              </div>
              
              <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg font-semibold border border-purple-200">
                  Upcoming: {localAppointments.filter(a => !a.isCompleted && !a.cancelled && !isAppointmentTimePast(a)).length}
                </span>
                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg font-semibold border border-amber-200">
                  Overdue: {localAppointments.filter(a => !a.isCompleted && !a.cancelled && isAppointmentTimePast(a)).length}
                </span>
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg font-semibold border border-green-200">
                  Completed: {localAppointments.filter(a => a.isCompleted).length}
                </span>
                <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg font-semibold border border-red-200">
                  Cancelled: {localAppointments.filter(a => a.cancelled).length}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-700 font-semibold">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2 rounded-lg border-2 border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md" title="First page">
                  <ChevronsLeft size={18} />
                </button>
                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border-2 border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md" title="Previous page">
                  <ChevronLeft size={18} />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-2 text-gray-400 text-sm">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 rounded-lg font-bold text-xs sm:text-sm transition-all shadow-sm ${
                            currentPage === page
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                              : 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow-md'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                </div>
                
                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border-2 border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md" title="Next page">
                  <ChevronRight size={18} />
                </button>
                <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2 rounded-lg border-2 border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md" title="Last page">
                  <ChevronsRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100"
            >
              <div className="mb-6 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-red-100 to-red-200 mb-5 shadow-lg">
                  <AlertTriangle size={32} className="sm:w-10 sm:h-10 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">Delete Appointment Permanently?</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  This will permanently delete the appointment for <span className="font-bold text-gray-900">{appointmentToDelete?.userData?.name}</span> on <span className="font-bold text-gray-900">{slotDateFormat(appointmentToDelete?.slotDate)}</span> at <span className="font-bold text-gray-900">{appointmentToDelete?.slotTime}</span>.
                </p>
                <p className="text-xs sm:text-sm text-red-600 font-semibold mt-2">This action cannot be undone!</p>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold shadow-md hover:shadow-lg text-sm sm:text-base">
                  Cancel
                </button>
                <button onClick={handleDeleteConfirmed} className="flex-1 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base">
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendarModal && <CalendarModal />}
      </AnimatePresence>
    </div>
  );
};

export default AllAppointments;