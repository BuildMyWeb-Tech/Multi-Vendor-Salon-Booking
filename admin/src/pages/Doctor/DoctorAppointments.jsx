import React, { useContext, useEffect, useState, useRef } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Download,
  Calendar,
  Clock,
  User,
  Phone,
  CreditCard,
  Filter,
  Search,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  RotateCcw,
  CheckCircle,
  Scissors
} from 'lucide-react'
import { toast } from 'react-toastify'
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import * as XLSX from 'xlsx'

const DoctorAppointments = () => {
  const { 
    dToken, 
    appointments: allAppointments, 
    getAppointments, 
    cancelAppointment, 
    completeAppointment, 
    undoCompletedAppointment 
  } = useContext(DoctorContext)
  
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext)
  
  const [appointments, setAppointments] = useState([])
  const [localAppointments, setLocalAppointments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null })
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [cancelConfirmation, setCancelConfirmation] = useState({ show: false, id: null, name: '', date: '', time: '' })
  const [sortOrder, setSortOrder] = useState('newest')
  const [appointmentsLoading, setAppointmentsLoading] = useState(true)
  const exportRef = useRef(null)
  const datePickerRef = useRef(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Quick filter dates
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  useEffect(() => {
    if (dToken) {
      setAppointmentsLoading(true)
      getAppointments()
        .then(data => {
          setAppointmentsLoading(false)
        })
        .catch(err => {
          setAppointmentsLoading(false)
          toast.error("Failed to load appointments")
        })
    }
  }, [dToken])
  
  useEffect(() => {
    if (allAppointments) {
      setLocalAppointments(allAppointments)
    }
  }, [allAppointments])
  
  useEffect(() => {
    filterAppointments()
  }, [localAppointments, filterStatus, searchTerm, dateRange, sortOrder])
  
  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setShowExportDropdown(false)
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  const isAppointmentTimePast = (appointment) => {
    if (!appointment.slotDate) return false
    const appointmentDateTime = new Date(`${appointment.slotDate} ${appointment.slotTime}`)
    return appointmentDateTime < new Date()
  }
  
  const filterAppointments = () => {
    if (!localAppointments || localAppointments.length === 0) {
      setAppointments([])
      return
    }
    
    let filtered = [...localAppointments]
    
    // Apply status filter
    if (filterStatus === 'today') {
      const todayDate = new Date().toDateString()
      filtered = filtered.filter(a => new Date(a.slotDate).toDateString() === todayDate)
    } else if (filterStatus === 'upcoming') {
      filtered = filtered.filter(a => !a.cancelled && !a.isCompleted)
    } else if (filterStatus === 'completed') {
      filtered = filtered.filter(a => a.isCompleted)
    } else if (filterStatus === 'cancelled') {
      filtered = filtered.filter(a => a.cancelled)
    }
    
    // Apply date range filter
    if (dateRange.startDate && dateRange.endDate) {
      filtered = filtered.filter(a => {
        const appointmentDate = new Date(a.slotDate)
        return appointmentDate >= dateRange.startDate && appointmentDate <= dateRange.endDate
      })
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(a => 
        (a.userData?.name || '').toLowerCase().includes(term) ||
        (a.userData?.phone || '').toLowerCase().includes(term) ||
        (a.service || '').toLowerCase().includes(term)
      )
    }
    
    // Apply sorting
    if (sortOrder === 'newest') {
      filtered.sort((a, b) => new Date(b.slotDate) - new Date(a.slotDate))
    } else if (sortOrder === 'oldest') {
      filtered.sort((a, b) => new Date(a.slotDate) - new Date(b.slotDate))
    } else if (sortOrder === 'price-high') {
      filtered.sort((a, b) => (b.amount || 0) - (a.amount || 0))
    } else if (sortOrder === 'price-low') {
      filtered.sort((a, b) => (a.amount || 0) - (b.amount || 0))
    }
    
    setAppointments(filtered)
  }
  
  // Calculate statistics
  const stats = {
    upcoming: localAppointments?.filter(a => !a.cancelled && !a.isCompleted).length || 0,
    completed: localAppointments?.filter(a => a.isCompleted).length || 0,
    cancelled: localAppointments?.filter(a => a.cancelled).length || 0,
    overdue: localAppointments?.filter(a => !a.cancelled && !a.isCompleted && isAppointmentTimePast(a)).length || 0
  }
  
  const refreshPage = () => {
    setAppointmentsLoading(true)
    getAppointments()
      .then(() => {
        setAppointmentsLoading(false)
        toast.success("Appointments refreshed")
      })
      .catch(err => {
        setAppointmentsLoading(false)
        toast.error("Failed to refresh appointments")
      })
  }
  
  // Call phone number
  const callPhoneNumber = (phoneNumber) => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
      toast.info(`Calling ${phoneNumber}...`);
    } else {
      toast.error('Phone number not available');
    }
  };
  
  const getFileDate = () => {
    const d = new Date();
    return d.toISOString().split("T")[0]; // 2026-02-10
  };

  const getFullDateTime = () => {
    return new Date().toLocaleString();
  };


  const exportToPDF = () => {
    try {
      toast.info("Generating PDF export...");

      const doc = new jsPDF("l", "pt", "A4");

      const downloadDate = getFullDateTime();

      // Title
      doc.setFontSize(18);
      doc.text("Stylist Appointments Report", 40, 40);

      // Download Date
      doc.setFontSize(10);
      doc.text(`Downloaded on: ${downloadDate}`, 40, 60);

      // Table Columns
      const tableColumn = ["#", "Customer", "Phone", "Date & Time", "Amount", "Status"];

      // Table Rows
      const tableRows = appointments.map((item, index) => [
        index + 1,
        item.userData?.name || "N/A",
        item.userData?.phone || "N/A",
        `${slotDateFormat(item.slotDate)} ${item.slotTime}`,
        `${currency}${item.amount || 0}`,
        item.cancelled ? "Cancelled" : item.isCompleted ? "Completed" : "Upcoming"
      ]);

      // Add Table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: "grid",
        styles: { fontSize: 9 },
        headStyles: { fillColor: [0, 102, 204], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });

      // Save PDF with date filename
      doc.save(`stylist-appointments-${getFileDate()}.pdf`);

      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to export PDF");
    }
  };

  const exportToExcel = () => {
    try {
      toast.info("Generating Excel export...");

      const downloadDate = getFullDateTime();

      const excelData = appointments.map((item, index) => ({
        "#": index + 1,
        "Customer Name": item.userData?.name || "N/A",
        "Phone Number": item.userData?.phone || "N/A",
        "Date": slotDateFormat(item.slotDate) || "N/A",
        "Time": item.slotTime || "N/A",
        "Age": item.userData?.dob ? `${calculateAge(item.userData.dob)} yrs` : "N/A",
        "Amount": `${currency}${item.amount || 0}`,
        "Payment Status": item.payment ? "Paid" : "Pending",
        "Appointment Status": item.cancelled ? "Cancelled" : item.isCompleted ? "Completed" : "Upcoming"
      }));

      // Add top row date
      const worksheet = XLSX.utils.aoa_to_sheet([
        [`Downloaded on: ${downloadDate}`],
        [],
        Object.keys(excelData[0]), // headers
        ...excelData.map(Object.values)
      ]);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Appointments");

      // Column Widths
      worksheet["!cols"] = [
        { wch: 5 },
        { wch: 20 },
        { wch: 15 },
        { wch: 12 },
        { wch: 10 },
        { wch: 8 },
        { wch: 10 },
        { wch: 15 },
        { wch: 18 }
      ];

      // Save Excel
      XLSX.writeFile(workbook, `stylist-appointments-${getFileDate()}.xlsx`);

      toast.success("Excel file exported successfully!");
    } catch (error) {
      console.error("Excel Export Error:", error);
      toast.error("Failed to export Excel file");
    }
  };



  
  const handleExport = (format) => {
    if (format === 'PDF') {
      exportToPDF();
    } else if (format === 'Excel') {
      exportToExcel();
    }
    setShowExportDropdown(false);
  };
  
  // Handlers for appointment status changes
  const handleMarkCompleted = (id) => {
    // Optimistically update local state
    setLocalAppointments(prev => 
      prev.map(app => 
        app._id === id ? {...app, isCompleted: true} : app
      )
    );
    
    // Call API
    completeAppointment(id)
      .then(() => {
        toast.success("Appointment marked as completed");
      })
      .catch(error => {
        toast.error("Failed to update appointment status");
        // Revert the local state change if API call fails
        setLocalAppointments(prev => 
          prev.map(app => 
            app._id === id ? {...app, isCompleted: false} : app
          )
        );
      });
  }
  
  const handleUndoCompleted = (id) => {
    // Optimistically update local state
    setLocalAppointments(prev => 
      prev.map(app => 
        app._id === id ? {...app, isCompleted: false} : app
      )
    );
    
    // Call API
    undoCompletedAppointment(id)
      .then(() => {
        toast.success("Appointment marked as upcoming");
      })
      .catch(error => {
        toast.error("Failed to update appointment status");
        // Revert the local state change if API call fails
        setLocalAppointments(prev => 
          prev.map(app => 
            app._id === id ? {...app, isCompleted: true} : app
          )
        );
      });
  }
  
  const handleCancelClick = (appointment) => {
    setCancelConfirmation({
      show: true, 
      id: appointment._id,
      name: appointment.userData?.name || 'this customer',
      date: slotDateFormat(appointment.slotDate),
      time: appointment.slotTime
    })
  }
  
  const confirmCancel = () => {
    if (cancelConfirmation.id) {
      // Optimistically update local state
      setLocalAppointments(prev => 
        prev.map(app => 
          app._id === cancelConfirmation.id ? {...app, cancelled: true} : app
        )
      );
      
      // Call API
      cancelAppointment(cancelConfirmation.id)
        .then(() => {
          toast.success("Appointment cancelled successfully");
        })
        .catch(error => {
          toast.error("Failed to cancel appointment");
          // Revert the local state change if API call fails
          setLocalAppointments(prev => 
            prev.map(app => 
              app._id === cancelConfirmation.id ? {...app, cancelled: false} : app
            )
          );
        });
      
      setCancelConfirmation({ show: false, id: null, name: '', date: '', time: '' });
    }
  }
  
  // Date picker functionality
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay()
  }
  
  const handleDateSelection = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    
    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      // Start new selection
      setDateRange({ startDate: selectedDate, endDate: null })
    } else {
      // Complete the range
      if (selectedDate < dateRange.startDate) {
        setDateRange({ startDate: selectedDate, endDate: dateRange.startDate })
      } else {
        setDateRange({ ...dateRange, endDate: selectedDate })
      }
    }
  }
  
  const applyDateRange = () => {
    setShowDatePicker(false)
    // If we have a complete range, we apply the filter
    if (dateRange.startDate && dateRange.endDate) {
      filterAppointments()
    }
  }
  
  const clearDateRange = () => {
    setDateRange({ startDate: null, endDate: null })
  }
  
  const applyQuickFilter = (filter) => {
    switch(filter) {
      case 'today':
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        setDateRange({ startDate: today, endDate: today })
        break
      case 'yesterday':
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        setDateRange({ startDate: yesterday, endDate: yesterday })
        break
      case 'last7':
        const last7Start = new Date()
        last7Start.setDate(last7Start.getDate() - 7)
        last7Start.setHours(0, 0, 0, 0)
        const last7End = new Date()
        last7End.setHours(23, 59, 59, 999)
        setDateRange({ startDate: last7Start, endDate: last7End })
        break
      case 'last30':
        const last30Start = new Date()
        last30Start.setDate(last30Start.getDate() - 30)
        last30Start.setHours(0, 0, 0, 0)
        const last30End = new Date()
        last30End.setHours(23, 59, 59, 999)
        setDateRange({ startDate: last30Start, endDate: last30End })
        break
    }
  }
  
  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }
  
  const renderCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const daysInMonth = getDaysInMonth(year, month)
    const firstDayOfMonth = getFirstDayOfMonth(year, month)
    
    const monthName = currentMonth.toLocaleString('default', { month: 'long' })
    
    const days = []
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-10 h-10"></div>)
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const isStartDate = dateRange.startDate && date.toDateString() === dateRange.startDate.toDateString()
      const isEndDate = dateRange.endDate && date.toDateString() === dateRange.endDate.toDateString()
      const isInRange = dateRange.startDate && dateRange.endDate && 
                        date >= dateRange.startDate && date <= dateRange.endDate
      
      days.push(
        <button 
          key={day}
          onClick={() => handleDateSelection(day)}
          className={`w-10 h-10 rounded-full text-sm flex items-center justify-center transition-all
            ${isStartDate || isEndDate 
              ? 'bg-blue-600 text-white font-bold' 
              : isInRange 
                ? 'bg-blue-100 text-blue-800'
                : 'hover:bg-gray-100'}`}
        >
          {day}
        </button>
      )
    }
    
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={goToPrevMonth} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={20} />
          </button>
          <div className="font-medium">
            {monthName} {year}
          </div>
          <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded-full">
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="w-10 h-10 flex items-center justify-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    )
  }
  
  // Format date to display correctly
  const formatAppointmentDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    // Check if dateString contains "undefined"
    if (dateString.includes('undefined')) {
      const datePart = dateString.split(' ')[0]; // Extract date part
      if (datePart) {
        try {
          const date = new Date(datePart);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString();
          }
        } catch (e) {
          console.error("Date parsing error:", e);
        }
      }
      return 'N/A';
    }
    
    return slotDateFormat(dateString) || 'N/A';
  }
  
  // Status Badge component
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
          <AlertTriangle size={13} />
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
  
  // Check if there's an active date filter
  const hasDateFilter = dateRange.startDate && dateRange.endDate
  
  return (
    <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
      
      {/* Header Section */}
      <div className='mb-8'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900 mb-2' style={{ fontFamily: "'Inter', sans-serif" }}>
              Stylist Appointments
            </h1>
            <p className='text-sm text-gray-600'>
              Manage all customer hair and beauty appointments
            </p>
          </div>
          
          <div className='flex gap-3'>
            <button 
              onClick={refreshPage}
              className='inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md font-medium text-sm'
            >
              <RefreshCw className='w-4 h-4' />
              Refresh
            </button>
            
            <div className="relative" ref={exportRef}>
              <button 
                className='inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm font-medium text-sm'
                onClick={() => setShowExportDropdown(!showExportDropdown)}
              >
                <Download className='w-4 h-4' />
                Export
              </button>
              
              {showExportDropdown && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
                  <button 
                    className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-100"
                    onClick={() => handleExport('PDF')}
                  >
                    <FileText className="w-4 h-4 text-red-500" /> PDF
                  </button>
                  <button 
                    className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                    onClick={() => handleExport('Excel')}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className='flex flex-col sm:flex-row gap-4 mb-6'>
          {/* Status Filters */}
          <div className='flex flex-wrap items-center gap-2'>
            <span className='text-sm font-medium text-gray-700'>Status:</span>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterStatus === 'today' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setFilterStatus('today')}
            >
              Today
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterStatus === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setFilterStatus('upcoming')}
            >
              Upcoming
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterStatus === 'completed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setFilterStatus('completed')}
            >
              Completed
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                filterStatus === 'cancelled' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => setFilterStatus('cancelled')}
            >
              Cancelled
            </button>
          </div>

          {/* Search & Sorting */}
          <div className='flex-1 flex gap-3 flex-wrap sm:flex-nowrap'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by customer, stylist, service or phone..."
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              />
            </div>
            
            <div className="relative" ref={datePickerRef}>
              <button 
                className={`px-4 py-2 border rounded-lg hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-medium ${
                  hasDateFilter ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'
                }`}
                onClick={() => setShowDatePicker(!showDatePicker)}
              >
                <Calendar className='w-4 h-4' />
                {hasDateFilter 
                  ? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
                  : 'Date Range'}
              </button>
              
              {showDatePicker && (
                <div className="absolute z-10 right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 w-[340px]">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Select Date Range</h3>
                      <button 
                        className="p-1 rounded-full hover:bg-gray-100" 
                        onClick={() => setShowDatePicker(false)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    {/* Quick Filters */}
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">Quick Filters</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          className="py-2 px-4 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100 transition-all"
                          onClick={() => applyQuickFilter('today')}
                        >
                          Today
                        </button>
                        <button 
                          className="py-2 px-4 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100 transition-all"
                          onClick={() => applyQuickFilter('yesterday')}
                        >
                          Yesterday
                        </button>
                        <button 
                          className="py-2 px-4 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100 transition-all"
                          onClick={() => applyQuickFilter('last7')}
                        >
                          Last 7 Days
                        </button>
                        <button 
                          className="py-2 px-4 bg-blue-50 text-blue-600 rounded-md text-sm hover:bg-blue-100 transition-all"
                          onClick={() => applyQuickFilter('last30')}
                        >
                          Last 30 Days
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {renderCalendar()}
                  
                  <div className="flex justify-between p-4 border-t border-gray-100">
                    <button
                      className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                      onClick={clearDateRange}
                    >
                      Clear
                    </button>
                    <button
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      onClick={applyDateRange}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <select 
              className='px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
            </select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-purple-50 border border-purple-200 rounded-xl p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-purple-700 text-sm font-medium'>Upcoming</span>
              <Calendar className='w-5 h-5 text-purple-600' />
            </div>
            <div className='text-2xl font-bold text-purple-900'>{stats.upcoming}</div>
          </div>
          
          <div className='bg-orange-50 border border-orange-200 rounded-xl p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-orange-700 text-sm font-medium'>Overdue</span>
              <Clock className='w-5 h-5 text-orange-600' />
            </div>
            <div className='text-2xl font-bold text-orange-900'>{stats.overdue}</div>
          </div>
          
          <div className='bg-green-50 border border-green-200 rounded-xl p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-green-700 text-sm font-medium'>Completed</span>
              <CheckCircle2 className='w-5 h-5 text-green-600' />
            </div>
            <div className='text-2xl font-bold text-green-900'>{stats.completed}</div>
          </div>
          
          <div className='bg-red-50 border border-red-200 rounded-xl p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-red-700 text-sm font-medium'>Cancelled</span>
              <XCircle className='w-5 h-5 text-red-600' />
            </div>
            <div className='text-2xl font-bold text-red-900'>{stats.cancelled}</div>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden'>
        
        {/* Table Header - Desktop */}
        <div className='max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-4 py-4 px-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200'>
          <p className='text-xs font-bold text-gray-700 uppercase tracking-wider'>#</p>
          <p className='text-xs font-bold text-gray-700 uppercase tracking-wider'>Customer Details</p>
          <p className='text-xs font-bold text-gray-700 uppercase tracking-wider'>Payment</p>
          <p className='text-xs font-bold text-gray-700 uppercase tracking-wider'>Age</p>
          <p className='text-xs font-bold text-gray-700 uppercase tracking-wider'>Date & Time</p>
          <p className='text-xs font-bold text-gray-700 uppercase tracking-wider'>Price</p>
          <p className='text-xs font-bold text-gray-700 uppercase tracking-wider'>Actions</p>
        </div>

        {/* Table Body */}
        <div className='max-h-[65vh] overflow-y-auto'>
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
          ) : appointments && appointments.length > 0 ? (
            appointments.map((item, index) => (
              <div 
                className='flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-4 items-center text-gray-700 py-4 px-6 border-b border-gray-100 hover:bg-blue-50/50 transition-all duration-200 group' 
                key={index}
              >
                {/* Index */}
                <p className='max-sm:hidden text-sm font-semibold text-gray-500'>
                  {index + 1}
                </p>
                
                {/* Customer Info */}
                <div className='flex items-center gap-3'>
                  <div className='relative'>
                    <img 
                      src={item.userData?.image || assets.upload_area} 
                      className='w-11 h-11 rounded-full object-cover ring-2 ring-gray-200 group-hover:ring-blue-400 transition-all' 
                      alt="Customer" 
                    />
                    <div className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white'></div>
                  </div>
                  <div>
                    <p className='font-semibold text-gray-900 text-sm mb-0.5'>
                      {item.userData?.name || 'N/A'}
                    </p>
                    <p 
                      className='text-xs text-gray-500 flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-all group'
                      onClick={() => callPhoneNumber(item.userData?.phone)}
                    >
                      <Phone className='w-3 h-3 group-hover:text-blue-600' />
                      {item.userData?.phone || 'No phone'}
                    </p>
                  </div>
                </div>

                {/* Payment Status */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                    item.payment 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-purple-100 text-purple-700 border border-purple-300'
                  }`}>
                    <CreditCard className='w-3 h-3' />
                    {item.payment ? 'Paid' : 'Unpaid'}
                  </span>
                </div>

                {/* Age */}
                <p className='max-sm:hidden text-sm font-medium text-gray-700'>
                  {item.userData?.dob ? `${calculateAge(item.userData.dob)} yrs` : 'N/A'}
                </p>

                {/* Date & Time */}
                <div className='text-sm'>
                  <p className='font-semibold text-gray-900 mb-0.5 flex items-center gap-1.5'>
                    <Calendar className='w-3.5 h-3.5 text-gray-500' />
                    {formatAppointmentDate(item.slotDate)}
                  </p>
                  <p className='text-xs text-gray-600 flex items-center gap-1.5 ml-5'>
                    <Clock className='w-3 h-3 text-gray-400' />
                    {item.slotTime || 'N/A'}
                  </p>
                </div>

                {/* Fee */}
                <p className='font-bold text-gray-900 text-base flex items-center gap-1'>
                  {currency}{item.amount || 0}
                </p>

                {/* Actions */}
                <div className='flex items-center gap-2'>
                  {item.cancelled ? (
                    <span className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-300'>
                      <XCircle className='w-3.5 h-3.5' />
                      Cancelled
                    </span>
                  ) : item.isCompleted ? (
                    <div className='flex gap-2'>
                      <span className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold border border-green-300'>
                        <CheckCircle2 className='w-3.5 h-3.5' />
                        Completed
                      </span>
                      <button
                        onClick={() => handleUndoCompleted(item._id)}
                        className='p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-all hover:scale-110 active:scale-95'
                        title="Undo Completed Status"
                      >
                        <RotateCcw className='w-5 h-5' />
                      </button>
                    </div>
                  ) : (
                    <div className='flex gap-2'>
                      <button
                        onClick={() => handleMarkCompleted(item._id)}
                        className='p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-all hover:scale-110 active:scale-95'
                        title="Mark as Completed"
                      >
                        <CheckCircle2 className='w-5 h-5' />
                      </button>
                      <button
                        onClick={() => handleCancelClick(item)}
                        className='p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-all hover:scale-110 active:scale-95'
                        title="Cancel Appointment"
                      >
                        <XCircle className='w-5 h-5' />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-20 px-4'>
              <div className='inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4'>
                <Calendar className='w-8 h-8 text-gray-400' />
              </div>
              <p className='text-lg font-semibold text-gray-900 mb-2'>No appointments found</p>
              <p className='text-sm text-gray-500'>Appointments will appear here once clients book your services</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {appointments && appointments.length > 0 && (
          <div className='px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4'>
            <div className='text-sm text-gray-600'>
              Showing <span className='font-semibold text-gray-900'>1</span> to{' '}
              <span className='font-semibold text-gray-900'>{Math.min(10, appointments.length)}</span> of{' '}
              <span className='font-semibold text-gray-900'>{appointments.length}</span> total
            </div>

            {/* Status Summary */}
            <div className='flex flex-wrap gap-3 text-xs'>
              <div className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full font-semibold'>
                Upcoming: {stats.upcoming}
              </div>
              <div className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full font-semibold'>
                Overdue: {stats.overdue}
              </div>
              <div className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-semibold'>
                Completed: {stats.completed}
              </div>
              <div className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full font-semibold'>
                Cancelled: {stats.cancelled}
              </div>
            </div>

            {/* Pagination */}
            <div className='flex items-center gap-2'>
              <span className='text-sm text-gray-600 mr-2'>Rows per page:</span>
              <select className='px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'>
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
              
              <div className='flex gap-1 ml-4'>
                <button className='p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed'>
                  <ChevronsLeft className='w-4 h-4' />
                </button>
                <button className='p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all'>
                  <ChevronLeft className='w-4 h-4' />
                </button>
                <button className='px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-sm'>
                  1
                </button>
                <button className='p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all'>
                  <ChevronRight className='w-4 h-4' />
                </button>
                <button className='p-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all'>
                  <ChevronsRight className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelConfirmation.show && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 overflow-hidden animate-fadeIn">
            <div className="flex flex-col items-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Appointment?</h3>
              <p className="text-center text-gray-600 mb-1">
                Are you sure you want to cancel the appointment for {cancelConfirmation.name}
              </p>
              <p className="text-center text-gray-600 mb-4">
                on <span className="font-semibold">{cancelConfirmation.date}</span> at <span className="font-semibold">{cancelConfirmation.time}</span>?
              </p>
              <p className="text-center text-red-600 text-sm font-medium mb-4">
                This action cannot be undone!
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button 
                  className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all"
                  onClick={() => setCancelConfirmation({ show: false, id: null, name: '', date: '', time: '' })}
                >
                  Keep
                </button>
                <button 
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
                  onClick={confirmCancel}
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorAppointments
