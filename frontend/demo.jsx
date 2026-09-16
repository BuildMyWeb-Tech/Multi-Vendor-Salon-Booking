// import React, { useContext, useState, useEffect } from 'react'
// import { assets } from '../assets/assets'
// import { NavLink, useNavigate, useLocation } from 'react-router-dom'
// import { AppContext } from '../context/AppContext'
// import { Home, LayoutGrid, Calendar, CalendarCheck, User, Scissors, Info, Phone, X, Menu, Download } from 'lucide-react'

// const Navbar = () => {
//   const navigate = useNavigate()
//   const location = useLocation()
//   const [showMenu, setShowMenu] = useState(false)
//   const [scrolled, setScrolled] = useState(false)
//   const [installPrompt, setInstallPrompt] = useState(null)
//   const { token, setToken, userData } = useContext(AppContext)

//   // Check if PWA is already installed
//   const isPWAInstalled =
//     window.matchMedia('(display-mode: standalone)').matches ||
//     window.navigator.standalone === true

//   // Capture install prompt
//   useEffect(() => {
//     const handler = (e) => {
//       e.preventDefault()
//       setInstallPrompt(e)
//     }
//     window.addEventListener('beforeinstallprompt', handler)
//     return () => window.removeEventListener('beforeinstallprompt', handler)
//   }, [])

//   // Handle scroll event for navbar appearance change
//   useEffect(() => {
//     const handleScroll = () => {
//       if (window.scrollY > 50) {
//         setScrolled(true)
//       } else {
//         setScrolled(false)
//       }
//     }
    
//     window.addEventListener('scroll', handleScroll)
//     return () => {
//       window.removeEventListener('scroll', handleScroll)
//     }
//   }, [])

//   const logout = () => {
//     localStorage.removeItem('token')
//     setToken(false)
//     navigate('/login')
//   }

//   const isActive = (path) => {
//     return location.pathname === path
//   }

//   // Install app function
//   const installApp = async () => {
//     if (!installPrompt) {
//       alert('App installation is not available on this device/browser')
//       return
//     }

//     await installPrompt.prompt()
//     const choice = await installPrompt.userChoice

//     if (choice.outcome === 'accepted') {
//       localStorage.setItem('app_installed', 'true')
//     }

//     setInstallPrompt(null)
//   }

//   return (
//     <>
//       {/* Main Navigation */}
//       <nav className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-2' : 'bg-white/95 py-4'}`}>
//         <div className='container mx-auto px-4 flex items-center justify-between'>
//           {/* Logo */}
//           <h1
//             onClick={() => navigate('/')}
//             className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent cursor-pointer'
//           >
//             StyleStudio
//           </h1>
          
//           {/* Desktop Navigation */}
//           <ul className='hidden md:flex items-center gap-8 font-medium'>
//             <NavLink to='/' className={({isActive}) => isActive ? 'text-primary' : 'hover:text-primary transition-colors'}>
//               <li className='py-1 relative group'>
//                 HOME
//                 <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 ${isActive ? 'w-full' : 'group-hover:w-full'}`}></span>
//               </li>
//             </NavLink>
//             <NavLink to='/stylists' className={({isActive}) => isActive ? 'text-primary' : 'hover:text-primary transition-colors'}>
//               <li className='py-1 relative group'>
//                 STYLISTS
//                 <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 ${isActive ? 'w-full' : 'group-hover:w-full'}`}></span>
//               </li>
//             </NavLink>
//             <NavLink to='/services' className={({isActive}) => isActive ? 'text-primary' : 'hover:text-primary transition-colors'}>
//               <li className='py-1 relative group'>
//                 SERVICES
//                 <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 ${isActive ? 'w-full' : 'group-hover:w-full'}`}></span>
//               </li>
//             </NavLink>
//             <NavLink to='/about' className={({isActive}) => isActive ? 'text-primary' : 'hover:text-primary transition-colors'}>
//               <li className='py-1 relative group'>
//                 ABOUT
//                 <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 ${isActive ? 'w-full' : 'group-hover:w-full'}`}></span>
//               </li>
//             </NavLink>
//             <NavLink to='/contact' className={({isActive}) => isActive ? 'text-primary' : 'hover:text-primary transition-colors'}>
//               <li className='py-1 relative group'>
//                 CONTACT
//                 <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 ${isActive ? 'w-full' : 'group-hover:w-full'}`}></span>
//               </li>
//             </NavLink>
//           </ul>

//           {/* Desktop User Menu/Login */}
//           <div className='hidden md:flex items-center gap-4'>
//             {/* Download App Button - Desktop */}
//             {!isPWAInstalled && installPrompt && (
//               <button 
//                 onClick={installApp}
//                 className='flex items-center gap-2 px-4 py-2 border-2 border-primary text-primary rounded-md hover:bg-primary hover:text-white transition-all duration-300 font-medium'
//               >
//                 <Download size={18} />
//                 Download App
//               </button>
//             )}

//             {token && userData ? (
//               <div className='flex items-center gap-2 cursor-pointer group relative'>
//                 <div className='w-10 h-10 rounded-full overflow-hidden border-2 border-primary'>
//                   <img className='w-full h-full object-cover' src={userData.image} alt="" />
//                 </div>
//                 <span className="font-medium text-gray-700 hidden lg:block">{userData.name?.split(' ')[0]}</span>
//                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-chevron-down"><polyline points="6 9 12 15 18 9"></polyline></svg>
                
//                 {/* Dropdown menu */}
//                 <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
//                   <div className='min-w-48 bg-white rounded-lg shadow-lg border flex flex-col overflow-hidden'>
//                     <p className='px-6 py-3 font-semibold text-gray-500 bg-gray-50 border-b'>{userData.name}</p>
//                     <NavLink to='/my-profile' className='px-6 py-3 hover:bg-gray-50 hover:text-primary transition-colors'>
//                       My Profile
//                     </NavLink>
//                     <NavLink to='/my-appointments' className='px-6 py-3 hover:bg-gray-50 hover:text-primary transition-colors'>
//                       My Appointments
//                     </NavLink>
//                     <button 
//                       onClick={logout} 
//                       className='px-6 py-3 text-left hover:bg-gray-50 hover:text-red-500 transition-colors'
//                     >
//                       Logout
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ) : (
//               <button 
//                 onClick={() => navigate('/login')} 
//                 className='bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-all duration-300 flex items-center gap-2 font-medium'
//               >
//                 <User size={18} />
//                 Login / Register
//               </button>
//             )}
//           </div>
          
//           {/* Mobile menu toggle */}
//           <button onClick={() => setShowMenu(true)} className='md:hidden flex items-center justify-center'>
//             <Menu size={24} className="text-gray-700" />
//           </button>
//         </div>
//       </nav>

//       {/* Mobile Menu Overlay */}
//       {showMenu && (
//         <div 
//           className="fixed inset-0 bg-black/50 z-40"
//           onClick={() => setShowMenu(false)}
//         ></div>
//       )}

//       {/* Mobile Side Menu */}
//       <div className={`fixed top-0 bottom-0 right-0 w-4/5 max-w-sm bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}>
//         <div className='flex flex-col h-full'>
//           {/* Header */}
//           <div className='flex items-center justify-between p-5 border-b'>
//             <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
//               StyleStudio
//             </h1>
//             <button onClick={() => setShowMenu(false)}>
//               <X size={24} className="text-gray-700" />
//             </button>
//           </div>
          
//           {/* User Info (if logged in) */}
//           {token && userData && (
//             <div className='p-5 border-b flex items-center gap-3'>
//               <div className='w-12 h-12 rounded-full overflow-hidden border-2 border-primary'>
//                 <img className='w-full h-full object-cover' src={userData.image} alt={userData.name} />
//               </div>
//               <div>
//                 <p className='font-medium text-gray-800'>{userData.name}</p>
//                 <p className='text-sm text-gray-500'>{userData.email}</p>
//               </div>
//             </div>
//           )}
          
//           {/* Menu Items */}
//           <div className='flex-1 overflow-y-auto p-5'>
//             <ul className='space-y-2'>
//               <NavLink 
//                 to='/' 
//                 className={({isActive}) => `flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
//                 onClick={() => setShowMenu(false)}
//               >
//                 <Home size={20} />
//                 <span>Home</span>
//               </NavLink>
              
//               <NavLink 
//                 to='/services' 
//                 className={({isActive}) => `flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
//                 onClick={() => setShowMenu(false)}
//               >
//                 <LayoutGrid size={20} />
//                 <span>Services</span>
//               </NavLink>
              
//               <NavLink 
//                 to='/stylists' 
//                 className={({isActive}) => `flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
//                 onClick={() => setShowMenu(false)}
//               >
//                 <Scissors size={20} />
//                 <span>Stylists</span>
//               </NavLink>
              
//               {token && userData && (
//                 <NavLink 
//                   to='/my-appointments' 
//                   className={({isActive}) => `flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
//                   onClick={() => setShowMenu(false)}
//                 >
//                   <Calendar size={20} />
//                   <span>My Appointments</span>
//                 </NavLink>
//               )}
              
//               <NavLink 
//                 to='/about' 
//                 className={({isActive}) => `flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
//                 onClick={() => setShowMenu(false)}
//               >
//                 <Info size={20} />
//                 <span>About Us</span>
//               </NavLink>
              
//               <NavLink 
//                 to='/contact' 
//                 className={({isActive}) => `flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
//                 onClick={() => setShowMenu(false)}
//               >
//                 <Phone size={20} />
//                 <span>Contact</span>
//               </NavLink>
              
//               {token && userData && (
//                 <NavLink 
//                   to='/my-profile' 
//                   className={({isActive}) => `flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-100'}`}
//                   onClick={() => setShowMenu(false)}
//                 >
//                   <User size={20} />
//                   <span>My Profile</span>
//                 </NavLink>
//               )}

//               {/* Download App in Mobile Menu */}
//               {!isPWAInstalled && installPrompt && (
//                 <button 
//                   onClick={() => {
//                     installApp()
//                     setShowMenu(false)
//                   }}
//                   className='flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-gray-100 w-full'
//                 >
//                   <Download size={20} />
//                   <span>Download App</span>
//                 </button>
//               )}
//             </ul>
//           </div>
          
//           {/* Footer Actions */}
//           <div className='p-5 border-t'>
//             {token && userData ? (
//               <button 
//                 onClick={() => {
//                   logout()
//                   setShowMenu(false)
//                 }}
//                 className='w-full py-3 text-center text-red-500 border border-red-500 rounded-lg hover:bg-red-50 transition-colors'
//               >
//                 Logout
//               </button>
//             ) : (
//               <button 
//                 onClick={() => {
//                   navigate('/login')
//                   setShowMenu(false)
//                 }}
//                 className='w-full py-3 text-center bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors'
//               >
//                 Login / Register
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Bottom Mobile Navigation */}
//       <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30 px-2 py-2">
//         <div className="flex justify-around">
          
//           <NavLink to="/" className={({isActive}) => `flex flex-col items-center p-1 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
//             <Home size={20} />
//             <span className="text-xs mt-1">Home</span>
//           </NavLink>

//           <NavLink to="/services" className={({isActive}) => `flex flex-col items-center p-1 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
//             <LayoutGrid size={20} />
//             <span className="text-xs mt-1">Service</span>
//           </NavLink>

//           <NavLink to="/stylists" className={({isActive}) => `flex flex-col items-center p-1 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
//             <Scissors size={20} />
//             <span className="text-xs mt-1">Stylist</span>
//           </NavLink>

//           <NavLink to="/my-appointments" className={({isActive}) => `flex flex-col items-center p-1 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
//             <CalendarCheck size={20} />
//             <span className="text-xs mt-1">Booking</span>
//           </NavLink>

//           <NavLink to="/my-profile" className={({isActive}) => `flex flex-col items-center p-1 ${isActive ? 'text-primary' : 'text-gray-500'}`}>
//             <User size={20} />
//             <span className="text-xs mt-1">Profile</span>
//           </NavLink>
//         </div>
//       </div>
      
//       {/* Spacer for fixed navbar */}
//       <div className="h-20"></div>
//       {/* Spacer for bottom nav on mobile */}
//       <div className="md:h-0"></div>
//     </>
//   )
// }

// export default Navbar

// // App.jsx
// import React, { useEffect, useState } from 'react'
// import { Routes, Route, useLocation } from 'react-router-dom'

// import Navbar from './components/Navbar'
// import Footer from './components/Footer'
// import ScrollToTop from './components/ScrollToTop'

// import Home from './pages/Home'
// import Doctors from './pages/Doctors'
// import Login from './pages/Login'
// import About from './pages/About'
// import Contact from './pages/Contact'
// import Appointment from './pages/Appointment'
// import MyAppointments from './pages/MyAppointments'
// import MyProfile from './pages/MyProfile'
// import Verify from './pages/Verify'
// import Services from './pages/Services'

// import { ToastContainer } from 'react-toastify'
// import 'react-toastify/dist/ReactToastify.css'

// // import { X, Download } from 'lucide-react' // ❌ PWA UI icons

// const App = () => {
//   const location = useLocation()

//   // ❌ PWA install state
//   // const [installPrompt, setInstallPrompt] = useState(null)
//   // const [showInstallModal, setShowInstallModal] = useState(false)

//   // let popupTimer = null
//   // let popupInterval = null

//   /* ================================
//      ❌ CHECK IF APP IS ALREADY INSTALLED (PWA)
//   ================================= */
//   /*
//   const isPWAInstalled =
//     window.matchMedia('(display-mode: standalone)').matches ||
//     window.navigator.standalone === true
//   */

//   /* ================================
//      ❌ CAPTURE PWA INSTALL PROMPT
//   ================================= */
//   /*
//   useEffect(() => {
//     const handler = (e) => {
//       e.preventDefault()
//       setInstallPrompt(e)
//     }

//     window.addEventListener('beforeinstallprompt', handler)

//     return () => window.removeEventListener('beforeinstallprompt', handler)
//   }, [])
//   */

//   /* ================================
//      ❌ PWA POPUP DISPLAY LOGIC
//   ================================= */
//   /*
//   useEffect(() => {
//     if (location.pathname === '/login') return
//     if (isPWAInstalled) return
//     if (localStorage.getItem('app_installed') === 'true') return

//     const laterClicked = localStorage.getItem('install_later')

//     if (!laterClicked) {
//       popupTimer = setTimeout(() => {
//         setShowInstallModal(true)
//       }, 5000)
//     }

//     if (laterClicked === 'true') {
//       popupInterval = setInterval(() => {
//         setShowInstallModal(true)
//       }, 60000)
//     }

//     return () => {
//       clearTimeout(popupTimer)
//       clearInterval(popupInterval)
//     }
//   }, [location])
//   */

//   /* ================================
//      ❌ ESC KEY CLOSE (PWA MODAL)
//   ================================= */
//   /*
//   useEffect(() => {
//     const escHandler = (e) => {
//       if (e.key === 'Escape') setShowInstallModal(false)
//     }

//     document.addEventListener('keydown', escHandler)
//     return () => document.removeEventListener('keydown', escHandler)
//   }, [])
//   */

//   /* ================================
//      ❌ INSTALL APP (PWA)
//   ================================= */
//   /*
//   const installApp = async () => {
//     if (!installPrompt) return

//     await installPrompt.prompt()
//     const choice = await installPrompt.userChoice

//     if (choice.outcome === 'accepted') {
//       localStorage.setItem('app_installed', 'true')
//     }

//     setShowInstallModal(false)
//     setInstallPrompt(null)
//   }
//   */

//   /* ================================
//      ❌ MAYBE LATER (PWA)
//   ================================= */
//   /*
//   const handleMaybeLater = () => {
//     localStorage.setItem('install_later', 'true')
//     setShowInstallModal(false)
//   }
//   */

//   return (
//     <div className="min-h-screen flex flex-col">
//       <ToastContainer position="top-center" autoClose={3000} />

//       <Navbar />
//       <ScrollToTop />

//       {/* ❌ INSTALL MODAL (PWA ONLY – DISABLED) */}
//       {/*
//       {showInstallModal && (
//         <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
//           <div className="relative w-[90%] max-w-sm rounded-xl bg-white p-6 text-center shadow-xl animate-fadeIn">

//             <button
//               onClick={() => setShowInstallModal(false)}
//               className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
//             >
//               <X size={18} />
//             </button>

//             <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
//               <Download size={26} />
//             </div>

//             <h2 className="text-xl font-semibold">Install StyleStudio App</h2>
//             <p className="mt-2 text-sm text-gray-600">
//               Book appointments faster with our app experience.
//             </p>

//             <button
//               onClick={installApp}
//               className="mt-5 w-full rounded-lg bg-primary py-3 text-white font-medium hover:bg-primary/90"
//             >
//               Install App
//             </button>

//             <button
//               onClick={handleMaybeLater}
//               className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700"
//             >
//               Maybe later
//             </button>
//           </div>
//         </div>
//       )}
//       */}

//       {/* ===== ROUTES ===== */}
//       <main className="flex-grow">
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/stylists" element={<Doctors />} />
//           <Route path="/services" element={<Services />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/about" element={<About />} />
//           <Route path="/contact" element={<Contact />} />
//           <Route path="/appointment/:docId" element={<Appointment />} />
//           <Route path="/my-appointments" element={<MyAppointments />} />
//           <Route path="/my-profile" element={<MyProfile />} />
//           <Route path="/verify" element={<Verify />} />
//         </Routes>
//       </main>

//       <Footer />
//     </div>
//   )
// }

// export default App
// index.css file:
// @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
// @tailwind base;
// @tailwind components;
// @tailwind utilities;
// * {
//     font-family: Outfit;
// }

// .active hr {
//     @apply block
// }

// @media (max-width:740px) {
//     .active p {
//         @apply text-white bg-primary
//     }
// }

// ::-webkit-scrollbar {
//     @apply hidden
// }


// /* index.css */

// @keyframes fadeIn {
//     from {
//         opacity: 0;
//         transform: scale(0.95);
//     }
//     to {
//         opacity: 1;
//         transform: scale(1);
//     }
// }

// .animate-fadeIn {
//     animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
// }

// @keyframes slideUp {
//     from {
//         opacity: 0;
//         transform: translateY(20px);
//     }
//     to {
//         opacity: 1;
//         transform: translateY(0);
//     }
// }

// .animate-slideUp {
//     animation: slideUp 0.4s ease-out;
// }

// @keyframes pulse {
//     0% {
//         box-shadow: 0 0 0 0 rgba(var(--color-primary), 0.5);
//     }
//     70% {
//         box-shadow: 0 0 0 10px rgba(var(--color-primary), 0);
//     }
//     100% {
//         box-shadow: 0 0 0 0 rgba(var(--color-primary), 0);
//     }
// }

// .pulse {
//     animation: pulse 2s infinite;
// }

// @supports (backdrop-filter: blur(4px)) {
//     .backdrop-blur-sm {
//         backdrop-filter: blur(4px);
//     }
// }
// update the above code remove popup PWA and add The PWA  Download the APP in lap view After the contact navlink and in mobile view add after My profile to show Download the APP  and if i click that it will download the PWA app and use lucide react icons.
