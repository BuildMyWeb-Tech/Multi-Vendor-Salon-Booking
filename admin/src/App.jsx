import React, { useContext } from 'react'
import { DoctorContext } from './context/DoctorContext';
import { AdminContext } from './context/AdminContext';
import { Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Admin/Dashboard';
import AllAppointments from './pages/Admin/AllAppointments';
import AddDoctor from './pages/Admin/AddDoctor';
import ServiceCategory from './pages/Admin/ServicesCategory';
import DoctorsList from './pages/Admin/DoctorsList';
import Login from './pages/Login';
import DoctorAppointments from './pages/Doctor/DoctorAppointments';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import DoctorEarnings from './pages/Doctor/DoctorEarnings'; // ✅ NEW
import MyProfile from './pages/Admin/MyProfile';
import SlotManagement from './pages/Admin/SlotManagement';
import EditStylist from './pages/Admin/EditStylist';

const App = () => {
  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)

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
            <Route path='/stylist-earnings' element={<DoctorEarnings />} /> {/* ✅ NEW */}
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