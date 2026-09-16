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
  Scissors 
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { AnimatePresence, motion } from 'framer-motion'

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
  
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  
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
    } else {
    }
  }, [aToken]);
  
  // Debug log when appointments change
  useEffect(() => {
  }, [appointments]);
  
  // Update local appointments when server data changes
  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);
  
  // Clear all filters
  const clearFilters = () => {
    setFilterStatus('all')
    setFilterPayment('all')
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
    setSortBy('date-desc')
  }
  
 // Function to format the date, handling both ISO and custom formats
const slotDateFormat = (slotDate) => {
  if (!slotDate) return 'Invalid Date';
  
  // Check if date is in DD_MM_YYYY format
  if (slotDate.includes('_')) {
    const dateArray = slotDate.split('_');
    if (dateArray.length !== 3) return 'Invalid Date';
    
    const day = dateArray[0];
    const month = Number(dateArray[1]) - 1; // JavaScript months are 0-indexed
    const year = dateArray[2];
    
    // Make sure month is in valid range
    if (month < 0 || month > 11) return 'Invalid Date';
    
    return `${day} ${months[month]} ${year}`;
  }
  
  // Handle ISO format (YYYY-MM-DD)
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
  
  // Helper function to parse date strings in both ISO and DD_MM_YYYY formats
const parseDateString = (dateStr) => {
  if (!dateStr) return new Date(NaN); // Invalid date
  
  // Check if date is in DD_MM_YYYY format
  if (dateStr.includes('_')) {
    const [day, month, year] = dateStr.split('_').map(Number);
    // Month is 0-indexed in JavaScript Date, so we subtract 1 from month
    return new Date(year, month - 1, day);
  }
  
  // Otherwise assume it's a standard date string (ISO or similar)
  return new Date(dateStr);
};
  
  // Check if appointment time is past
  const isAppointmentTimePast = (appointment) => {
    if (!appointment || !appointment.slotDate || !appointment.slotTime) return false;
    
    const appointmentDate = parseDateString(appointment.slotDate);
    
    // Parse time (e.g., "10:00 AM")
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
      
      // Add 30 minutes buffer time (appointment duration)
      appointmentDate.setMinutes(appointmentDate.getMinutes() + 30);
      
      return new Date() > appointmentDate;
    }
    
    return false;
  }
  
  // Filter appointments based on status, payment status, search term, and date range
  const filteredAppointments = localAppointments.filter(appointment => {
  // Status filter - MUST be mutually exclusive
  const matchesStatus = 
    filterStatus === 'all' ||
    (filterStatus === 'upcoming' && !appointment.isCompleted && !appointment.cancelled) ||
    (filterStatus === 'completed' && appointment.isCompleted && !appointment.cancelled) ||  // ✅ Fixed: exclude cancelled
    (filterStatus === 'cancelled' && appointment.cancelled);  // ✅ Cancelled takes precedence
  
  // Payment filter
  const matchesPayment = 
    filterPayment === 'all' ||
    (filterPayment === 'paid' && appointment.payment) ||
    (filterPayment === 'unpaid' && !appointment.payment);
  
  // Search filter
  const searchString = [
    appointment.userData?.name || '',
    appointment.userData?.phone || '',
    appointment.docData?.name || '',
    appointment.service || '',
    appointment.docData?.specialty || appointment.docData?.speciality || ''
  ].map(s => s.toLowerCase()).join(' ');
  
  const matchesSearch = !searchTerm || searchString.includes(searchTerm.toLowerCase());
  
  // Date filter
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
  
  return matchesStatus && matchesPayment && matchesSearch && matchesDateRange;
});
  
  // Sort appointments
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = parseDateString(a.slotDate);
    const dateB = parseDateString(b.slotDate);
    
    // Handle invalid dates
    if (isNaN(dateA) && isNaN(dateB)) return 0;
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    
    if (sortBy === 'date-asc') return dateA - dateB;
    if (sortBy === 'date-desc') return dateB - dateA;
    if (sortBy === 'price-asc') return (a.amount || 0) - (b.amount || 0);
    if (sortBy === 'price-desc') return (b.amount || 0) - (a.amount || 0);
    return 0;
  });
  
  
  // Handle mark as completed with local state update
  const handleMarkCompleted = (id) => {
    // Update local state immediately for better UX
    setLocalAppointments(prev => 
      prev.map(app => 
        app._id === id ? {...app, isCompleted: true} : app
      )
    );
    
    // Also switch to completed tab to show the newly completed appointment
    setFilterStatus('completed');
    
    // Then update server
    markAppointmentCompleted(id);
  }
  
  // Handle undo completed with local state update
  const handleUndoCompleted = (id) => {
    // Update local state immediately for better UX
    setLocalAppointments(prev => 
      prev.map(app => 
        app._id === id ? {...app, isCompleted: false} : app
      )
    );
    
    // Also switch to upcoming tab 
    setFilterStatus('upcoming');
    
    // Then update server
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
      // Update local state immediately for better UX
      setLocalAppointments(prev => 
        prev.map(app => 
          app._id === appointmentToDelete._id ? {...app, cancelled: true} : app
        )
      );
      
      // Also switch to cancelled tab to show the cancelled appointment
      setFilterStatus('cancelled');
      
      // Then update server
      cancelAppointment(appointmentToDelete._id);
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
    }
  }
  
  // Status badge component
  const StatusBadge = ({ appointment }) => {
    // Check if appointment time is past and it's not marked as completed or cancelled
    const isPastAndUnhandled = !appointment.isCompleted && !appointment.cancelled && isAppointmentTimePast(appointment);
    
    if (appointment.cancelled) {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
          <XCircle size={12} />
          Cancelled
        </span>
      )
    } else if (appointment.isCompleted) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle size={12} />
          Completed
        </span>
      )
    } else if (isPastAndUnhandled) {
      return (
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
          <AlertCircle size={12} />
          Overdue
        </span>
      )
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      const apptDate = parseDateString(appointment.slotDate);
      apptDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      if (apptDate.getTime() === today.getTime()) {
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
            <Calendar size={12} />
            Today
          </span>
        )
      } else {
        return (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
            <Calendar size={12} />
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
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
          <IndianRupee size={12} />
          Paid
        </span>
      )
    } else {
      return (
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
          <AlertTriangle size={12} />
          Unpaid
        </span>
      )
    }
  }

  // Format date for Excel export (from DD_MM_YYYY to a more readable format)
  const formatDateForExport = (dateStr) => {
    return slotDateFormat(dateStr) || dateStr;
  }

  // Manual refresh function for debugging
  const manualRefresh = () => {
    console.log('Manual refresh triggered');
    getAllAppointments();
  };

  return (
    <div className='w-full max-w-7xl mx-auto p-4'>
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Salon Appointments</h1>
            <p className="text-gray-500 mt-1">Manage all customer styling appointments</p>
          </div>
          
          <div className="flex gap-3">
            {/* Debug refresh button */}
            <button
              onClick={manualRefresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Refresh Data
            </button>
            
            <button
              onClick={() => {
                if (!sortedAppointments || sortedAppointments.length === 0) {
                  alert('No appointment data available')
                  return
                }

                // Convert appointments to worksheet with formatted data
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
                )

                // Create workbook
                const workbook = XLSX.utils.book_new()
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments')

                // Export file
                XLSX.writeFile(workbook, 'Salon_Appointments.xlsx')
              }}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Download size={16} />
              Export Excel
            </button>
          </div>

        </div>
        
        {/* Filters Row */}
        <div className="p-4 border-b bg-gray-50 flex flex-col gap-4">
          {/* Status and Search */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left side - Filter tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 mr-1 flex items-center">
                <Filter size={15} className="mr-1" /> Status:
              </span>
              <div className="flex items-center space-x-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    filterStatus === 'all' 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterStatus('upcoming')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    filterStatus === 'upcoming' 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Upcoming
                </button>
                <button 
                  onClick={() => setFilterStatus('completed')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    filterStatus === 'completed' 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Completed
                </button>
                <button 
                  onClick={() => setFilterStatus('cancelled')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    filterStatus === 'cancelled' 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>
            
            {/* Payment Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 mr-1 flex items-center">
                <IndianRupee size={15} className="mr-1" /> Payment:
              </span>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setFilterPayment('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    filterPayment === 'all' 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterPayment('paid')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    filterPayment === 'paid' 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Paid
                </button>
                <button 
                  onClick={() => setFilterPayment('unpaid')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    filterPayment === 'unpaid' 
                      ? 'bg-primary text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Unpaid
                </button>
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by customer, stylist, service, or phone number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-9 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
            />
            
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={18} />
              </button>
            )}
          </div>
          
          {/* Date range and sorting */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-500" />
                <span className="text-sm text-gray-600 whitespace-nowrap">Date Range:</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border rounded-lg p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-gray-500">to</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border rounded-lg p-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              
              {(startDate || endDate || searchTerm || filterStatus !== 'all' || filterPayment !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="text-primary hover:text-primary/80 text-sm flex items-center gap-1"
                >
                  <XCircle size={16} />
                  Clear filters
                </button>
              )}
            </div>
            
            <div>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Table Container */}
        <div className="overflow-x-auto">
          {appointmentsLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-gray-500">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
              <p className="mt-4">Loading appointments...</p>
            </div>
          ) : sortedAppointments.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-gray-500">
              <Calendar size={48} className="text-gray-300 mb-4" />
              <p>No appointments found</p>
              <p className="text-sm mt-2">Try changing your filters or search term</p>
              {localAppointments.length === 0 && (
                <div className="mt-4 p-4 bg-amber-50 text-amber-800 rounded-lg max-w-md text-center">
                  <AlertTriangle size={20} className="inline-block mb-2" />
                  <p className="text-sm">No appointments data loaded from server.</p>
                  <button
                    onClick={manualRefresh}
                    className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
                  >
                    Try Reloading Data
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Phone
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Stylist
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAppointments.map((appointment, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    
                    {/* Customer */}
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
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                              {appointment.userData?.name?.charAt(0) || '?'}
                            </div>
                          )}
                          
                          <span className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                            appointment.cancelled ? 'bg-red-400' : 
                            appointment.isCompleted ? 'bg-green-400' :
                            isAppointmentTimePast(appointment) ? 'bg-amber-400' : 'bg-blue-400'
                          }`}></span>
                        </div>
                        
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.userData?.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="text-sm text-gray-900">
                        {appointment.userData?.phone || "N/A"}
                      </div>
                    </td>

                    {/* Stylist */}
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {appointment.docData?.image ? (
                            <img 
                              className="h-8 w-8 rounded-full object-cover border border-gray-200" 
                              src={appointment.docData.image} 
                              alt={appointment.docData.name}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                              <Scissors size={12} />
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.docData?.name || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Service */}
                    <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                      <div className="text-sm text-gray-900">
                        {appointment.service || appointment.docData?.specialty || appointment.docData?.speciality || "N/A"}
                      </div>
                    </td>
                    
                    {/* Date & Time */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {slotDateFormat(appointment.slotDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {appointment.slotTime || "N/A"}
                      </div>
                    </td>                  
                    
                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge appointment={appointment} />
                    </td>
                    
                    {/* Payment Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentStatusBadge appointment={appointment} />
                    </td>
                    
                    {/* Price */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {currency}{appointment.amount || appointment.price || 0}
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-3">
                        {/* Complete/Undo Button */}
                        {!appointment.cancelled && (
                          appointment.isCompleted ? (
                            <button 
                              onClick={() => handleUndoCompleted(appointment._id)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Undo completion"
                            >
                              <RotateCcw size={18} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleMarkCompleted(appointment._id)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Mark as completed"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )
                        )}
                        
                        {/* Cancel Button - Only show for non-cancelled appointments */}
                        {!appointment.cancelled && (
                          <button 
                            onClick={() => handleDeleteConfirmation(appointment)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Cancel appointment"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer with counts */}
        <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row gap-3 justify-between items-center text-sm text-gray-500">
          <div>
            Showing {sortedAppointments.length} of {localAppointments.length} total appointments
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-purple-100 rounded-full"></span>
              <span>Upcoming: {localAppointments.filter(a => !a.isCompleted && !a.cancelled && !isAppointmentTimePast(a)).length}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-amber-100 rounded-full"></span>
              <span>Overdue: {localAppointments.filter(a => !a.isCompleted && !a.cancelled && isAppointmentTimePast(a)).length}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-100 rounded-full"></span>
              <span>Completed: {localAppointments.filter(a => a.isCompleted).length}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-100 rounded-full"></span>
              <span>Cancelled: {localAppointments.filter(a => a.cancelled).length}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
            >
              <div className="mb-6 text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                  <AlertTriangle size={30} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Appointment</h3>
                <p className="text-gray-500">
                                   Are you sure you want to cancel the appointment for <span className="font-medium text-gray-700">{appointmentToDelete?.userData?.name}</span> on <span className="font-medium text-gray-700">{slotDateFormat(appointmentToDelete?.slotDate)} at {appointmentToDelete?.slotTime}</span>?
                </p>
              </div>
              
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex-1 flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  <span>No, Keep It</span>
                </button>
                <button
                  onClick={handleDeleteConfirmed}
                  className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex-1 flex items-center justify-center gap-2"
                >
                  <Check size={16} />
                  <span>Yes, Cancel</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
     
    </div>
  );
};

export default AllAppointments;
