import React, { useContext, useEffect } from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  Scissors, Calendar, Bell, Star, MapPin, Clock,
  Sparkles, Users, Award, Zap, Shield, ArrowRight,
  CheckCircle, ChevronRight, Store, Phone, Search
} from 'lucide-react'

import ScrollToTop from './components/ScrollToTop'

// Context
import { SuperAdminContext } from './context/SuperAdminContext'
import { SalonAdminContext } from './context/SalonAdminContext'
import { AdminContext } from './context/AdminContext'
import { ShopContext } from './context/ShopContext'

// Super Admin
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import SuperAdminSalons from './pages/superadmin/SuperAdminSalons'
import CreateSalon from './pages/superadmin/CreateSalon'
import SuperAdminSidebar from './components/admin/SuperAdminSidebar'
import SuperAdminNavbar from './components/admin/SuperAdminNavbar'

// Admin pages
import AdminSidebar from './components/admin/AdminSidebar'
import AdminNavbar from './components/admin/AdminNavbar'
import SalonAdminLogin from './pages/admin/SalonAdminLogin'
import Dashboard from './pages/admin/Dashboard'
import AllAppointments from './pages/admin/AllAppointments'
import AddDoctor from './pages/admin/AddDoctor'
import DoctorsList from './pages/admin/DoctorsList'
import EditStylist from './pages/admin/EditStylist'
import ServicesCategory from './pages/admin/ServicesCategory'
import SlotManagement from './pages/admin/SlotManagement'
import AdminMyProfile from './pages/admin/MyProfile'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorAppointments from './pages/doctor/DoctorAppointments'
import DoctorProfile from './pages/doctor/DoctorProfile'
import DoctorEarnings from './pages/doctor/DoctorEarnings'

// Customer pages
import ShopNavbar from './components/ShopNavbar'
import ShopFooter from './components/ShopFooter'
import ShopHome from './pages/ShopHome'
import ShopStylists from './pages/ShopStylists'
import ShopLogin from './pages/ShopLogin'
import ShopServices from './pages/ShopServices'
import ShopContact from './pages/ShopContact'
import Appointment from './pages/Appointment'
import MyAppointments from './pages/MyAppointments'
import MyProfile from './pages/MyProfile'
import Verify from './pages/Verify'

// ── SUPER ADMIN SECTION ─────────────────────────────────────────────────────
const SuperAdminSection = () => {
  const { saToken } = useContext(SuperAdminContext)

  if (!saToken) return <SuperAdminLogin />

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <SuperAdminNavbar />
        <div className="flex-grow">
          <Routes>
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="salons" element={<SuperAdminSalons />} />
            <Route path="salons/create" element={<CreateSalon />} />
            <Route path="login" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="" element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

// ── SHOP ADMIN SECTION ──────────────────────────────────────────────────────
const ShopAdminSection = () => {
  const { shopSlug } = useParams()
  const salonAdminCtx = useContext(SalonAdminContext)
  const { saAdminToken, shopInfo } = salonAdminCtx

  if (!saAdminToken) {
    return <SalonAdminLogin shopSlug={shopSlug} shopName={shopInfo?.shopName} />
  }

  // Ensure logged-in admin belongs to this shop slug
  if (shopInfo?.slug && shopInfo.slug !== shopSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-md max-w-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Unauthorized</h1>
          <p className="text-gray-500 text-sm mb-4">
            You are logged in as admin for <strong>{shopInfo.shopName}</strong>, not this salon.
          </p>
          <button
            onClick={() => { salonAdminCtx.logout(); window.location.href = `/${shopSlug}/admin`; }}
            className="bg-primary text-white px-5 py-2 rounded-lg text-sm hover:bg-primary/90"
          >
            Login to {shopSlug}
          </button>
        </div>
      </div>
    )
  }

  const salonAdminBridge = {
    aToken: salonAdminCtx.saAdminToken,
    setAToken: (val) => {
      salonAdminCtx.setSaAdminToken(val)
      if (!val) {
        localStorage.removeItem('saAdminToken')
        localStorage.removeItem('shopInfo')
      }
    },
    backendUrl: salonAdminCtx.backendUrl,
    doctors: salonAdminCtx.doctors,
    loading: salonAdminCtx.loading,
    getAllDoctors: salonAdminCtx.getAllDoctors,
    getDoctorById: salonAdminCtx.getDoctorById,
    updateDoctor: salonAdminCtx.updateDoctor,
    deleteDoctor: salonAdminCtx.deleteDoctor,
    changeAvailability: salonAdminCtx.changeAvailability,
    getStylistLeaveDates: salonAdminCtx.getStylistLeaveDates,
    updateStylistLeaveDates: salonAdminCtx.updateStylistLeaveDates,
    appointments: salonAdminCtx.appointments,
    appointmentsLoading: salonAdminCtx.appointmentsLoading,
    getAllAppointments: salonAdminCtx.getAllAppointments,
    cancelAppointment: salonAdminCtx.cancelAppointment,
    markAppointmentCompleted: salonAdminCtx.markAppointmentCompleted,
    markAppointmentIncomplete: salonAdminCtx.markAppointmentIncomplete,
    getDashData: salonAdminCtx.getDashData,
    dashData: salonAdminCtx.dashData,
    adminNotifications: salonAdminCtx.adminNotifications,
    adminUnreadCount: salonAdminCtx.adminUnreadCount,
    getAdminNotifications: salonAdminCtx.getAdminNotifications,
    markAdminNotificationsRead: salonAdminCtx.markAdminNotificationsRead,
  }

  return (
    <AdminContext.Provider value={salonAdminBridge}>
      <div className="bg-[#F8F9FD] min-h-screen">
        <AdminSidebar shopSlug={shopSlug} />
        <div className="flex flex-col min-h-screen md:ml-20 lg:ml-64">
          <AdminNavbar shopSlug={shopSlug} />
          <div className="p-4 sm:p-6 pb-20 md:pb-6 flex-grow">
            <Routes>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="appointments" element={<AllAppointments />} />
              <Route path="slot-management" element={<SlotManagement />} />
              <Route path="add-stylist" element={<AddDoctor />} />
              <Route path="edit-stylist/:id" element={<EditStylist />} />
              <Route path="services" element={<ServicesCategory />} />
              <Route path="stylists" element={<DoctorsList />} />
              <Route path="my-profile" element={<AdminMyProfile />} />
              <Route path="stylist-dashboard" element={<DoctorDashboard />} />
              <Route path="stylist-appointments" element={<DoctorAppointments />} />
              <Route path="stylist-earnings" element={<DoctorEarnings />} />
              <Route path="stylist-profile" element={<DoctorProfile />} />
              <Route path="" element={<Navigate to={`/${shopSlug}/admin/dashboard`} replace />} />
              <Route path="*" element={<Navigate to={`/${shopSlug}/admin/dashboard`} replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </AdminContext.Provider>
  )
}

// ── CUSTOMER SECTION ────────────────────────────────────────────────────────
const ShopCustomerSection = () => {
  const { shopSlug } = useParams()
  const { loadShop } = useContext(ShopContext)

  useEffect(() => {
    if (shopSlug) loadShop(shopSlug)
  }, [shopSlug])

  return (
    <div className="min-h-screen flex flex-col">
      <ShopNavbar />
      <main className="flex-grow">
        <Routes>
          <Route path="" element={<ShopHome />} />
          <Route path="login" element={<ShopLogin />} />
          <Route path="services" element={<ShopServices />} />
          <Route path="stylists" element={<ShopStylists />} />
          <Route path="contact" element={<ShopContact />} />
          <Route path="appointment/:docId" element={<Appointment />} />
          <Route path="my-appointments" element={<MyAppointments />} />
          <Route path="my-profile" element={<MyProfile />} />
          <Route path="verify" element={<Verify />} />
          <Route path="*" element={<ShopHome />} />
        </Routes>
      </main>
      <ShopFooter />
    </div>
  )
}

// ── PLATFORM ROOT ───────────────────────────────────────────────────────────
const PlatformRoot = () => (
  <div className="min-h-screen bg-white flex flex-col">
    {/* ── Navbar ─────────────────────────────────────────────────────────── */}
    <header className="w-full px-6 sm:px-10 py-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
          <Scissors size={17} className="text-white" />
        </div>
        <span className="text-xl font-extrabold text-gray-900 tracking-tight">StyleSlot</span>
      </div>
      <a
        href="/super-admin"
        className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-sm shadow-primary/20"
      >
        <Shield size={14} />
        Admin Portal
        <ChevronRight size={14} />
      </a>
    </header>

    {/* ── Hero ───────────────────────────────────────────────────────────── */}
    <section className="bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="max-w-5xl mx-auto px-6 py-20 sm:py-28 text-center relative">
        <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <Star size={11} fill="currentColor" /> Multi-Vendor Salon Booking Platform
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-5">
          Book Your <span className="text-yellow-300">Perfect Style</span>
          <br className="hidden sm:block" /> at Any Salon, Anytime
        </h1>
        <p className="text-white/70 text-lg max-w-xl mx-auto mb-10">
          StyleSlot connects you with top salons. Browse stylists, pick a slot and book — all from
          one seamless platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <div className="flex items-center gap-3 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-sm text-white/80 w-full sm:w-auto">
            <Search size={15} className="text-white/60" />
            Visit: <code className="text-yellow-300 font-bold ml-1">/your-salon-name</code>
          </div>
          <a
            href="/super-admin"
            className="inline-flex items-center gap-2 bg-white text-primary font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-all shadow-lg shadow-black/20 text-sm w-full sm:w-auto justify-center"
          >
            <Store size={15} /> Open Admin Portal <ArrowRight size={14} />
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/70 text-sm">
          {[
            { icon: <Users size={14} />, text: 'Multiple Salons' },
            { icon: <Calendar size={14} />, text: 'Easy Booking' },
            { icon: <Bell size={14} />, text: 'Instant Notifications' },
            { icon: <Shield size={14} />, text: 'Secure Payments' },
          ].map((s) => (
            <div key={s.text} className="flex items-center gap-1.5">
              {s.icon}
              {s.text}
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Features ───────────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto w-full px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Everything You Need</h2>
        <p className="text-gray-500">
          A complete salon booking experience — for customers and salon owners alike
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          {
            icon: Calendar,
            color: 'bg-blue-50 text-blue-600',
            title: 'Easy Scheduling',
            desc: 'Pick your date, time and stylist in seconds. No waiting, no phone calls required.',
          },
          {
            icon: Users,
            color: 'bg-violet-50 text-violet-600',
            title: 'Expert Stylists',
            desc: 'Browse experienced professionals at each salon and choose the one that fits your style.',
          },
          {
            icon: Sparkles,
            color: 'bg-amber-50 text-amber-600',
            title: 'All Services',
            desc: 'Haircuts, colour, treatments, bridal — find every service in one place.',
          },
          {
            icon: Bell,
            color: 'bg-rose-50 text-rose-600',
            title: 'Instant Alerts',
            desc: 'Real-time notifications for bookings, cancellations and reschedules.',
          },
          {
            icon: Zap,
            color: 'bg-emerald-50 text-emerald-600',
            title: 'Quick Payment',
            desc: 'Secure online payments via Razorpay — pay partial or full, hassle-free.',
          },
          {
            icon: Award,
            color: 'bg-primary/5 text-primary',
            title: 'Multi-Vendor',
            desc: 'Each salon gets its own branded page, admin panel and customer URL.',
          },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div
            key={title}
            className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default"
          >
            <div
              className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
            >
              <Icon size={20} />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1.5">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── How It Works ───────────────────────────────────────────────────── */}
    <section className="bg-gray-50 py-16">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">How It Works</h2>
          <p className="text-gray-500">Three simple steps to your perfect salon experience</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: Search,
              step: '01',
              title: 'Find Your Salon',
              desc: "Navigate to your salon's URL (e.g. /unique-salon) to see their services and stylists.",
            },
            {
              icon: Calendar,
              step: '02',
              title: 'Pick a Slot',
              desc: 'Choose your preferred stylist, date and time from available slots.',
            },
            {
              icon: CheckCircle,
              step: '03',
              title: 'Confirm & Go',
              desc: 'Pay online or at the salon, receive instant confirmation and show up relaxed.',
            },
          ].map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="group text-center">
              <div className="relative inline-flex mb-5">
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform duration-200 mx-auto">
                  <Icon size={26} className="text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 text-gray-900 text-xs font-black rounded-full flex items-center justify-center">
                  {step.slice(1)}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Salon Types ────────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto w-full px-6 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Services We Cover</h2>
        <p className="text-gray-500">From haircuts to bridal looks — every service, every salon</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Scissors, label: 'Haircuts & Styling' },
          { icon: Sparkles, label: 'Colour & Highlights' },
          { icon: Star, label: 'Bridal & Makeup' },
          { icon: Award, label: 'Spa & Treatments' },
          { icon: Zap, label: 'Beard & Grooming' },
          { icon: Clock, label: 'Express Services' },
          { icon: Users, label: 'Group Bookings' },
          { icon: MapPin, label: 'Walk-in Salons' },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="group flex flex-col items-center gap-3 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 cursor-default text-center"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-200">
              <Icon size={18} className="text-primary group-hover:text-white transition-colors" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>

    {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
    <section className="mx-6 sm:mx-10 mb-16 bg-gradient-to-r from-primary to-blue-600 rounded-3xl p-10 text-white text-center shadow-xl shadow-primary/20">
      <Scissors size={36} className="mx-auto mb-4 opacity-80" />
      <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">Own a Salon?</h2>
      <p className="text-white/75 mb-6 max-w-md mx-auto">
        Get your own branded booking page, manage stylists, appointments and payments — all from one
        dashboard.
      </p>
      <a
        href="/super-admin"
        className="inline-flex items-center gap-2 bg-white text-primary font-bold px-7 py-3 rounded-xl hover:bg-white/90 transition-all shadow-md text-sm"
      >
        <Store size={16} /> Get Started as Admin <ArrowRight size={15} />
      </a>
    </section>

    {/* ── Footer ─────────────────────────────────────────────────────────── */}
    <footer className="border-t border-gray-100 py-6 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
          <Scissors size={12} className="text-white" />
        </div>
        <span className="font-semibold text-gray-600">StyleSlot</span>
      </div>
      <span>© {new Date().getFullYear()} StyleSlot · Design and Developed By <a href="https://buildmyweb.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
        BuildMyWeb
      </a>
      </span>
      
    </footer>
  </div>
);

// ── MAIN APP ────────────────────────────────────────────────────────────────
const App = () => (
  <>
    <ToastContainer position="top-center" autoClose={3000} />
    <ScrollToTop />
    <Routes>
      {/* Super Admin — must be before /:shopSlug/* to avoid slug capturing "super-admin" */}
      <Route path="/super-admin/*" element={<SuperAdminSection />} />

      {/* Shop Admin — must be before /:shopSlug/* */}
      <Route path="/:shopSlug/admin/*" element={<ShopAdminSection />} />

      {/* Customer shop pages */}
      <Route path="/:shopSlug/*" element={<ShopCustomerSection />} />

      {/* Platform root */}
      <Route path="/" element={<PlatformRoot />} />
    </Routes>
  </>
)

export default App
