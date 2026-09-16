import React, { useContext, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { 
  IndianRupee, 
  Calendar, 
  CalendarCheck, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle,
  Scissors,
  TrendingUp,
  BarChart3,
  User,
  Wallet,
  List,
  Calendar as CalendarIcon
} from 'lucide-react'

const DoctorDashboard = () => {
  const { dToken, dashData, getDashData, cancelAppointment, completeAppointment } = useContext(DoctorContext)
  const { slotDateFormat, currency } = useContext(AppContext)

  useEffect(() => {
    if (dToken) {
      getDashData()
    }
  }, [dToken])

  // Calculate today's earnings
  const getTodayEarnings = () => {
    if (!dashData || !dashData.latestAppointments) return 0
    
    const today = new Date().toDateString()
    return dashData.latestAppointments
      .filter(apt => {
        const aptDate = new Date(apt.slotDateTime || apt.slotDate).toDateString()
        return aptDate === today && (apt.isCompleted || apt.payment)
      })
      .reduce((sum, apt) => sum + (apt.amount || 0), 0)
  }

  // Calculate this month's earnings
  const getMonthEarnings = () => {
    if (!dashData || !dashData.latestAppointments) return 0
    
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    return dashData.latestAppointments
      .filter(apt => {
        const aptDate = new Date(apt.slotDateTime || apt.slotDate)
        return aptDate.getMonth() === currentMonth && 
               aptDate.getFullYear() === currentYear &&
               (apt.isCompleted || apt.payment)
      })
      .reduce((sum, apt) => sum + (apt.amount || 0), 0)
  }

  // Get appointment counts by status
  const getAppointmentCounts = () => {
    if (!dashData || !dashData.latestAppointments) {
      return { pending: 0, completed: 0, cancelled: 0 }
    }

    const counts = {
      pending: 0,
      completed: 0,
      cancelled: 0
    }

    dashData.latestAppointments.forEach(apt => {
      if (apt.cancelled) counts.cancelled++
      else if (apt.isCompleted) counts.completed++
      else counts.pending++
    })

    return counts
  }

  // Calculate today's appointments
  const getTodayAppointments = () => {
    if (!dashData || !dashData.latestAppointments) return 0
    
    const today = new Date().toDateString()
    return dashData.latestAppointments
      .filter(apt => {
        const aptDate = new Date(apt.slotDateTime || apt.slotDate).toDateString()
        return aptDate === today && !apt.cancelled
      }).length
  }

  const appointmentCounts = getAppointmentCounts()

  // If no data yet, show loading state
  if (!dashData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className='m-5'>
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">Stylist Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's an overview of your styling business.</p>
      </div>

      {/* Dashboard Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
        
        {/* Today's Earnings Card */}
        <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group'>
          <div className="flex items-center justify-between mb-3">
            <div className="text-primary/20 group-hover:text-primary transition-colors duration-300">
              <IndianRupee size={32} strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
              <TrendingUp size={14} />
              <span>Today</span>
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-800'>{currency} {getTodayEarnings()}</p>
          <p className='text-gray-500 mt-1 text-sm'>Today's Earnings</p>
        </div>

        {/* Monthly Earnings Card */}
        <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group'>
          <div className="flex items-center justify-between mb-3">
            <div className="text-primary/20 group-hover:text-primary transition-colors duration-300">
              <Wallet size={32} strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full text-xs font-medium">
              <BarChart3 size={14} />
              <span>Monthly</span>
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-800'>{currency} {getMonthEarnings()}</p>
          <p className='text-gray-500 mt-1 text-sm'>This Month's Revenue</p>
        </div>

        {/* Today's Appointments Card */}
        <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group'>
          <div className="flex items-center justify-between mb-3">
            <div className="text-primary/20 group-hover:text-primary transition-colors duration-300">
              <CalendarIcon size={32} strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
              <Clock size={14} />
              <span>Today</span>
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-800'>{getTodayAppointments()}</p>
          <p className='text-gray-500 mt-1 text-sm'>Today's Sessions</p>
        </div>

        {/* Total Appointments Card */}
        <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer group'>
          <div className="flex items-center justify-between mb-3">
            <div className="text-primary/20 group-hover:text-primary transition-colors duration-300">
              <Calendar size={32} strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
              <TrendingUp size={14} />
              <span>Total</span>
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-800'>{dashData.appointments || 0}</p>
          <p className='text-gray-500 mt-1 text-sm'>Total Appointments</p>
        </div>
      </div>

      {/* Status Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5'>
        {/* Pending Appointments Card */}
        <div className='bg-gradient-to-br from-amber-50 to-white p-5 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-all duration-300'>
          <div className="flex items-center justify-between mb-3">
            <div className="text-amber-500">
              <Clock size={28} />
            </div>
            <div className="flex items-center bg-amber-400/10 text-amber-600 px-2.5 py-1 rounded-full text-xs font-medium">
              Pending
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-800'>{appointmentCounts.pending}</p>
          <div className='flex items-center mt-2 text-sm text-amber-600'>
            <div className='h-2 w-2 rounded-full bg-amber-400 mr-2'></div>
            <span>Upcoming appointments</span>
          </div>
        </div>

        {/* Completed Appointments Card */}
        <div className='bg-gradient-to-br from-green-50 to-white p-5 rounded-xl border border-green-100 shadow-sm hover:shadow-md transition-all duration-300'>
          <div className="flex items-center justify-between mb-3">
            <div className="text-green-500">
              <CheckCircle size={28} />
            </div>
            <div className="flex items-center bg-green-400/10 text-green-600 px-2.5 py-1 rounded-full text-xs font-medium">
              Completed
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-800'>{appointmentCounts.completed}</p>
          <div className='flex items-center mt-2 text-sm text-green-600'>
            <div className='h-2 w-2 rounded-full bg-green-400 mr-2'></div>
            <span>Successfully completed</span>
          </div>
        </div>

        {/* Cancelled Appointments Card */}
        <div className='bg-gradient-to-br from-red-50 to-white p-5 rounded-xl border border-red-100 shadow-sm hover:shadow-md transition-all duration-300'>
          <div className="flex items-center justify-between mb-3">
            <div className="text-red-500">
              <XCircle size={28} />
            </div>
            <div className="flex items-center bg-red-400/10 text-red-600 px-2.5 py-1 rounded-full text-xs font-medium">
              Cancelled
            </div>
          </div>
          <p className='text-2xl font-bold text-gray-800'>{appointmentCounts.cancelled}</p>
          <div className='flex items-center mt-2 text-sm text-red-600'>
            <div className='h-2 w-2 rounded-full bg-red-400 mr-2'></div>
            <span>Cancelled appointments</span>
          </div>
        </div>
      </div>

      {/* Clients Card */}
      <div className='bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 mt-5'>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="text-primary mr-3">
              <Users size={24} />
            </div>
            <h3 className='font-semibold text-gray-800'>Unique Clients</h3>
          </div>
          <div className="flex items-center gap-1 bg-teal-50 text-teal-600 px-2 py-1 rounded-full text-xs font-medium">
            <User size={14} />
            <span>{dashData.patients || 0}</span>
          </div>
        </div>
        <p className='text-gray-500 text-sm'>You've served {dashData.patients || 0} unique clients to date. Nurturing these relationships is key to your business growth.</p>
      </div>

      {/* Latest Bookings Section */}
      {/* <div className='bg-white mt-6 rounded-xl shadow-sm border border-gray-200 overflow-hidden'>
        <div className='flex items-center justify-between p-5 border-b bg-gray-50'>
          <div className="flex items-center gap-2">
            <List className='text-primary' size={20} />
            <h3 className='font-semibold text-gray-800'>Latest Bookings</h3>
          </div>
          <button className="text-primary text-sm font-medium hover:underline">
            View All
          </button>
        </div>

        <div className='divide-y divide-gray-100'>
          {dashData.latestAppointments && dashData.latestAppointments.length > 0 ? (
            dashData.latestAppointments.slice(0, 5).map((item, index) => (
              <div 
                className='flex flex-wrap md:flex-nowrap items-center p-4 gap-4 hover:bg-gray-50 transition-all' 
                key={index}
              >
                <div className="flex items-center gap-3 flex-grow min-w-[250px]">
                  <div className="relative">
                    <img 
                      className='rounded-full w-12 h-12 object-cover border border-gray-200' 
                      src={item.userData?.image || assets.upload_area} 
                      alt="" 
                    />
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                      item.cancelled ? 'bg-red-500' : 
                      item.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                  </div>
                  <div>
                    <p className='text-gray-800 font-medium'>{item.userData?.name || 'Client'}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <Calendar size={12} className="text-primary" />
                      <span>{slotDateFormat(item.slotDate)}</span>
                      <span>•</span>
                      <Clock size={12} className="text-primary" />
                      <span>{item.slotTime || "10:00 AM"}</span>
                    </div>
                  </div>
                </div>
                
                <div className='flex-grow md:flex-grow-0 min-w-[140px] flex flex-col'>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Scissors className="text-gray-400" size={14} />
                    <p className='text-sm text-gray-600 line-clamp-1'>
                      {item.services && item.services.length > 0 
                        ? item.services.map(s => s.name).join(', ')
                        : item.service || 'Hair Service'
                      }
                    </p>
                  </div>
                  <div className="flex items-center">
                    <p className='font-semibold text-gray-700'>{currency}{item.amount}</p>
                    {item.paidAmount && item.paidAmount < item.amount && (
                      <span className='ml-2 text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded'>
                        Paid: {currency}{item.paidAmount}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className='flex gap-2 justify-end ml-auto'>
                  {item.cancelled ? (
                    <span className='px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-medium'>
                      Cancelled
                    </span>
                  ) : item.isCompleted ? (
                    <span className='px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium'>
                      Completed
                    </span>
                  ) : (
                    <div className='flex gap-2'>
                      <button
                        onClick={() => cancelAppointment(item._id)}
                        className='p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors'
                        title="Cancel Appointment"
                      >
                        <XCircle size={18} />
                      </button>
                      <button
                        onClick={() => completeAppointment(item._id)}
                        className='p-2 rounded-full bg-green-50 text-green-500 hover:bg-green-100 transition-colors'
                        title="Mark as Completed"
                      >
                        <CheckCircle size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className='text-center py-12 text-gray-500'>
              <div className='w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-100'>
                <Calendar className="text-gray-400" size={24} />
              </div>
              <p className="font-medium text-gray-600">No appointments yet</p>
              <p className="text-sm mt-1">Your bookings will appear here</p>
            </div>
          )}
        </div>
      </div> */}
    </div>
  )
}

export default DoctorDashboard
