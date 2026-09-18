import React, { useContext, useState, useRef, useEffect } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AdminContext } from '../../context/AdminContext'
import { SalonAdminContext } from '../../context/SalonAdminContext'
import { useNavigate, useParams } from 'react-router-dom'
import { LogOut, User, Menu, X, Scissors, Bell, CheckCheck, Calendar, RefreshCw, XCircle } from 'lucide-react'

const AdminNavbar = ({ shopSlug: shopSlugProp }) => {
  const { dToken, setDToken } = useContext(DoctorContext)
  const { aToken, setAToken } = useContext(AdminContext)
  const {
    adminNotifications = [],
    adminUnreadCount = 0,
    markAdminNotificationsRead,
    getAdminNotifications,
  } = useContext(SalonAdminContext) || {}

  const navigate = useNavigate()
  const params = useParams()
  const slug = shopSlugProp || params.shopSlug || ''

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  const shopDisplayName = slug
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Admin'

  const logout = () => {
    dToken && setDToken('')
    dToken && localStorage.removeItem('dToken')
    aToken && setAToken('')
    aToken && localStorage.removeItem('aToken')
    setMobileMenuOpen(false)
    navigate(slug ? `/${slug}/admin` : '/')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleBellClick = () => {
    setNotifOpen((prev) => !prev)
  }

  const handleMarkAllRead = () => {
    if (markAdminNotificationsRead) markAdminNotificationsRead(null)
  }

  const handleMarkOne = (id) => {
    if (markAdminNotificationsRead) markAdminNotificationsRead(id)
  }

  const notifIcon = (type) => {
    if (type === 'booking_cancelled') return <XCircle size={14} className="text-red-500" />
    if (type === 'booking_rescheduled') return <RefreshCw size={14} className="text-purple-500" />
    return <Calendar size={14} className="text-primary" />
  }

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex justify-between items-center px-4 sm:px-8 py-3">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-500 hover:text-primary"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Scissors size={16} className="text-primary" />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={handleBellClick}
              className="relative w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              title="Notifications"
            >
              <Bell size={18} className="text-gray-600" />
              {adminUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {adminUnreadCount > 99 ? '99+' : adminUnreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-800">
                    Notifications
                    {adminUnreadCount > 0 && (
                      <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                        {adminUnreadCount} new
                      </span>
                    )}
                  </h4>
                  {adminUnreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                    >
                      <CheckCheck size={13} />
                      Mark all read
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                  {adminNotifications.length === 0 ? (
                    <div className="py-10 text-center text-sm text-gray-400">
                      <Bell size={28} className="mx-auto mb-2 text-gray-300" />
                      No notifications yet
                    </div>
                  ) : (
                    adminNotifications.slice(0, 30).map((n) => (
                      <div
                        key={n._id}
                        onClick={() => !n.read && handleMarkOne(n._id)}
                        className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                          !n.read ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                          {notifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.read ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && (
                          <div className="mt-2 shrink-0 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={18} className="text-primary" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">Salon Admin</p>
              <p className="text-xs text-gray-400">{aToken ? 'Administrator' : 'Stylist'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="bg-primary hover:bg-primary/90 text-white text-sm px-4 sm:px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminNavbar
