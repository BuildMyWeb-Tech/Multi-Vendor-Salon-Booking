import React, { useContext, useEffect, useState } from 'react';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import {
  Users,
  Calendar,
  UserCircle,
  IndianRupee,
  Scissors,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Award,
  Star,
  Gem,
  UserCheck,
  ShoppingBag,
  Heart,
  Bell,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const Dashboard = () => {
  const {
    aToken,
    getDashData,
    cancelAppointment,
    dashData,
    getAllAppointments,
    appointments,
    adminNotifications,
    adminUnreadCount,
    markAdminNotificationsRead,
    getAdminNotifications,
  } = useContext(AdminContext);
  const { slotDateFormat } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingTrends, setBookingTrends] = useState([]);
  const [servicePopularity, setServicePopularity] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [stylistPerformance, setStylistPerformance] = useState([]);
  const [customerRetention, setCustomerRetention] = useState([]);
  // ✅ Notification panel state
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (aToken) {
      setIsLoading(true);

      Promise.all([getDashData(), getAllAppointments()]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [aToken]);

  // Process appointments data for charts when appointments or dashData changes
  useEffect(() => {
    if (appointments && appointments.length > 0) {
      processBookingTrends();
      processServicePopularity();
      processRevenueData();
      processStylistPerformance();
      processCustomerRetention();
    }
  }, [appointments, dashData]);

  // Calculate booking trends (appointments per day)
  const processBookingTrends = () => {
    // Create a map to count bookings by date
    const bookingsByDate = {};

    // Get last 30 days
    const dates = [];
    const today = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      bookingsByDate[dateStr] = 0;
      dates.push(dateStr);
    }

    // Count appointments per day
    appointments.forEach((appointment) => {
      const appointmentDate = new Date(appointment.date || appointment.slotDate);
      const dateStr = appointmentDate.toISOString().split('T')[0];

      if (bookingsByDate[dateStr] !== undefined) {
        bookingsByDate[dateStr]++;
      }
    });

    // Convert to array format for chart
    const chartData = dates.map((date) => ({
      date: date.slice(5), // Just month and day (MM-DD)
      bookings: bookingsByDate[date],
    }));

    setBookingTrends(chartData);
  };

  // Calculate service popularity
  const processServicePopularity = () => {
    const serviceCount = {};

    // Define default services for salon
    const defaultServices = [
      'Haircut & Style',
      'Hair Coloring',
      'Blowout & Styling',
      'Hair Treatment',
      'Beard Trim',
      'Bridal Style',
    ];

    // Initialize default services
    defaultServices.forEach((service) => {
      serviceCount[service] = 0;
    });

    appointments.forEach((appointment) => {
      if (appointment.services && Array.isArray(appointment.services)) {
        appointment.services.forEach((service) => {
          if (service.name) {
            if (!serviceCount[service.name]) {
              serviceCount[service.name] = 0;
            }
            serviceCount[service.name]++;
          }
        });
      } else if (appointment.service) {
        // Handle legacy format
        const serviceName = appointment.service;
        if (!serviceCount[serviceName]) {
          serviceCount[serviceName] = 0;
        }
        serviceCount[serviceName]++;
      }

      // If no service found, assign to general haircut
      if (!appointment.service && !appointment.services) {
        serviceCount['Haircut & Style']++;
      }
    });

    // Convert to array and sort by popularity
    const serviceData = Object.entries(serviceCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 services

    setServicePopularity(serviceData);
  };

  // Calculate revenue data
  const processRevenueData = () => {
    const revenueByMonth = {};

    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    // Initialize with last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${month.getMonth()}`;
      revenueByMonth[monthKey] = {
        name: monthNames[month.getMonth()],
        revenue: 0,
        completedRevenue: 0,
      };
    }

    // Calculate revenue
    appointments.forEach((appointment) => {
      if (appointment.amount) {
        const appointmentDate = new Date(appointment.date || appointment.slotDate);
        const monthKey = `${appointmentDate.getFullYear()}-${appointmentDate.getMonth()}`;

        if (revenueByMonth[monthKey]) {
          revenueByMonth[monthKey].revenue += appointment.amount;

          if (appointment.isCompleted) {
            revenueByMonth[monthKey].completedRevenue += appointment.amount;
          }
        }
      }
    });

    // Convert to array format for chart
    setRevenueData(Object.values(revenueByMonth));
  };

  // Process customer retention data (repeat customers)
  const processCustomerRetention = () => {
    // Count appointments per customer
    const appointmentsByCustomer = {};

    appointments.forEach((appointment) => {
      const customerId = appointment.userId || 'unknown';
      if (!appointmentsByCustomer[customerId]) {
        appointmentsByCustomer[customerId] = 0;
      }
      appointmentsByCustomer[customerId]++;
    });

    // Count customers by number of appointments
    const customersByAppointmentCount = {
      '1 visit': 0,
      '2-3 visits': 0,
      '4-5 visits': 0,
      '6+ visits': 0,
    };

    Object.values(appointmentsByCustomer).forEach((count) => {
      if (count === 1) {
        customersByAppointmentCount['1 visit']++;
      } else if (count >= 2 && count <= 3) {
        customersByAppointmentCount['2-3 visits']++;
      } else if (count >= 4 && count <= 5) {
        customersByAppointmentCount['4-5 visits']++;
      } else {
        customersByAppointmentCount['6+ visits']++;
      }
    });

    // Convert to array format for chart
    const retentionData = Object.entries(customersByAppointmentCount).map(([name, value]) => ({
      name,
      value,
    }));

    setCustomerRetention(retentionData);
  };

  // Calculate total revenue from appointments
  const calculateTotalRevenue = () => {
    if (!appointments || appointments.length === 0) return 0;

    return appointments.reduce((total, appointment) => {
      // Only count non-cancelled appointments
      if (appointment.amount && !appointment.cancelled) {
        return total + Number(appointment.amount);
      }
      return total;
    }, 0);
  };

  // Count today's appointments
  const countTodayAppointments = () => {
    if (!appointments || appointments.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return appointments.filter((app) => {
      const appDate = new Date(app.date || app.slotDate || app.createdAt);
      return appDate >= today && appDate < tomorrow && !app.cancelled;
    }).length;
  };

  // Calculate monthly revenue
  const calculateMonthlyRevenue = () => {
    if (!appointments || appointments.length === 0) return 0;

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    return appointments.reduce((total, appointment) => {
      if (appointment.amount && !appointment.cancelled) {
        const appDate = new Date(appointment.date || appointment.slotDate || appointment.createdAt);
        if (appDate >= firstDayOfMonth && appDate < firstDayOfNextMonth) {
          return total + Number(appointment.amount);
        }
      }
      return total;
    }, 0);
  };

  // Calculate appointment completion rate
  const calculateCompletionRate = () => {
    if (!appointments || appointments.length === 0) return 0;

    const completedCount = appointments.filter((app) => app.isCompleted && !app.cancelled).length;

    const totalValidCount = appointments.filter((app) => !app.cancelled).length;

    return totalValidCount ? Math.round((completedCount / totalValidCount) * 100) : 0;
  };

  // Calculate stylist performance
  const processStylistPerformance = () => {
    const stylistStats = {};

    appointments.forEach((appointment) => {
      const stylistId = appointment.docId || appointment.doctorId;
      const stylistName = appointment.docData?.name || 'Unknown';

      if (!stylistStats[stylistId]) {
        stylistStats[stylistId] = {
          name: stylistName,
          appointments: 0,
          completed: 0,
          revenue: 0,
        };
      }

      stylistStats[stylistId].appointments++;

      if (appointment.isCompleted) {
        stylistStats[stylistId].completed++;
      }

      if (appointment.amount) {
        stylistStats[stylistId].revenue += appointment.amount;
      }
    });

    // Convert to array and sort by appointments
    const performanceData = Object.values(stylistStats)
      .map((stylist) => ({
        ...stylist,
        completionRate:
          stylist.appointments > 0
            ? Math.round((stylist.completed / stylist.appointments) * 100)
            : 0,
      }))
      .sort((a, b) => b.appointments - a.appointments);

    setStylistPerformance(performanceData);
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE'];
  const RETENTION_COLORS = ['#ff8042', '#ffc658', '#82ca9d', '#8884d8'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-500">Loading salon dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    dashData && (
      <div className="max-w-7xl mx-auto bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <Scissors className="text-primary" size={28} />
            StyleStudio Dashboard
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-gray-600">Manage your salon performance and appointments</p>
            <div className="flex items-center gap-3">
              {/* ✅ Admin Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications && adminUnreadCount > 0) markAdminNotificationsRead();
                  }}
                  className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-200 transition-colors bg-white border border-gray-200 shadow-sm"
                  title="Notifications"
                >
                  <Bell size={18} className="text-gray-600" />
                  {adminUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {adminUnreadCount > 9 ? '9+' : adminUnreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                      <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                      <div className="flex items-center gap-3">
                        {adminNotifications.some((n) => !n.read) && (
                          <button
                            onClick={() => markAdminNotificationsRead()}
                            className="text-xs text-primary hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                        <button
                          onClick={() => setShowNotifications(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {adminNotifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-400 text-sm">
                          <Bell size={28} className="mx-auto mb-2 opacity-30" />
                          No notifications yet
                        </div>
                      ) : (
                        adminNotifications.map((n) => (
                          <div
                            key={n._id}
                            className={`px-4 py-3 border-b last:border-0 transition-colors ${!n.read ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
                          >
                            <div className="flex items-start gap-2">
                              {!n.read && (
                                <span className="mt-1.5 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                              <div className={!n.read ? '' : 'ml-4'}>
                                <p className="text-xs font-semibold text-gray-800 mb-0.5">
                                  {n.title}
                                </p>
                                <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(n.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {adminNotifications.length > 0 && (
                      <div className="px-4 py-2 border-t bg-gray-50 text-center">
                        <button
                          onClick={getAdminNotifications}
                          className="text-xs text-primary font-medium hover:underline flex items-center gap-1 mx-auto"
                        >
                          <RefreshCw size={11} /> Refresh
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setIsLoading(true);
                  Promise.all([getDashData(), getAllAppointments()]).finally(() =>
                    setIsLoading(false)
                  );
                }}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors"
              >
                <RefreshCw size={14} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Stylists Card */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Stylists</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2">
                  {dashData.stylists || dashData.doctors || 0}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
                  Expert hair professionals
                </p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-lg bg-blue-50 text-blue-500">
                <Scissors size={22} className="sm:hidden" />
                <Scissors size={26} className="hidden sm:block" />
              </div>
            </div>
          </div>

          {/* Total Bookings Card */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Bookings</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2">
                  {dashData.appointments || 0}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1">Styling sessions booked</p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-lg bg-purple-50 text-purple-500">
                <Calendar size={22} className="sm:hidden" />
                <Calendar size={26} className="hidden sm:block" />
              </div>
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Customers</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2">
                  {dashData.clients || dashData.patients || 0}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1">Salon clientele</p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-lg bg-green-50 text-green-500">
                <UserCircle size={22} className="sm:hidden" />
                <UserCircle size={26} className="hidden sm:block" />
              </div>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">Overall Revenue</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2">
                  {formatCurrency(dashData.revenue || calculateTotalRevenue() || 0)}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1">Total salon earnings</p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-lg bg-amber-50 text-amber-500">
                <IndianRupee size={22} className="sm:hidden" />
                <IndianRupee size={26} className="hidden sm:block" />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-5">
          {/* Today's Appointments */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                  Today's Styling Sessions
                </h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2">
                  {dashData.todaysAppointments || countTodayAppointments() || 0}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
                  Sessions scheduled for today
                </p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-lg bg-pink-50 text-pink-500">
                <Sparkles size={22} className="sm:hidden" />
                <Sparkles size={26} className="hidden sm:block" />
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                  This Month's Revenue
                </h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2">
                  {formatCurrency(calculateMonthlyRevenue() || 0)}
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
                  Revenue for {new Date().toLocaleString('default', { month: 'long' })}
                </p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-lg bg-purple-50 text-purple-500">
                <TrendingUp size={22} className="sm:hidden" />
                <TrendingUp size={26} className="hidden sm:block" />
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-500">
                  Service Completion Rate
                </h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1 sm:mt-2">
                  {calculateCompletionRate()}%
                </p>
                <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
                  Styling sessions completed
                </p>
              </div>

              <div className="p-2.5 sm:p-3 rounded-lg bg-blue-50 text-blue-500">
                <Award size={22} className="sm:hidden" />
                <Award size={26} className="hidden sm:block" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Booking Trends Chart */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp size={20} className="mr-2 text-blue-500" />
              Salon Booking Trends
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bookingTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Salon Appointments"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Service Popularity */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Scissors size={20} className="mr-2 text-green-500" />
              Most Popular Services
            </h3>

            {/* Responsive Chart Container */}
            <div className="flex flex-col gap-6 lg:flex-row lg:gap-4 h-auto lg:h-80">
              {/* Bar Chart */}
              <div className="w-full lg:w-[60%] h-64 sm:h-72 md:h-80 lg:h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={servicePopularity}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Number of Bookings" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="w-full lg:w-[40%] h-64 sm:h-72 md:h-80 lg:h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={servicePopularity}
                      cx="50%"
                      cy="50%"
                      innerRadius="55%"
                      outerRadius="75%"
                      paddingAngle={5}
                      dataKey="count"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {servicePopularity.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, 'Bookings']} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Revenue Analytics */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <IndianRupee size={20} className="mr-2 text-amber-500" />
              Salon Revenue Analytics
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Total Revenue" />
                  <Bar
                    dataKey="completedRevenue"
                    fill="#82ca9d"
                    name="Revenue from Completed Services"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stylist Performance */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Users size={20} className="mr-2 text-blue-500" />
              Stylist Performance
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stylistPerformance}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="appointments" fill="#8884d8" name="Total Styling Sessions" />
                  <Bar dataKey="completed" fill="#82ca9d" name="Completed Sessions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Retention */}
          {/* <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Heart size={20} className="mr-2 text-red-500" />
            Client Loyalty Analysis
          </h3>
          <div className="h-80 flex flex-col lg:flex-row">
            <ResponsiveContainer width="100%" height="100%" className="lg:w-[50%]">
              <BarChart
                data={customerRetention}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name="Number of Clients" 
                  fill="#ff7c43" 
                >
                  {customerRetention.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RETENTION_COLORS[index % RETENTION_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <ResponsiveContainer width="100%" height="100%" className="mt-6 lg:mt-0 lg:w-[50%]">
              <PieChart>
                <Pie
                  data={customerRetention}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {customerRetention.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={RETENTION_COLORS[index % RETENTION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [value, 'Clients']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div> */}

          {/* Top Products */}
          {/* <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <ShoppingBag size={20} className="mr-2 text-teal-500" />
            Salon Product Sales
          </h3>
          <div className="flex flex-col h-80">
            <div className="flex flex-col items-center justify-center h-full">
              <Gem size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-500 mb-2">Product sales data coming soon</p>
              <p className="text-sm text-gray-400 max-w-md text-center">
                Track your retail products performance and inventory in upcoming updates
              </p>
            </div>
          </div>
        </div> */}
        </div>
      </div>
    )
  );
};

export default Dashboard;
