import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import { 
  IndianRupee, 
  Calendar, 
  ClipboardCheck, 
  Clock, 
  User, 
  Scissors, 
  ChevronDown, 
  Search, 
  Filter, 
  CreditCard,
  BarChart2, 
  TrendingUp, 
  ArrowUpRight, 
  Wallet, 
  CheckCircle, 
  AlertCircle,
  Calendar as CalendarIcon,
  Download,
  FileText,
  X
} from 'lucide-react'

const DoctorEarnings = () => {
  const { dToken, appointments, getAppointments } = useContext(DoctorContext)
  const { slotDateFormat, currency } = useContext(AppContext)
  const [filteredAppointments, setFilteredAppointments] = useState([])
  const [filterPeriod, setFilterPeriod] = useState('all') // all, today, week, month
  const [paymentFilter, setPaymentFilter] = useState('all') // all, paid, pending
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (dToken) {
      setIsLoading(true);
      getAppointments()
        .then(() => {
          setTimeout(() => setIsLoading(false), 600); // Simulate loading for demo
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [dToken])

  // Filter appointments based on period, payment status, and search
  useEffect(() => {
    if (!appointments) return

    let filtered = [...appointments]

    // Filter by time period
    const now = new Date()
    if (filterPeriod === 'today') {
      const today = now.toDateString()
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.slotDateTime || apt.slotDate).toDateString()
        return aptDate === today
      })
    } else if (filterPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.slotDateTime || apt.slotDate)
        return aptDate >= weekAgo && aptDate <= now
      })
    } else if (filterPeriod === 'month') {
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.slotDateTime || apt.slotDate)
        return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear
      })
    }

    // Filter by payment status
    if (paymentFilter === 'paid') {
      filtered = filtered.filter(apt => apt.payment && apt.isCompleted)
    } else if (paymentFilter === 'pending') {
      filtered = filtered.filter(apt => !apt.isCompleted && !apt.cancelled)
    }

    // Filter out cancelled appointments
    filtered = filtered.filter(apt => !apt.cancelled)

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.userData?.name?.toLowerCase().includes(search) || 
        apt.userData?.phone?.toLowerCase().includes(search) ||
        (apt.service && apt.service.toLowerCase().includes(search)) ||
        (apt.services && apt.services.some(s => s.name.toLowerCase().includes(search)))
      );
    }

    setFilteredAppointments(filtered)
  }, [appointments, filterPeriod, paymentFilter, searchTerm])

  // Calculate totals
  const calculateTotals = () => {
    const totals = {
      totalAmount: 0,
      paidAmount: 0,
      remainingAmount: 0,
      completedCount: 0,
      pendingCount: 0,
      totalAppointments: 0
    }

    filteredAppointments.forEach(apt => {
      totals.totalAmount += apt.amount || 0
      totals.paidAmount += apt.paidAmount || apt.amount || 0
      totals.remainingAmount += apt.remainingAmount || 0
      totals.totalAppointments++
      
      if (apt.isCompleted) totals.completedCount++
      else totals.pendingCount++
    })

    return totals
  }

  const totals = calculateTotals()

  // Get the current date
  const getCurrentDate = () => {
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  // Export to CSV function
  const exportToCSV = () => {
    // Implementation would go here
    alert('Export functionality would download earnings report as CSV');
  }

  // Calculate period description
  const getPeriodDescription = () => {
    switch(filterPeriod) {
      case 'today': return 'Today';
      case 'week': return 'Last 7 Days';
      case 'month': return 'This Month';
      default: return 'All Time';
    }
  }

  return (
    <div className='w-full max-w-6xl mx-auto p-4 sm:p-6'>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className='text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2'>
            <IndianRupee className="text-primary" />
            Earnings Dashboard
          </h1>
          <p className='text-gray-500 text-sm mt-1'>{getCurrentDate()}</p>
        </div>

        {/* <div className="flex gap-2">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm transition-colors"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">Reports</span>
              <ChevronDown size={16} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-10 w-48">
                <ul>
                  <li className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">Monthly Report</li>
                  <li className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">Quarterly Summary</li>
                  <li className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm">Annual Overview</li>
                </ul>
              </div>
            )}
          </div>
        </div> */}
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <div className='bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow'>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className='text-gray-500 text-sm font-medium'>Total Earned</p>
              <p className='text-2xl font-bold text-gray-800'>{currency}{totals.totalAmount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary">
              <Wallet size={20} />
            </div>
          </div>
          
        </div>

        <div className='bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow'>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className='text-gray-500 text-sm font-medium'>Paid Amount</p>
              <p className='text-2xl font-bold text-green-600'>{currency}{totals.paidAmount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-medium">{Math.round((totals.paidAmount / totals.totalAmount) * 100 || 0)}%</span> of total earnings
          </div>
        </div>

        <div className='bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow'>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className='text-gray-500 text-sm font-medium'>Pending Amount</p>
              <p className='text-2xl font-bold text-orange-600'>{currency}{totals.remainingAmount}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
              <AlertCircle size={20} />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            From <span className="font-medium">{totals.pendingCount}</span> pending appointments
          </div>
        </div>

        <div className='bg-white p-5 rounded-xl shadow-sm border hover:shadow-md transition-shadow'>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className='text-gray-500 text-sm font-medium'>Appointments</p>
              <p className='text-2xl font-bold text-primary'>{totals.totalAppointments}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <ClipboardCheck size={20} />
            </div>
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-medium">{totals.completedCount}</span> completed, 
            <span className="font-medium ml-1">{totals.pendingCount}</span> pending
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white p-5 rounded-xl shadow-sm border mb-6'>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <BarChart2 size={18} className="text-primary" />
            <span>{getPeriodDescription()} Earnings</span>
          </h2>
          <div className="ml-auto flex flex-wrap gap-3">
            <span className="text-sm py-1 px-2.5 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
              <CheckCircle size={14} />
              <span>{totals.completedCount} Completed</span>
            </span>
            <span className="text-sm py-1 px-2.5 bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
              <TrendingUp size={14} />
              <span>{currency}{totals.totalAmount} Total</span>
            </span>
          </div>
        </div>

        <div className='flex flex-wrap gap-4'>
          <div className='flex-1 min-w-[200px]'>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search client or service..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {searchTerm && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSearchTerm('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className='flex-1 min-w-[200px]'>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <CalendarIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select 
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none bg-white'
                >
                  <option value='all'>All Time</option>
                  <option value='today'>Today</option>
                  <option value='week'>Last 7 Days</option>
                  <option value='month'>This Month</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative flex-1">
                <CreditCard size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select 
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className='w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none bg-white'
                >
                  <option value='all'>All Status</option>
                  <option value='paid'>Paid & Completed</option>
                  <option value='pending'>Pending</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className='bg-white border rounded-xl shadow-sm overflow-hidden'>
        <div className="p-4 border-b bg-gray-50 flex flex-wrap justify-between items-center">
          <h3 className="font-semibold text-gray-800">Transaction History</h3>
          <div className="flex items-center gap-2 text-sm">
            <Filter size={16} className="text-gray-500" />
            <span>Showing {filteredAppointments.length} transactions</span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className='max-sm:hidden grid grid-cols-[0.5fr_1.5fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-1 py-3 px-6 border-b bg-gray-50 sticky top-0'>
              <p className='font-medium text-gray-600 text-sm'>#</p>
              <p className='font-medium text-gray-600 text-sm'>Client</p>
              <p className='font-medium text-gray-600 text-sm'>Date</p>
              <p className='font-medium text-gray-600 text-sm'>Service</p>
              <p className='font-medium text-gray-600 text-sm'>Total</p>
              <p className='font-medium text-gray-600 text-sm'>Paid</p>
              <p className='font-medium text-gray-600 text-sm'>Remaining</p>
              <p className='font-medium text-gray-600 text-sm'>Status</p>
            </div>

            {/* Table Body */}
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredAppointments && filteredAppointments.length > 0 ? (
                filteredAppointments.map((item, index) => (
                  <div 
                    className='flex flex-wrap justify-between max-sm:gap-2 max-sm:text-base sm:grid grid-cols-[0.5fr_1.5fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-1 items-center text-gray-500 py-4 px-6 border-b hover:bg-gray-50 transition-all' 
                    key={index}
                  >
                    <p className='max-sm:hidden'>{index + 1}</p>
                    
                    {/* Client Info */}
                    <div className='flex items-center gap-3'>
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                        {item.userData?.image ? (
                          <img 
                            src={item.userData.image} 
                            className='w-full h-full object-cover' 
                            alt={item.userData.name || 'Client'} 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                            <User size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className='font-medium text-gray-800'>{item.userData?.name || 'Client'}</p>
                        <p className='text-xs text-gray-400'>{item.userData?.phone || 'No phone'}</p>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex items-start gap-2">
                      <Calendar size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700">{slotDateFormat(item.slotDate)}</p>
                        <p className='text-xs text-gray-400 flex items-center gap-1'>
                          <Clock size={12} />
                          {item.slotTime || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Service */}
                    <div className="flex items-start gap-2">
                      <Scissors size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <p className='text-sm text-gray-700 line-clamp-2'>
                        {item.services && item.services.length > 0 
                          ? item.services.map(s => s.name).join(', ')
                          : item.service || 'Haircut Service'
                        }
                      </p>
                    </div>

                    {/* Total Amount */}
                    <p className='font-medium text-gray-800'>{currency}{item.amount || 0}</p>

                    {/* Paid Amount */}
                    <p className='text-green-600 font-medium'>
                      {currency}{item.paidAmount || item.amount || 0}
                    </p>

                    {/* Remaining Amount */}
                    <p className={`font-medium ${item.remainingAmount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                      {currency}{item.remainingAmount || 0}
                    </p>

                    {/* Status */}
                    <div className='flex flex-col gap-1.5'>
                      {item.isCompleted ? (
                        <span className='px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs text-center font-medium'>
                          Completed
                        </span>
                      ) : (
                        <span className='px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs text-center font-medium'>
                          Pending
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs text-center font-medium ${
                        item.payment 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.paymentMethod || (item.payment ? 'Paid' : 'Cash')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className='text-center py-20 text-gray-500'>
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <IndianRupee size={28} className="text-gray-400" />
                  </div>
                  <p className='text-lg font-medium text-gray-700'>No transactions found</p>
                  <p className='text-sm mt-2 max-w-md mx-auto'>
                    Transactions will appear here once you complete appointments. Try adjusting your filters to see more results.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add this style for the spinner animation */}
      <style jsx="true">{`
        @keyframes spinner {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spinner 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default DoctorEarnings
