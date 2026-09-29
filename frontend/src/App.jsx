import React, { useContext, useEffect } from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  Scissors, Calendar, Bell, Star, MapPin, Clock,
  Sparkles, Users, Award, Zap, Shield, ArrowRight,
  CheckCircle, ChevronRight, Store, Phone, Search,
  CreditCard, Receipt, Tag, Percent, UserCheck, LayoutDashboard,
  Building2, BadgeCheck, Smartphone, QrCode, Package, TrendingUp,
  Globe, Lock, ChevronDown, Layers, PanelLeft, Settings
} from 'lucide-react'

import ScrollToTop from './components/ScrollToTop'

// Context
import { SuperAdminContext } from './context/SuperAdminContext'
import { SalonAdminContext } from './context/SalonAdminContext'
import { AdminContext } from './context/AdminContext'
import { ShopContext } from './context/ShopContext'
import { StylistContext } from './context/StylistContext'

// Super Admin
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin'
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard'
import SuperAdminSalons from './pages/superadmin/SuperAdminSalons'
import CreateSalon from './pages/superadmin/CreateSalon'
import PendingSalons from './pages/superadmin/PendingSalons'
import CreateYourSalon from './pages/CreateYourSalon'
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
import AddProduct from './pages/admin/products/AddProduct'
import ManageProducts from './pages/admin/products/ManageProducts'
import Inventory from './pages/admin/products/Inventory'
import Billing from './pages/admin/billing/Billing'
import Bills from './pages/admin/billing/Bills'
import Coupons from './pages/admin/Coupons'
import Packages from './pages/admin/Packages'
import StylistSection from './pages/stylist/StylistSection'

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
            <Route path="pending-salons" element={<PendingSalons />} />
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
              {/* POS / Billing */}
              <Route path="billing" element={<Billing />} />
              <Route path="bills" element={<Bills />} />
              {/* Discounts */}
              <Route path="coupons" element={<Coupons />} />
              <Route path="packages" element={<Packages />} />
              <Route path="add-product" element={<AddProduct />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="inventory" element={<Inventory />} />
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
const featureCategories = [
  {
    id: 'salon',
    label: 'Core Salon System',
    icon: Building2,
    gradient: 'from-blue-500 to-blue-600',
    lightBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-100',
    hoverBorder: 'hover:border-blue-300',
    items: [
      { icon: Globe, text: 'Custom salon URL & branded booking page' },
      { icon: Layers, text: 'Service catalogue with categories & pricing' },
      { icon: Settings, text: 'Full salon admin control panel' },
      { icon: Star, text: 'Logo, gallery & profile management' },
      { icon: MapPin, text: 'Location & contact info display' },
    ],
  },
  {
    id: 'booking',
    label: 'Salon Booking',
    icon: Calendar,
    gradient: 'from-violet-500 to-violet-600',
    lightBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    borderColor: 'border-violet-100',
    hoverBorder: 'hover:border-violet-300',
    items: [
      { icon: Calendar, text: 'Real-time slot availability & date picker' },
      { icon: UserCheck, text: 'Choose preferred stylist per booking' },
      { icon: Bell, text: 'Instant booking confirmation notifications' },
      { icon: Clock, text: 'Reschedule & cancellation support' },
      { icon: Layers, text: 'Multi-service booking in one appointment' },
    ],
  },
  {
    id: 'service-billing',
    label: 'Service Billing',
    icon: Receipt,
    gradient: 'from-amber-500 to-orange-500',
    lightBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-100',
    hoverBorder: 'hover:border-amber-300',
    items: [
      { icon: Receipt, text: 'Bill services directly at the counter' },
      { icon: Scissors, text: 'Select services & quantities per visit' },
      { icon: Percent, text: 'Apply coupons & discounts at billing' },
      { icon: CreditCard, text: 'Cash, UPI or card payment modes' },
      { icon: TrendingUp, text: 'Service revenue reports & analytics' },
    ],
  },
  {
    id: 'product-billing',
    label: 'Product Billing',
    icon: Package,
    gradient: 'from-orange-500 to-red-500',
    lightBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-100',
    hoverBorder: 'hover:border-orange-300',
    items: [
      { icon: Package, text: 'Sell retail products alongside services' },
      { icon: Layers, text: 'Manage product catalogue & stock' },
      { icon: Tag, text: 'Set product price & apply discounts' },
      { icon: CreditCard, text: 'Mixed service + product invoices' },
      { icon: TrendingUp, text: 'Product sales tracking & reports' },
    ],
  },
  {
    id: 'stylist',
    label: 'Stylist Panel',
    icon: Users,
    gradient: 'from-cyan-500 to-cyan-600',
    lightBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    borderColor: 'border-cyan-100',
    hoverBorder: 'hover:border-cyan-300',
    items: [
      { icon: UserCheck, text: 'Individual login for each stylist' },
      { icon: Calendar, text: 'Personal appointment dashboard' },
      { icon: Award, text: 'Specialisation & expertise tags' },
      { icon: Bell, text: 'New booking alerts per stylist' },
      { icon: Users, text: 'Multiple stylists per salon' },
    ],
  },
  {
    id: 'create',
    label: 'Create Your Salon',
    icon: Store,
    gradient: 'from-indigo-500 to-purple-600',
    lightBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    borderColor: 'border-indigo-100',
    hoverBorder: 'hover:border-indigo-300',
    items: [
      { icon: Store, text: 'Fill & submit salon form in minutes' },
      { icon: CheckCircle, text: 'Super Admin reviews & approves request' },
      { icon: Globe, text: 'Go live with your own booking URL instantly' },
      { icon: Sparkles, text: 'No setup fee — completely free to list' },
      { icon: Settings, text: 'Admin configures features before approval' },
    ],
  },
  {
    id: 'coupons',
    label: 'Coupons',
    icon: Tag,
    gradient: 'from-rose-500 to-pink-500',
    lightBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    borderColor: 'border-rose-100',
    hoverBorder: 'hover:border-rose-300',
    items: [
      { icon: Tag, text: 'Create coupon codes with custom names' },
      { icon: Percent, text: 'Percentage or flat amount discount types' },
      { icon: BadgeCheck, text: 'Set minimum order value conditions' },
      { icon: Clock, text: 'Expiry date & usage count limits' },
      { icon: Zap, text: 'Auto-apply eligible coupons at checkout' },
    ],
  },
  {
    id: 'packages',
    label: 'Packages',
    icon: Package,
    gradient: 'from-fuchsia-500 to-purple-600',
    lightBg: 'bg-fuchsia-50',
    iconColor: 'text-fuchsia-600',
    borderColor: 'border-fuchsia-100',
    hoverBorder: 'hover:border-fuchsia-300',
    items: [
      { icon: Package, text: 'Bundle multiple services into one package' },
      { icon: Percent, text: 'Offer package at a discounted total price' },
      { icon: Layers, text: 'Customisable service combinations' },
      { icon: Star, text: 'Highlight packages on booking page' },
      { icon: TrendingUp, text: 'Track package sales & redemptions' },
    ],
  },
  {
    id: 'broadcast',
    label: 'Broadcast & Bulk SMS',
    icon: Bell,
    gradient: 'from-sky-500 to-blue-600',
    lightBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    borderColor: 'border-sky-100',
    hoverBorder: 'hover:border-sky-300',
    items: [
      { icon: Users, text: 'Send bulk messages to all customers' },
      { icon: Bell, text: 'Broadcast offers, updates & announcements' },
      { icon: Smartphone, text: 'WhatsApp & SMS delivery channels' },
      { icon: Tag, text: 'Attach coupon codes inside messages' },
      { icon: TrendingUp, text: 'Track delivery & open rates' },
    ],
  },
];

const PlatformRoot = () => (
  <div className="min-h-screen bg-white flex flex-col">

    {/* ── Navbar ─────────────────────────────────────────────────────────── */}
    <header className="w-full px-6 sm:px-10 py-4 flex items-center justify-between border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-primary/30">
          <Scissors size={17} className="text-white" />
        </div>
        <span className="text-xl font-extrabold text-gray-900 tracking-tight">Salvexa</span>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="/create-salon"
          className="hidden sm:inline-flex items-center gap-1.5 border border-primary text-primary hover:bg-primary/5 text-sm font-semibold px-4 py-2 rounded-lg transition-all"
        >
          <Store size={14} /> List Salon
        </a>
        
      </div>
    </header>

    {/* ── Hero ───────────────────────────────────────────────────────────── */}
    <section className="bg-gradient-to-br from-primary via-blue-600 to-purple-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-yellow-300/10 rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-pink-300/10 rounded-full" />
      </div>
      <div className="max-w-5xl mx-auto px-6 py-20 sm:py-32 text-center relative">
        <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white/90 text-xs font-bold px-4 py-2 rounded-full mb-7 tracking-wide uppercase">
          <Star size={10} fill="currentColor" className="text-yellow-300" />
          Multi-Vendor Salon Booking Platform
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          Book Your <span className="text-yellow-300">Perfect Style</span>
          <br className="hidden sm:block" /> at Any Salon, Anytime
        </h1>
        <p className="text-white/75 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Salvexa powers complete salon businesses — from customer booking to POS billing,
          UPI payments, stylist management and beyond.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <div className="flex items-center gap-3 bg-white/10 border border-white/20 backdrop-blur-sm rounded-xl px-5 py-3.5 text-sm text-white/80 w-full sm:w-auto">
            <Search size={15} className="text-white/50 flex-shrink-0" />
            Visit your salon: <code className="text-yellow-300 font-bold ml-1">/salon-name</code>
          </div>
          <a
            href="/create-salon"
            className="inline-flex items-center gap-2 bg-white text-primary font-bold px-7 py-3.5 rounded-xl hover:bg-yellow-50 transition-all shadow-lg shadow-black/20 text-sm w-full sm:w-auto justify-center"
          >
            <Store size={15} /> List Your Salon <ArrowRight size={14} />
          </a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 text-white/65 text-sm">
          {[
            { icon: <Users size={14} />, text: 'Multiple Salons' },
            { icon: <Calendar size={14} />, text: 'Real-time Booking' },
            { icon: <QrCode size={14} />, text: 'UPI Payments' },
            { icon: <Receipt size={14} />, text: 'POS Billing' },
            { icon: <Shield size={14} />, text: 'Super Admin Controls' },
          ].map((s) => (
            <div key={s.text} className="flex items-center gap-1.5">
              {s.icon}{s.text}
            </div>
          ))}
        </div>
      </div>
      {/* Scroll hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-40 animate-bounce">
        <ChevronDown size={20} className="text-white" />
      </div>
    </section>

    {/* ── Stats Strip ────────────────────────────────────────────────────── */}
    <section className="border-b border-gray-100 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        {[
          { value: '8+', label: 'Platform Features' },
          { value: 'UPI', label: 'Dynamic QR Payments' },
          { value: '∞', label: 'Salons Supported' },
          { value: '1-click', label: 'Booking Experience' },
        ].map(({ value, label }) => (
          <div key={label}>
            <div className="text-2xl sm:text-3xl font-extrabold text-primary mb-1">{value}</div>
            <div className="text-xs text-gray-500 font-medium">{label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* ── Feature Categories ─────────────────────────────────────────────── */}
    <section className="max-w-7xl mx-auto w-full px-6 py-20">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 bg-primary/8 text-primary text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-wider">
          <Sparkles size={11} /> Platform Capabilities
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Everything Your Salon Needs
        </h2>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          A complete end-to-end platform — from booking to billing, for every type of salon.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {featureCategories.map(({ id, label, icon: CatIcon, gradient, lightBg, iconColor, borderColor, hoverBorder, items }) => (
          <div
            key={id}
            className={`group bg-white rounded-2xl border ${borderColor} ${hoverBorder} shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden cursor-default`}
          >
            {/* Card header */}
            <div className={`bg-gradient-to-br ${gradient} p-5`}>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <CatIcon size={20} className="text-white" />
              </div>
              <h3 className="text-white font-bold text-base leading-snug">{label}</h3>
            </div>
            {/* Card body */}
            <div className="p-4 space-y-2.5">
              {items.map(({ icon: ItemIcon, text }) => (
                <div key={text} className="flex items-start gap-2.5">
                  <div className={`w-6 h-6 ${lightBg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <ItemIcon size={12} className={iconColor} />
                  </div>
                  <span className="text-gray-600 text-xs leading-snug">{text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* ── How It Works ───────────────────────────────────────────────────── */}
    <section className="bg-gradient-to-br from-gray-50 to-blue-50/40 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-wider">
            <Zap size={11} /> Simple Process
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">How It Works</h2>
          <p className="text-gray-500 text-lg">Three steps from browsing to booking</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden sm:block absolute top-8 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30 z-0" />
          {[
            {
              icon: Search,
              step: '01',
              title: 'Find Your Salon',
              desc: "Navigate to your salon's unique URL to see services, stylists and availability.",
              color: 'bg-blue-500',
            },
            {
              icon: Calendar,
              step: '02',
              title: 'Pick a Slot',
              desc: 'Choose a stylist, date and time. Apply coupons or packages for discounts.',
              color: 'bg-violet-500',
            },
            {
              icon: CheckCircle,
              step: '03',
              title: 'Confirm & Pay',
              desc: 'Pay via UPI QR or at the salon. Get instant confirmation and reminders.',
              color: 'bg-emerald-500',
            },
          ].map(({ icon: Icon, step, title, desc, color }) => (
            <div key={step} className="group text-center relative z-10">
              <div className="relative inline-flex mb-5">
                <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                  <Icon size={26} className="text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-yellow-400 text-gray-900 text-xs font-black rounded-full flex items-center justify-center shadow">
                  {step.slice(1)}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 mb-2 text-base">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── Services We Cover ──────────────────────────────────────────────── */}
    <section className="py-20 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-bold px-4 py-2 rounded-full mb-4 uppercase tracking-wider">
            <Scissors size={11} /> Service Types
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Services We Cover</h2>
          <p className="text-gray-500 text-lg">From haircuts to bridal looks — every service, every salon</p>
        </div>

        {/* Large horizontal scroll cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[
            {
              icon: Scissors,
              label: 'Haircuts & Styling',
              desc: 'Precision cuts, blowouts and everyday styling for all hair types.',
              gradient: 'from-blue-500 to-blue-600',
              tag: 'Most Popular',
            },
            {
              icon: Sparkles,
              label: 'Colour & Highlights',
              desc: 'Balayage, ombré, full colour and toning treatments.',
              gradient: 'from-violet-500 to-purple-600',
              tag: 'Trending',
            },
            {
              icon: Star,
              label: 'Bridal & Makeup',
              desc: 'Complete bridal packages — hair, makeup and trials included.',
              gradient: 'from-pink-500 to-rose-500',
              tag: 'Premium',
            },
            {
              icon: Award,
              label: 'Spa & Treatments',
              desc: 'Deep conditioning, keratin, scalp treatments and more.',
              gradient: 'from-emerald-500 to-teal-500',
              tag: 'Relaxing',
            },
          ].map(({ icon: Icon, label, desc, gradient, tag }) => (
            <div
              key={label}
              className={`group relative bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white overflow-hidden cursor-default hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl`}
            >
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full" />
              <div className="absolute top-4 right-4 bg-white/20 text-white/90 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                {tag}
              </div>
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="font-bold text-base mb-1.5 leading-snug">{label}</h3>
              <p className="text-white/75 text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom row — smaller pill-style */}
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { icon: Zap, label: 'Beard & Grooming' },
            { icon: Clock, label: 'Express Services' },
            { icon: Users, label: 'Group Bookings' },
            { icon: MapPin, label: 'Walk-in Salons' },
            { icon: Phone, label: 'Online Consultation' },
            { icon: TrendingUp, label: 'Hair Extensions' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="group flex items-center gap-2.5 bg-white border border-gray-200 hover:border-primary/40 hover:bg-primary/5 rounded-full px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-200 cursor-default"
            >
              <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon size={12} className="text-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── CTA Banner ─────────────────────────────────────────────────────── */}
    <section className="max-w-6xl mx-auto w-full px-6 pb-20">
      <div className="relative bg-gradient-to-br from-primary via-blue-600 to-purple-600 rounded-3xl p-10 sm:p-14 text-white overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-300/10 rounded-full" />
        <div className="relative">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Store size={26} className="text-white" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 tracking-tight">Ready to Grow Your Salon?</h2>
          <p className="text-white/75 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Submit your salon for review and go live with your own booking page, UPI payments,
            stylist panel and POS billing — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/create-salon"
              className="inline-flex items-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-xl hover:bg-yellow-50 transition-all shadow-lg text-sm"
            >
              <Store size={16} /> List Your Salon <ArrowRight size={15} />
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 mt-7 text-white/60 text-xs">
            {[
              { icon: <CheckCircle size={13} />, text: 'No setup fee' },
              { icon: <CheckCircle size={13} />, text: 'Quick approval' },
              { icon: <CheckCircle size={13} />, text: 'Your own booking URL' },
              { icon: <CheckCircle size={13} />, text: 'Full admin dashboard' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">{icon}{text}</div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ── Footer ─────────────────────────────────────────────────────────── */}
    <footer className="border-t border-gray-100 py-7 px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
          <Scissors size={13} className="text-white" />
        </div>
        <span className="font-bold text-gray-700 text-sm">Salvexa</span>
        <span className="text-gray-300 mx-1">·</span>
        <span className="text-gray-400">Multi-Vendor Salon Platform</span>
      </div>
      <div className="flex items-center gap-4">
        <span>
          © {new Date().getFullYear()} Salvexa · Designed & Developed by{' '}
          <a href="https://buildmyweb.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
            BuildMyWeb
          </a>
        </span>
      </div>
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

      {/* Stylist Panel — must be before /:shopSlug/* */}
      <Route path="/:shopSlug/stylist/*" element={<StylistSection />} />

      {/* Customer shop pages */}
      <Route path="/:shopSlug/*" element={<ShopCustomerSection />} />

      {/* Create Your Own Salon — public form */}
      <Route path="/create-salon" element={<CreateYourSalon />} />

      {/* Platform root */}
      <Route path="/" element={<PlatformRoot />} />
    </Routes>
  </>
)

export default App
