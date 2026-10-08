import React, { lazy, Suspense, useContext, useEffect } from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import ScrollToTop from './components/ScrollToTop'

// Context
import { SuperAdminContext } from './context/SuperAdminContext'
import { SalonAdminContext } from './context/SalonAdminContext'
import { AdminContext } from './context/AdminContext'
import { ShopContext } from './context/ShopContext'
import { StylistContext } from './context/StylistContext'

// Shell components (always needed — no lazy loading)
import SuperAdminSidebar from './components/admin/SuperAdminSidebar'
import SuperAdminNavbar from './components/admin/SuperAdminNavbar'
import AdminSidebar from './components/admin/AdminSidebar'
import AdminNavbar from './components/admin/AdminNavbar'
import ShopNavbar from './components/ShopNavbar'
import ShopFooter from './components/ShopFooter'

// Login pages — small, load eagerly
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin'
import SalonAdminLogin from './pages/admin/SalonAdminLogin'

// Platform root — loaded at /
const PlatformRoot    = lazy(() => import('./pages/PlatformRoot'))
const CreateYourSalon = lazy(() => import('./pages/CreateYourSalon'))

// Super Admin pages
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/SuperAdminDashboard'))
const SuperAdminSalons    = lazy(() => import('./pages/superadmin/SuperAdminSalons'))
const CreateSalon         = lazy(() => import('./pages/superadmin/CreateSalon'))
const PendingSalons       = lazy(() => import('./pages/superadmin/PendingSalons'))

// Admin pages
const Dashboard         = lazy(() => import('./pages/admin/Dashboard'))
const AllAppointments   = lazy(() => import('./pages/admin/AllAppointments'))
const AddDoctor         = lazy(() => import('./pages/admin/AddDoctor'))
const DoctorsList       = lazy(() => import('./pages/admin/DoctorsList'))
const EditStylist       = lazy(() => import('./pages/admin/EditStylist'))
const ServicesCategory  = lazy(() => import('./pages/admin/ServicesCategory'))
const SlotManagement    = lazy(() => import('./pages/admin/SlotManagement'))
const AdminMyProfile    = lazy(() => import('./pages/admin/MyProfile'))
const DoctorDashboard   = lazy(() => import('./pages/doctor/DoctorDashboard'))
const DoctorAppointments= lazy(() => import('./pages/doctor/DoctorAppointments'))
const DoctorProfile     = lazy(() => import('./pages/doctor/DoctorProfile'))
const DoctorEarnings    = lazy(() => import('./pages/doctor/DoctorEarnings'))
const AddProduct        = lazy(() => import('./pages/admin/products/AddProduct'))
const ManageProducts    = lazy(() => import('./pages/admin/products/ManageProducts'))
const Inventory         = lazy(() => import('./pages/admin/products/Inventory'))
const Billing           = lazy(() => import('./pages/admin/billing/Billing'))
const Bills             = lazy(() => import('./pages/admin/billing/Bills'))
const TaxSettings       = lazy(() => import('./pages/admin/TaxSettings'))
const Coupons           = lazy(() => import('./pages/admin/Coupons'))
const Packages          = lazy(() => import('./pages/admin/Packages'))
const Broadcast         = lazy(() => import('./pages/admin/Broadcast'))
const WhatsAppConnect   = lazy(() => import('./pages/admin/WhatsAppConnect'))
const OfflineBooking    = lazy(() => import('./pages/admin/OfflineBooking'))
const StylistSection    = lazy(() => import('./pages/stylist/StylistSection'))

// Customer pages
const ShopHome        = lazy(() => import('./pages/ShopHome'))
const ShopStylists    = lazy(() => import('./pages/ShopStylists'))
const ShopLogin       = lazy(() => import('./pages/ShopLogin'))
const ShopServices    = lazy(() => import('./pages/ShopServices'))
const ShopContact     = lazy(() => import('./pages/ShopContact'))
const Appointment     = lazy(() => import('./pages/Appointment'))
const MyAppointments  = lazy(() => import('./pages/MyAppointments'))
const MyProfile       = lazy(() => import('./pages/MyProfile'))
const Verify          = lazy(() => import('./pages/Verify'))

// Minimal fallback shown while a lazy chunk loads
const PageSpinner = () => (
  <div className="min-h-[200px] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

// ── SUPER ADMIN SECTION ──────────────────────────────────────────────────────
const SuperAdminSection = () => {
  const { saToken } = useContext(SuperAdminContext)

  if (!saToken) return <SuperAdminLogin />

  return (
    <div className="flex min-h-screen bg-[#F8F9FD]">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <SuperAdminNavbar />
        <div className="flex-grow">
          <Suspense fallback={<PageSpinner />}>
            <Routes>
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="salons" element={<SuperAdminSalons />} />
              <Route path="salons/create" element={<CreateSalon />} />
              <Route path="pending-salons" element={<PendingSalons />} />
              <Route path="login" element={<Navigate to="/super-admin/dashboard" replace />} />
              <Route path="" element={<Navigate to="/super-admin/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  )
}

// ── SHOP ADMIN SECTION ───────────────────────────────────────────────────────
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
            <Suspense fallback={<PageSpinner />}>
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
              <Route path="tax-settings" element={<TaxSettings />} />
              {/* Discounts */}
              <Route path="coupons" element={<Coupons />} />
              <Route path="packages" element={<Packages />} />
              {/* Broadcast */}
              <Route path="broadcast" element={<Broadcast />} />
              <Route path="whatsapp-connect" element={<WhatsAppConnect />} />
              {/* Offline / Walk-in Booking */}
              <Route path="offline-booking" element={<OfflineBooking />} />
              <Route path="add-product" element={<AddProduct />} />
              <Route path="products" element={<ManageProducts />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="" element={<Navigate to={`/${shopSlug}/admin/dashboard`} replace />} />
              <Route path="*" element={<Navigate to={`/${shopSlug}/admin/dashboard`} replace />} />
            </Routes>
            </Suspense>
          </div>
        </div>
      </div>
    </AdminContext.Provider>
  )
}

// ── CUSTOMER SECTION ─────────────────────────────────────────────────────────
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
        <Suspense fallback={<PageSpinner />}>
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
        </Suspense>
      </main>
      <ShopFooter />
    </div>
  )
}


// ── MAIN APP ──────────────────────────────────────────────────────────────────
const App = () => (
  <>
    <ToastContainer position=”top-center” autoClose={3000} />
    <ScrollToTop />
    <Suspense fallback={<PageSpinner />}>
    <Routes>
      {/* Super Admin — must be before /:shopSlug/* to avoid slug capturing “super-admin” */}
      <Route path=”/super-admin/*” element={<SuperAdminSection />} />

      {/* Shop Admin — must be before /:shopSlug/* */}
      <Route path=”/:shopSlug/admin/*” element={<ShopAdminSection />} />

      {/* Stylist Panel — must be before /:shopSlug/* */}
      <Route path=”/:shopSlug/stylist/*” element={<StylistSection />} />

      {/* Customer shop pages */}
      <Route path=”/:shopSlug/*” element={<ShopCustomerSection />} />

      {/* Create Your Own Salon — public form */}
      <Route path=”/create-salon” element={<CreateYourSalon />} />

      {/* Platform root */}
      <Route path="/" element={<PlatformRoot />} />
    </Routes>
    </Suspense>
  </>
)

export default App
