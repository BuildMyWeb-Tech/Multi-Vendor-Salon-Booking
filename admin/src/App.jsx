// admin/src/App.jsx
import React, { useContext } from 'react'
import { DoctorContext } from './context/DoctorContext'
import { AdminContext } from './context/AdminContext'
import { SuperAdminContext } from './context/SuperAdminContext'
import { SalonAdminContext } from './context/SalonAdminContext'
import { Route, Routes, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// ── Legacy Admin components (preserved) ──────────────────────────────────────
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Admin/Dashboard'
import AllAppointments from './pages/Admin/AllAppointments'
import AddDoctor from './pages/Admin/AddDoctor'
import ServiceCategory from './pages/Admin/ServicesCategory'
import DoctorsList from './pages/Admin/DoctorsList'
import Login from './pages/Login'
import DoctorAppointments from './pages/Doctor/DoctorAppointments'
import DoctorDashboard from './pages/Doctor/DoctorDashboard'
import DoctorProfile from './pages/Doctor/DoctorProfile'
import DoctorEarnings from './pages/Doctor/DoctorEarnings'
import MyProfile from './pages/Admin/MyProfile'
import SlotManagement from './pages/Admin/SlotManagement'
import EditStylist from './pages/Admin/EditStylist'

// ── Super Admin components ────────────────────────────────────────────────────
import SuperAdminSidebar from './components/SuperAdminSidebar'
import SuperAdminNavbar from './components/SuperAdminNavbar'
import SuperAdminLogin from './pages/SuperAdmin/SuperAdminLogin'
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard'
import SuperAdminSalons from './pages/SuperAdmin/SuperAdminSalons'
import CreateSalon from './pages/SuperAdmin/CreateSalon'

// ── Salon Admin (new multi-tenant) components ────────────────────────────────
import SalonAdminLogin from './pages/SalonAdminLogin'

const App = () => {
  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)
  const { saToken } = useContext(SuperAdminContext)
  const salonAdminCtx = useContext(SalonAdminContext)
  const { saAdminToken } = salonAdminCtx

  const location = useLocation()
  const isSuperAdminPath = location.pathname.startsWith('/super-admin')
  const isSalonAdminPath = location.pathname.startsWith('/salon-admin')

  // ── SUPER ADMIN SECTION ──────────────────────────────────────────────────
  if (isSuperAdminPath) {
    if (!saToken) {
      return (
        <>
          <ToastContainer />
          <SuperAdminLogin />
        </>
      )
    }
    return (
      <div className="bg-[#F8F9FD] min-h-screen">
        <ToastContainer />
        <SuperAdminSidebar />
        <div className="flex flex-col min-h-screen">
          <div className="md:ml-64 flex flex-col min-h-screen">
            <SuperAdminNavbar />
            <div className="flex-grow p-0">
              <Routes>
                <Route path="/super-admin/dashboard" element={<SuperAdminDashboard />} />
                <Route path="/super-admin/salons" element={<SuperAdminSalons />} />
                <Route path="/super-admin/salons/create" element={<CreateSalon />} />
                <Route path="/super-admin/login" element={<SuperAdminDashboard />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── NEW SALON ADMIN SECTION (/salon-admin/*) ─────────────────────────────
  if (isSalonAdminPath) {
    if (!saAdminToken) {
      return (
        <>
          <ToastContainer />
          <SalonAdminLogin />
        </>
      )
    }
    // Bridge SalonAdminContext values into AdminContext so legacy components work transparently
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
          <ToastContainer />
          <Sidebar />
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="md:ml-20 lg:ml-64 p-4 sm:p-6 pb-20 md:pb-6 flex-grow">
              <Routes>
                <Route path="/salon-admin/dashboard" element={<Dashboard />} />
                <Route path="/salon-admin/appointments" element={<AllAppointments />} />
                <Route path="/salon-admin/slot-management" element={<SlotManagement />} />
                <Route path="/salon-admin/add-stylist" element={<AddDoctor />} />
                <Route path="/salon-admin/edit-stylist/:id" element={<EditStylist />} />
                <Route path="/salon-admin/services" element={<ServiceCategory />} />
                <Route path="/salon-admin/stylists" element={<DoctorsList />} />
                <Route path="/salon-admin/my-profile" element={<MyProfile />} />
              </Routes>
            </div>
          </div>
        </div>
      </AdminContext.Provider>
    )
  }

  // ── LEGACY ADMIN SECTION (unchanged, backward compatible) ────────────────
  return dToken || aToken ? (
    <div className='bg-[#F8F9FD] min-h-screen'>
      <ToastContainer />
      <Sidebar />
      <div className='flex flex-col min-h-screen'>
        <Navbar />
        <div className='md:ml-20 lg:ml-64 p-4 sm:p-6 pb-20 md:pb-6 flex-grow'>
          <Routes>
            {/* Admin Routes */}
            <Route path='/' element={<Dashboard />} />
            <Route path='/all-appointments' element={<AllAppointments />} />
            <Route path='/slot-management' element={<SlotManagement />} />
            <Route path='/add-stylist' element={<AddDoctor />} />
            <Route path="/edit-stylist/:id" element={<EditStylist />} />
            <Route path='/services-category' element={<ServiceCategory />} />
            <Route path='/stylist-list' element={<DoctorsList />} />
            <Route path="/my-profile" element={<MyProfile />} />

            {/* Stylist/Doctor Panel Routes */}
            <Route path='/stylist-dashboard' element={<DoctorDashboard />} />
            <Route path='/stylist-appointments' element={<DoctorAppointments />} />
            <Route path='/stylist-profile' element={<DoctorProfile />} />
            <Route path='/stylist-earnings' element={<DoctorEarnings />} />

            {/* Super Admin redirects (if accessed without /super-admin prefix) */}
            <Route path='/super-admin/*' element={null} />
          </Routes>
        </div>
      </div>
    </div>
  ) : (
    <>
      <ToastContainer />
      <Login />
    </>
  )
}

export default App
