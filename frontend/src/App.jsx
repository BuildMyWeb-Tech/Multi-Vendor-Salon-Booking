import React, { useContext, useEffect } from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

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
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-primary/10">
    <div className="text-center p-8 max-w-md">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/30">
        <span className="text-white text-3xl">✂</span>
      </div>
      <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-3">
        Salon Booking Platform
      </h1>
      <p className="text-gray-500 mb-6">
        Visit your salon's URL to book appointments.
      </p>
      <p className="text-sm text-gray-400 bg-gray-100 px-4 py-2 rounded-lg">
        Example: <code>/your-salon-name</code>
      </p>
      <a href="/super-admin" className="mt-6 inline-block text-primary text-sm hover:underline font-medium">
        Super Admin Portal →
      </a>
    </div>
  </div>
)

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
