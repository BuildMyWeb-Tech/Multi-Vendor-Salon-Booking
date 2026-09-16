import React, { useEffect, useState, useContext, useRef } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { 
  Trash2, 
  Calendar as CalendarIcon, 
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
  LayoutGrid,
  LayoutList,
  ChevronDown,
  PlusCircle,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Clock
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { AnimatePresence, motion } from 'framer-motion'

const AllAppointments = () => {
  // Context
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
  
  // State
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState(null)
  const [localAppointments, setLocalAppointments] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [viewMode, setViewMode] = useState('list') // 'list', 'grid', 'calendar'
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const filterPanelRef = useRef(null)
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  // Check for dark mode preference
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark-theme')
    setDarkMode(isDark)
    
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
          setDarkMode(document.documentElement.classList.contains('dark-theme'))
        }
      })
    })
    
    observer.observe(document.documentElement, { attributes: true })
    
    return () => observer.disconnect()
  }, [])
  
  // Close filter panel on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target) && 
          !event.target.closest('[data-filter-toggle]')) {
        setShowFilterPanel(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Fetch appointments data
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
  
  // Update local appointments when server data changes
  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus, filterPayment, searchTerm, startDate, endDate])
  
  // Clear all filters
  const clearFilters = () => {
    setFilterStatus('all')
    setFilterPayment('all')
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSortBy('date-desc')
    setShowFilterPanel(false)
  }
  
  // Function to format dates in DD_MM_YYYY format
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
  
  // Helper to parse date strings
  const parseDateString = (dateStr) => {
    if (!dateStr) return new Date(NaN);
    
    if (dateStr.includes('_')) {
      const [day, month, year] = dateStr.split('_').map(Number);
      return new Date(year, month - 1, day);
    }
    
    return new Date(dateStr);
  };
  
  // Check if appointment time is past
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
  
  // Filter appointments based on criteria
  const filteredAppointments = localAppointments.filter(appointment => {
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'upcoming' && !appointment.isCompleted && !appointment.cancelled) ||
      (filterStatus === 'completed' && appointment.isCompleted && !appointment.cancelled) ||
      (filterStatus === 'cancelled' && appointment.cancelled);
    
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
    
    if (viewMode === 'calendar' && selectedDate) {
      const appointmentDate = parseDateString(appointment.slotDate);
      const selected = new Date(selectedDate);
      
      const appointmentDay = new Date(
        appointmentDate.getFullYear(),
        appointmentDate.getMonth(),
        appointmentDate.getDate()
      );
      
      const selectedDay = new Date(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate()
      );
      
      const matchesSelectedDate = appointmentDay.getTime() === selectedDay.getTime();
      return matchesStatus && matchesPayment && matchesSearch && matchesDateRange && matchesSelectedDate;
    }
    
    return matchesStatus && matchesPayment && matchesSearch && matchesDateRange;
  });
  
  // Sort appointments
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
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = viewMode !== 'calendar' 
    ? sortedAppointments.slice(indexOfFirstItem, indexOfLastItem)
    : sortedAppointments;
  
  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
  
  // Handle mark as completed with local state update
  const handleMarkCompleted = (id) => {
    setLocalAppointments(prev => 
      prev.map(app => 
        app._id === id ? {...app, isCompleted: true} : app
      )
    );
    
    markAppointmentCompleted(id);
  }
  
  // Handle undo completed with local state update
  const handleUndoCompleted = (id) => {
    setLocalAppointments(prev => 
      prev.map(app => 
        app._id === id ? {...app, isCompleted: false} : app
      )
    );
    
    markAppointmentIncomplete(id);
  }
  
  // Handle delete confirmation
  const handleDeleteConfirmation = (appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  }
  
  // Handle delete confirmed with local state update
  const handleDeleteConfirmed = () => {
    if (appointmentToDelete) {
      setLocalAppointments(prev => 
        prev.map(app => 
          app._id === appointmentToDelete._id ? {...app, cancelled: true} : app
        )
      );
      
      cancelAppointment(appointmentToDelete._id);
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
    }
  }
  
  // Get days in a month for calendar
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  }
  
  // Generate calendar data
  const generateCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();
    
    const calendarDays = [];
    
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push({ day: null, isCurrentMonth: false });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      const appointmentsOnDay = localAppointments.filter(appointment => {
        const appDate = parseDateString(appointment.slotDate);
        return appDate.getDate() === day && 
               appDate.getMonth() === month &&
               appDate.getFullYear() === year;
      });
      
      const isToday = new Date().getDate() === day && 
                     new Date().getMonth() === month &&
                     new Date().getFullYear() === year;
                     
      calendarDays.push({ 
        day, 
        isCurrentMonth: true,
        date,
        isToday,
        appointments: appointmentsOnDay,
        hasAppointments: appointmentsOnDay.length > 0
      });
    }
    
    const totalCells = Math.ceil(calendarDays.length / 7) * 7;
    for (let i = calendarDays.length; i < totalCells; i++) {
      calendarDays.push({ day: null, isCurrentMonth: false });
    }
    
    return calendarDays;
  }
  
  // Change month in calendar
  const changeMonth = (increment) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCalendarDate(newDate);
    setSelectedDate(null);
  }
  
  // Go to today in calendar
  const goToToday = () => {
    setCalendarDate(new Date());
    setSelectedDate(new Date().toISOString().split('T')[0]);
  }
  
  // Handle date selection in calendar
  const selectDate = (day) => {
    if (!day || !day.isCurrentMonth) return;
    
    const dateStr = day.date.toISOString().split('T')[0];
    setSelectedDate(dateStr === selectedDate ? null : dateStr);
  }
  
  // Format date for export
  const formatDateForExport = (dateStr) => {
    return slotDateFormat(dateStr) || dateStr;
  }
  
  // Export to Excel
  const exportToExcel = () => {
    if (!sortedAppointments || sortedAppointments.length === 0) {
      alert('No appointment data available')
      return
    }

    const worksheet = XLSX.utils.json_to_sheet(
      sortedAppointments.map((item, index) => ({
        'S.No': index + 1,
        'Customer Name': item.userData?.name || '',
        'Phone Number': item.userData?.phone || '',
        'Stylist Name': item.docData?.name || '',
        'Service': item.service || item.docData?.specialty || item.docData?.speciality || '',
        'Date': formatDateForExport(item.slotDate) || '',
        'Time': item.slotTime || '',
        'Status': item.cancelled ? 'Cancelled' : 
                 item.isCompleted ? 'Completed' : 
                 isAppointmentTimePast(item) ? 'Overdue' : 'Upcoming',
        'Payment Status': item.payment ? 'Paid' : 'Unpaid',
        'Amount': item.amount ? `${currency}${item.amount}` : '0'
      }))
    );

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments')

    XLSX.writeFile(workbook, 'Salon_Appointments.xlsx')
  }
  
  // Status badge component
  const StatusBadge = ({ appointment }) => {
    const isPastAndUnhandled = !appointment.isCompleted && !appointment.cancelled && isAppointmentTimePast(appointment);
    
    if (appointment.cancelled) {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
        }`}>
          <XCircle size={12} />
          Cancelled
        </span>
      )
    } else if (appointment.isCompleted) {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
        }`}>
          <CheckCircle size={12} />
          Completed
        </span>
      )
    } else if (isPastAndUnhandled) {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
        }`}>
          <AlertCircle size={12} />
          Overdue
        </span>
      )
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const apptDate = parseDateString(appointment.slotDate);
      apptDate.setHours(0, 0, 0, 0);
      
      if (apptDate.getTime() === today.getTime()) {
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
            darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
          }`}>
            <CalendarIcon size={12} />
            Today
          </span>
        )
      } else {
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
            darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'
          }`}>
            <CalendarIcon size={12} />
            Upcoming
          </span>
        )
      }
    }
  }
  
  // Payment status badge component
  const PaymentStatusBadge = ({ appointment }) => {
    if (appointment.payment) {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
        }`}>
          <IndianRupee size={12} />
          Paid
        </span>
      )
    } else {
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
          darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
        }`}>
          <AlertTriangle size={12} />
          Unpaid
        </span>
      )
    }
  }

  // Render function for Grid View
  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {currentItems.map((appointment, index) => (
        <motion.div
          key={appointment._id || index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className={`rounded-lg shadow-sm overflow-hidden border transition-all ${
            darkMode 
              ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
              : 'bg-white border-gray-200 hover:border-primary/50 hover:shadow-md'
          }`}
        >
          <div className={`px-4 py-3 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                {appointment.userData?.image ? (
                  <img 
                    className="h-10 w-10 rounded-full object-cover"
                    src={appointment.userData.image} 
                    alt={appointment.userData.name}
                  />
                ) : (
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-base font-medium ${
                    darkMode ? 'bg-gray-700 text-gray-300' : 'bg-primary-light text-primary'
                  }`}>
                    {appointment.userData?.name?.charAt(0) || '?'}
                  </div>
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full ring-2 ${
                  darkMode ? 'ring-gray-800' : 'ring-white'
                } ${
                  appointment.cancelled ? 'bg-red-500' : 
                  appointment.isCompleted ? 'bg-green-500' :
                  isAppointmentTimePast(appointment) ? 'bg-amber-500' : 'bg-blue-500'
                }`}></span>
              </div>
              
              <div>
                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {appointment.userData?.name || "Customer"}
                </h3>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {appointment.userData?.phone || "No phone"}
                </p>
              </div>
            </div>
            
            <StatusBadge appointment={appointment} />
          </div>
          
          <div className="p-4">
            <div className={`grid grid-cols-2 gap-3 mb-4 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <div>
                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Stylist</p>
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 h-6 w-6">
                    {appointment.docData?.image ? (
                      <img 
                        className="h-6 w-6 rounded-full object-cover"
                        src={appointment.docData.image} 
                        alt={appointment.docData.name}
                      />
                    ) : (
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                      }`}>
                        <Scissors size={12} />
                      </div>
                    )}
                  </div>
                  <span className="truncate">
                    {appointment.docData?.name || "N/A"}
                  </span>
                </div>
              </div>
              
              <div>
                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Service</p>
                <p className="truncate">
                  {appointment.service || appointment.docData?.speciality || "N/A"}
                </p>
              </div>
              
              <div>
                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Date</p>
                <div className="flex items-center gap-1.5">
                  <CalendarIcon size={14} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <span>{slotDateFormat(appointment.slotDate)}</span>
                </div>
              </div>
              
              <div>
                <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>Time</p>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                  <span>{appointment.slotTime || "N/A"}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1.5">
                <IndianRupee size={16} className={appointment.payment ? 'text-green-500' : 'text-amber-500'} />
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {currency}{appointment.amount || appointment.price || 0}
                </span>
                <PaymentStatusBadge appointment={appointment} />
              </div>
              
              <div className="flex gap-2">
                {!appointment.cancelled && (
                  <>
                    {appointment.isCompleted ? (
                      <button 
                        onClick={() => handleUndoCompleted(appointment._id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          darkMode 
                            ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                        title="Undo completion"
                      >
                        <RotateCcw size={16} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleMarkCompleted(appointment._id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          darkMode 
                            ? 'bg-gray-700 text-green-400 hover:bg-gray-600' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                        title="Mark as completed"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleDeleteConfirmation(appointment)}
                      className={`p-1.5 rounded-md transition-colors ${
                        darkMode 
                          ? 'bg-gray-700 text-red-400 hover:bg-gray-600' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                      title="Cancel appointment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
      
      {currentItems.length === 0 && (
        <div className={`col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-10 ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <CalendarIcon size={48} className={darkMode ? 'text-gray-600' : 'text-gray-300'} />
          <p className="mt-3">No appointments found</p>
          <p className="text-sm mt-1">Try changing your filters or search term</p>
        </div>
      )}
    </div>
  );

  // Render function for List View
  const renderListView = () => (
    <div className="overflow-x-auto">
      <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
        <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
          <tr>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden lg:table-cell ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Service
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Date & Time
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Status
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Payment
            </th>
            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Price
            </th>
            <th scope="col" className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Actions
            </th>
          </tr>
        </thead>
        
        <tbody className={`${darkMode ? 'bg-gray-900 divide-y divide-gray-800' : 'bg-white divide-y divide-gray-200'}`}>
          {currentItems.length === 0 ? (
            <tr>
              <td colSpan="9" className="px-6 py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <CalendarIcon size={48} className={darkMode ? 'text-gray-600' : 'text-gray-300'} />
                  <p className={`mt-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No appointments found</p>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try changing your filters or search term</p>
                </div>
              </td>
            </tr>
          ) : (
            currentItems.map((appointment, index) => (
              <tr 
                key={appointment._id || index} 
                className={`${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 relative">
                      {appointment.userData?.image ? (
                        <img 
                          className="h-10 w-10 rounded-full object-cover" 
                          src={appointment.userData.image} 
                          alt={appointment.userData.name}
                        />
                      ) : (
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-base font-medium ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-primary-light text-primary'
                        }`}>
                          {appointment.userData?.name?.charAt(0) || '?'}
                        </div>
                      )}
                      
                      <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ${
                        darkMode ? 'ring-gray-900' : 'ring-white'
                      } ${
                        appointment.cancelled ? 'bg-red-500' : 
                        appointment.isCompleted ? 'bg-green-500' :
                        isAppointmentTimePast(appointment) ? 'bg-amber-500' : 'bg-blue-500'
                      }`}></span>
                    </div>
                    
                    <div className="ml-4">
                      <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {appointment.userData?.name || "N/A"}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {appointment.userData?.phone || "N/A"}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      {appointment.docData?.image ? (
                        <img 
                          className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" 
                          src={appointment.docData.image} 
                          alt={appointment.docData.name}
                        />
                      ) : (
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-700'
                        }`}>
                          <Scissors size={12} />
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {appointment.docData?.name || "N/A"}
                      </div>
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {appointment.service || appointment.docData?.specialty || appointment.docData?.speciality || "N/A"}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                    {slotDateFormat(appointment.slotDate)}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {appointment.slotTime || "N/A"}
                  </div>
                </td>                  
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge appointment={appointment} />
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <PaymentStatusBadge appointment={appointment} />
                </td>
                
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                  {currency}{appointment.amount || appointment.price || 0}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-3">
                    {!appointment.cancelled && (
                      appointment.isCompleted ? (
                        <button 
                          onClick={() => handleUndoCompleted(appointment._id)}
                          className={`text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors`}
                          title="Undo completion"
                        >
                          <RotateCcw size={18} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleMarkCompleted(appointment._id)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
                          title="Mark as completed"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )
                    )}
                    
                    {!appointment.cancelled && (
                      <button 
                        onClick={() => handleDeleteConfirmation(appointment)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        title="Cancel appointment"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // Render function for Calendar View
  const renderCalendarView = () => {
    const calendarDays = generateCalendarDays();
    const currentYear = calendarDate.getFullYear();
    const currentMonth = calendarDate.getMonth();
    
    return (
      <div className={`flex flex-col h-full ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
        {/* Calendar Header with Navigation */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {months[currentMonth]} {currentYear}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className={`p-1.5 rounded-lg ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToToday}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                darkMode 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => changeMonth(1)}
              className={`p-1.5 rounded-lg ${
                darkMode 
                  ? 'hover:bg-gray-700 text-gray-400' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className={`flex-1 grid grid-cols-7 ${darkMode ? 'border-gray-700' : 'border-gray-200'} border rounded-lg overflow-hidden`}>
          {/* Day Headers */}
          {weekDays.map((day, index) => (
            <div 
              key={index} 
              className={`text-center py-2 font-medium text-sm ${
                darkMode 
                  ? 'bg-gray-800 text-gray-400 border-gray-700' 
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              } border-b`}
            >
              {day}
            </div>
          ))}
          
          {/* Calendar Cells */}
          {calendarDays.map((day, index) => (
            <div 
              key={index} 
              onClick={() => selectDate(day)}
              className={`min-h-[100px] p-2 border ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              } relative ${
                day.isCurrentMonth
                  ? day.isToday
                    ? darkMode 
                      ? 'bg-blue-900/20' 
                      : 'bg-blue-50'
                    : selectedDate && day.date?.toISOString().split('T')[0] === selectedDate
                      ? darkMode 
                        ? 'bg-purple-900/20' 
                        : 'bg-purple-50'
                      : darkMode 
                        ? 'bg-gray-800 hover:bg-gray-700' 
                        : 'bg-white hover:bg-gray-50'
                  : darkMode 
                    ? 'bg-gray-900 text-gray-600' 
                    : 'bg-gray-50 text-gray-400'
              } ${
                day.isCurrentMonth ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {day.day && (
                <>
                  <div className={`flex justify-between items-center ${
                    day.isToday ? 'mb-1' : 'mb-2'
                  }`}>
                    {/* Day Number with Today Indicator */}
                    <span className={`font-medium ${
                      day.isToday
                        ? darkMode 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-blue-600 text-white'
                        : darkMode 
                          ? 'text-white' 
                          : 'text-gray-700'
                    } ${day.isToday ? 'w-6 h-6 flex items-center justify-center rounded-full' : ''}`}>
                      {day.day}
                    </span>
                    
                    {/* Appointment Count Badge */}
                    {day.hasAppointments && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        darkMode
                          ? 'bg-primary-dark/30 text-primary-light'
                          : 'bg-primary-light text-primary'
                      }`}>
                        {day.appointments.length}
                      </span>
                    )}
                  </div>
                  
                  {/* Appointment Dots or List */}
                  <div className="space-y-1 max-h-[80px] overflow-y-auto scrollbar-thin">
                    {day.appointments.slice(0, 3).map((apt, idx) => (
                      <div 
                        key={idx}
                        className={`text-xs p-1 rounded truncate ${
                          apt.cancelled
                            ? darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'
                            : apt.isCompleted
                              ? darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700'
                              : darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                        }`}
                        title={`${apt.userData?.name || 'Customer'} - ${apt.slotTime || 'N/A'} - ${apt.service || 'Service'}`}
                      >
                        {apt.slotTime} - {apt.userData?.name?.split(' ')[0] || 'Customer'}
                      </div>
                    ))}
                     {day.appointments.length > 3 && (
                      <div className={`text-xs text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        +{day.appointments.length - 3} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        
        {/* Daily Appointments List */}
       {selectedDate && (
                <div className={`mt-4 rounded-lg border ${
                  darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                } overflow-hidden`}>
                  <div className={`px-4 py-3 flex justify-between items-center ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                  } border-b`}>
                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Appointments for {new Date(selectedDate).getDate()} {months[new Date(selectedDate).getMonth()]}
                    </h3>
                    <button 
                      onClick={() => setSelectedDate(null)}
                      className={`p-1 rounded-full ${
                        darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[300px] p-2">
                    {filteredAppointments.length === 0 ? (
                      <div className={`py-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <p>No appointments found for this day</p>
                      </div>
                    ) : (
                      <div className="space-y-2 p-2">
                        {filteredAppointments.map((appointment, index) => (
                          <div 
                            key={index}
                            className={`p-3 rounded-lg ${
                              darkMode 
                                ? 'bg-gray-700 hover:bg-gray-600' 
                                : 'bg-gray-50 hover:bg-gray-100'
                            } flex items-center justify-between transition-colors cursor-pointer`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {appointment.userData?.image ? (
                                  <img 
                                    src={appointment.userData.image}
                                    alt={appointment.userData.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    darkMode ? 'bg-gray-600 text-gray-300' : 'bg-primary/10 text-primary'
                                  }`}>
                                    {appointment.userData?.name?.charAt(0) || '?'}
                                  </div>
                                )}
                                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-1 ${
                                  darkMode ? 'ring-gray-700' : 'ring-white'
                                } ${
                                  appointment.cancelled ? 'bg-red-500' : 
                                  appointment.isCompleted ? 'bg-green-500' :
                                  isAppointmentTimePast(appointment) ? 'bg-amber-500' : 'bg-blue-500'
                                }`}></span>
                              </div>
                              
                              <div className="min-w-0">
                                <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                  {appointment.userData?.name || 'Customer'}
                                </p>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                    {appointment.slotTime}
                                  </span>
                                  <span className="truncate max-w-[120px]">
                                    {appointment.service || appointment.docData?.speciality || 'Service'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <StatusBadge appointment={appointment} />
                              
                              {!appointment.cancelled && (
                                <div className="flex gap-1">
                                  {appointment.isCompleted ? (
                                    <button 
                                      onClick={() => handleUndoCompleted(appointment._id)}
                                      className={`p-1 rounded ${
                                        darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50'
                                      }`}
                                    >
                                      <RotateCcw size={16} className={darkMode ? 'text-blue-400' : 'text-blue-500'} />
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => handleMarkCompleted(appointment._id)}
                                      className={`p-1 rounded ${
                                        darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50'
                                      }`}
                                    >
                                      <CheckCircle size={16} className={darkMode ? 'text-green-400' : 'text-green-500'} />
                                    </button>
                                  )}
                                  
                                  <button 
                                    onClick={() => handleDeleteConfirmation(appointment)}
                                    className={`p-1 rounded ${
                                      darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-white hover:bg-gray-50'
                                    }`}
                                  >
                                    <Trash2 size={16} className={darkMode ? 'text-red-400' : 'text-red-500'} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        };
      

  return (
    <div className={`w-full max-w-7xl mx-auto p-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl shadow-sm border overflow-hidden`}>
        {/* Header */}
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Salon Appointments</h1>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Manage all customer styling appointments</p>
          </div>
          
          {/* Header Actions */}
          <div className="flex flex-wrap gap-3">
            {/* View Mode Switcher */}
            <div className={`border ${darkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'} rounded-lg p-1 flex items-center`}>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <LayoutList size={18} />
              </button>
              {/* <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md text-sm transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white'
                    : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <LayoutGrid size={18} />
              </button> */}
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-md text-sm transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-primary text-white'
                    : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <CalendarIcon size={18} />
              </button>
            </div>
            
            {/* Filter Button - Mobile */}
            <div className="relative md:hidden">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                data-filter-toggle
                className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={16} />
                <span>Filters</span>
              </button>
            </div>
            
            {/* Export Button */}
            <button
              onClick={exportToExcel}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' 
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            
            
            
          </div>
        </div>
        
        {/* Main Content Area with Filters */}
        <div className="flex flex-col md:flex-row">
          {/* Filter Sidebar - Desktop */}
          <div className={`hidden md:block w-64 p-4 border-r ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="space-y-6">
              {/* Status Filter */}
              <div>
                <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Status</h3>
                <div className="space-y-2">
                  {['all', 'upcoming', 'completed', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        filterStatus === status
                          ? 'bg-primary text-white'
                          : darkMode 
                            ? 'text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Payment Filter */}
              <div>
                <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Payment</h3>
                <div className="space-y-2">
                                    {['all', 'paid', 'unpaid'].map(payment => (
                    <button
                      key={payment}
                      onClick={() => setFilterPayment(payment)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        filterPayment === payment
                          ? 'bg-primary text-white'
                          : darkMode 
                            ? 'text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {payment.charAt(0).toUpperCase() + payment.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Date Range Filter */}
              <div>
                <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Date Range</h3>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-md text-sm border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-md text-sm border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    />
                  </div>
                </div>
              </div>
              
              {/* Sort Filter */}
              <div>
                <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Sort By</h3>
                <div className="space-y-2">
                  {[
                    { value: 'date-desc', label: 'Date (Newest)' },
                    { value: 'date-asc', label: 'Date (Oldest)' },
                    { value: 'price-desc', label: 'Price (High to Low)' },
                    { value: 'price-asc', label: 'Price (Low to High)' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSortBy(option.value)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        sortBy === option.value
                          ? 'bg-primary text-white'
                          : darkMode 
                            ? 'text-gray-300 hover:bg-gray-700' 
                            : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Clear Filters Button */}
              <div>
                <button
                  onClick={clearFilters}
                  className={`w-full px-3 py-2 rounded-md text-sm border ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile Filter Panel - Only shown when showFilterPanel is true */}
          <AnimatePresence>
            {showFilterPanel && (
              <motion.div 
                ref={filterPanelRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className={`md:hidden absolute top-[220px] left-4 right-4 z-20 p-4 rounded-lg shadow-lg ${
                  darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Filter Appointments
                  </h3>
                  <button 
                    onClick={() => setShowFilterPanel(false)}
                    className={`p-1 rounded-full ${
                      darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                    }`}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Status Filter */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Status
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['all', 'upcoming', 'completed', 'cancelled'].map(status => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status)}
                          className={`px-3 py-2 rounded-md text-sm transition-colors ${
                            filterStatus === status
                              ? 'bg-primary text-white'
                              : darkMode 
                                ? 'bg-gray-700 text-gray-300' 
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Payment Filter */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Payment
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['all', 'paid', 'unpaid'].map(payment => (
                        <button
                          key={payment}
                          onClick={() => setFilterPayment(payment)}
                          className={`px-3 py-2 rounded-md text-sm transition-colors ${
                            filterPayment === payment
                              ? 'bg-primary text-white'
                              : darkMode 
                                ? 'bg-gray-700 text-gray-300' 
                                : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {payment.charAt(0).toUpperCase() + payment.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Date Range Filter */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`w-full px-3 py-2 rounded-md text-sm border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`w-full px-3 py-2 rounded-md text-sm border ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-800'
                        }`}
                      />
                    </div>
                  </div>
                  
                  {/* Sort Filter */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Sort By
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`w-full px-3 py-2 rounded-md text-sm border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-800'
                      }`}
                    >
                      <option value="date-desc">Date (Newest)</option>
                      <option value="date-asc">Date (Oldest)</option>
                      <option value="price-desc">Price (High to Low)</option>
                      <option value="price-asc">Price (Low to High)</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={clearFilters}
                      className={`flex-1 px-3 py-2 rounded-md text-sm border ${
                        darkMode 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Clear
                    </button>
                    
                    <button
                      onClick={() => setShowFilterPanel(false)}
                      className="flex-1 px-3 py-2 rounded-md text-sm bg-primary text-white hover:bg-primary-dark"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Search Bar and Filter Summary */}
            <div className={`p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex flex-col sm:flex-row items-stretch sm:items-center gap-3`}>
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} size={18} />
                <input
                  type="text"
                  placeholder="Search by name, phone, service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
                  }`}
                />
              </div>
              
              {/* Filter Summary */}
              <div className={`text-sm hidden sm:flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {(filterStatus !== 'all' || filterPayment !== 'all' || startDate || endDate) && (
                  <>
                    <SlidersHorizontal size={16} />
                    <span>Filters:</span>
                    
                    {filterStatus !== 'all' && (
                      <span className={`px-2 py-0.5 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                      </span>
                    )}
                    
                    {filterPayment !== 'all' && (
                      <span className={`px-2 py-0.5 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        {filterPayment.charAt(0).toUpperCase() + filterPayment.slice(1)}
                      </span>
                    )}
                    
                    {(startDate || endDate) && (
                      <span className={`px-2 py-0.5 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        Date Range
                      </span>
                    )}
                    
                    <button 
                      onClick={clearFilters}
                      className="text-primary hover:text-primary-dark ml-2"
                    >
                      Clear All
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Content Area */}
            {appointmentsLoading ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                  <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading appointments...</p>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                {/* Render the appropriate view based on viewMode */}
                {viewMode === 'grid' && renderGridView()}
                {viewMode === 'list' && renderListView()}
                {viewMode === 'calendar' && renderCalendarView()}
                
                {/* Pagination - Only show for list and grid views */}
                {viewMode !== 'calendar' && totalPages > 1 && (
                  <div className={`px-6 py-4 border-t flex items-center justify-between ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedAppointments.length)} of {sortedAppointments.length} appointments
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md ${
                          currentPage === 1
                            ? darkMode ? 'text-gray-600' : 'text-gray-400'
                            : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronsLeft size={16} />
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`p-2 rounded-md ${
                          currentPage === 1
                            ? darkMode ? 'text-gray-600' : 'text-gray-400'
                            : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      {/* Page Number Buttons */}
                      <div className="flex">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Logic to show current page in the middle if possible
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${
                                currentPage === pageNum
                                  ? 'bg-primary text-white'
                                  : darkMode
                                    ? 'text-gray-300 hover:bg-gray-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-md ${
                          currentPage === totalPages
                            ? darkMode ? 'text-gray-600' : 'text-gray-400'
                            : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronRight size={16} />
                      </button>
                      
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`p-2 rounded-md ${
                          currentPage === totalPages
                            ? darkMode ? 'text-gray-600' : 'text-gray-400'
                            : darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <ChevronsRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowDeleteModal(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20 }}
              className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } rounded-xl border p-6 z-50 w-full max-w-md shadow-xl`}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-full mb-4 ${
                  darkMode ? 'bg-red-900/30 text-red-500' : 'bg-red-100 text-red-500'
                }`}>
                  <XCircle size={28} />
                </div>
                
                <h3 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Cancel Appointment
                </h3>
                
                <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Are you sure you want to cancel the appointment for{' '}
                  <span className="font-medium">{appointmentToDelete?.userData?.name || 'this customer'}</span>?
                  This action cannot be undone.
                </p>
                
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className={`flex-1 py-2 px-4 rounded-lg border ${
                      darkMode 
                        ? 'border-gray-700 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    No, Keep It
                  </button>
                  
                  <button
                    onClick={handleDeleteConfirmed}
                    className="flex-1 py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    Yes, Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
  
}

export default AllAppointments;
