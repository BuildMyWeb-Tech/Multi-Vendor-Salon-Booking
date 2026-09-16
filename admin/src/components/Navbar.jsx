import React, { useContext, useState, useEffect } from 'react'
import { DoctorContext } from '../context/DoctorContext'
import { AdminContext } from '../context/AdminContext'
import { useNavigate, Link } from 'react-router-dom'
import { 
  LogOut, 
  Bell, 
  Search, 
  User,
  Moon,
  Sun,
  Menu,
  Calendar,
  Grid,
  ChevronDown,
  Settings,
  LayoutGrid,
  LayoutList,
  Scissors
} from 'lucide-react'

const Navbar = () => {
  const { dToken, setDToken } = useContext(DoctorContext)
  const { aToken, setAToken } = useContext(AdminContext)
  const navigate = useNavigate()
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [viewType, setViewType] = useState('grid') // 'grid' or 'list'
  const [notificationCount, setNotificationCount] = useState(3)

  // Effect to apply dark mode classes to the document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark-theme')
    }
  }, [darkMode])

  // Check for user preference on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setDarkMode(true)
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('theme', newMode ? 'dark' : 'light')
  }

  const logout = () => {
    navigate('/')
    dToken && setDToken('')
    dToken && localStorage.removeItem('dToken')
    aToken && setAToken('')
    aToken && localStorage.removeItem('aToken')
    setMobileMenuOpen(false)
  }

  return (
    <div className={`sticky top-0 z-30 transition-colors duration-200 ${darkMode ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-800'} border-b shadow-sm`}>
      {/* Main Navbar */}
      <div className='flex justify-between items-center px-4 sm:px-8 py-3'>
        {/* Left Section with Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-primary-light transition-colors"
          >
            <Menu size={22} />
          </button>
          
          {/* Logo/Title */}
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-md bg-primary ${darkMode ? 'bg-opacity-20' : 'bg-opacity-10'} flex items-center justify-center text-primary mr-2`}>
              <Scissors size={16} className="text-primary" />
            </div>
            <h1 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} hidden sm:block`}>StyleStudio Admin</h1>
            <h1 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'} sm:hidden`}>StyleStudio</h1>
          </div>
        </div>

        {/* Center Section - View Type Switcher (visible only on larger screens and specific pages) */}
        {/* <div className="hidden md:flex items-center gap-2">
          <div className={`border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-lg p-1 flex items-center`}>
            <button 
              onClick={() => setViewType('grid')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1 text-sm font-medium transition-colors ${
                viewType === 'grid' 
                  ? `bg-primary text-white` 
                  : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`
              }`}
            >
              <LayoutGrid size={16} />
              <span>Grid</span>
            </button>
            
            <button 
              onClick={() => setViewType('list')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1 text-sm font-medium transition-colors ${
                viewType === 'list' 
                  ? `bg-primary text-white` 
                  : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`
              }`}
            >
              <LayoutList size={16} />
              <span>List</span>
            </button>
            
            <button 
              onClick={() => setViewType('calendar')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1 text-sm font-medium transition-colors ${
                viewType === 'calendar' 
                  ? `bg-primary text-white` 
                  : `${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`
              }`}
            >
              <Calendar size={16} />
              <span>Calendar</span>
            </button>
          </div>
        </div> */}

        {/* Right Section */}
        <div className='flex items-center gap-3 sm:gap-4'>
          {/* Search Button - Shows/hides search field */}
          {/* <button className={`hidden sm:flex items-center justify-center w-9 h-9 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
            <Search className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`} size={18} />
          </button> */}
          
          {/* Notifications */}
          {/* <div className="relative cursor-pointer">
            <button className={`flex items-center justify-center w-9 h-9 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
              <Bell size={18} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {notificationCount}
              </span>
            )}
          </div> */}
          
          {/* Theme Switcher */}
          {/* <button 
            onClick={toggleDarkMode}
            className={`flex items-center justify-center w-9 h-9 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun size={18} className="text-yellow-400" />
            ) : (
              <Moon size={18} className="text-gray-600" />
            )}
          </button> */}
          
          {/* User Profile */}
          <div className={`hidden sm:flex items-center gap-2 pl-4 border-l ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`w-9 h-9 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-primary-light'} flex items-center justify-center`}>
              <User size={18} className={darkMode ? 'text-gray-300' : 'text-primary'} />
            </div>
            <div className="hidden md:block">
              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Salon Admin</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{aToken ? 'Administrator' : 'Stylist'}</p>
            </div>
          </div>
          
          {/* Logout Button */}
          <button
            onClick={logout}
            className='bg-primary hover:bg-primary-dark text-white text-sm px-4 sm:px-6 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm hover:shadow'
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu - Only shown when mobileMenuOpen is true */}
      {mobileMenuOpen && (
        <div className={`md:hidden ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-t py-2 px-4`}>
          <div className="space-y-3">
            {/* Mobile View Type Switcher */}
            <div className={`border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} rounded-lg p-1 flex items-center justify-between`}>
              <button 
                onClick={() => setViewType('grid')}
                className={`flex-1 py-2 rounded-md flex items-center justify-center gap-1 text-sm font-medium transition-colors ${
                  viewType === 'grid' 
                    ? `bg-primary text-white` 
                    : `${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                }`}
              >
                <LayoutGrid size={16} />
                <span>Grid</span>
              </button>
              
              <button 
                onClick={() => setViewType('list')}
                className={`flex-1 py-2 rounded-md flex items-center justify-center gap-1 text-sm font-medium transition-colors ${
                  viewType === 'list' 
                    ? `bg-primary text-white` 
                    : `${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                }`}
              >
                <LayoutList size={16} />
                <span>List</span>
              </button>
              
              <button 
                onClick={() => setViewType('calendar')}
                className={`flex-1 py-2 rounded-md flex items-center justify-center gap-1 text-sm font-medium transition-colors ${
                  viewType === 'calendar' 
                    ? `bg-primary text-white` 
                    : `${darkMode ? 'text-gray-400' : 'text-gray-600'}`
                }`}
              >
                <Calendar size={16} />
                <span>Calendar</span>
              </button>
            </div>
            
            {/* Search Bar on Mobile */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className={`pl-10 pr-4 py-2 text-sm border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  darkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
              />
            </div>
            
            {/* Navigation Links */}
            <div className={`space-y-1 pt-2 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  darkMode 
                    ? 'hover:bg-gray-800 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Grid size={18} />
                <span>Dashboard</span>
              </Link>
              
              <Link 
                to="/settings" 
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  darkMode 
                    ? 'hover:bg-gray-800 text-gray-300' 
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Settings size={18} />
                <span>Settings</span>
              </Link>
            </div>
            
            {/* User Info on Mobile */}
            <div className={`pt-3 mt-3 border-t ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-primary-light'} flex items-center justify-center`}>
                  <User size={20} className={darkMode ? 'text-gray-300' : 'text-primary'} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Admin User</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{aToken ? 'Administrator' : 'Stylist'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS for dark theme support */}
      <style jsx>{`
        .dark-theme {
          --color-bg-primary: #1e1e2d;
          --color-bg-secondary: #252636;
          --color-text-primary: #e2e8f0;
          --color-text-secondary: #a0aec0;
          --color-border: #2d3748;
        }
        
        .primary-light {
          color: var(--color-primary-light, #a78bfa);
          background-color: var(--color-primary-light-bg, rgba(167, 139, 250, 0.1));
        }
      `}</style>
    </div>
  )
}

export default Navbar
