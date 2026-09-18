import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { ShopContext } from '../context/ShopContext';
import {
  Home, Scissors, UserCog, Calendar, Phone, BookOpen,
  X, Menu, User, LogOut, Bell, ChevronDown, Sparkles, Smartphone, Download,
} from 'lucide-react';

const ShopNavbar = () => {
  const navigate = useNavigate();
  const { shopSlug } = useParams();
  const { token, setToken, userData, backendUrl, userNotifications, userUnreadCount, markUserNotificationsRead } = useContext(AppContext);
  const { currentShop } = useContext(ShopContext);

  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  // Use context-managed notifications (real-time via socket)
  const notifications = userNotifications;
  const unreadCount = userUnreadCount;

  const shopName = currentShop?.shopName || (shopSlug ? shopSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Salon');
  const s = shopSlug || '';

  const isPWAInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const close = (e) => {
      if (showUserDropdown && !e.target.closest('.user-dropdown-container')) setShowUserDropdown(false);
      if (showNotifications && !e.target.closest('.notification-container')) setShowNotifications(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showUserDropdown, showNotifications]);

  const logout = () => {
    localStorage.removeItem('token');
    setToken(false);
    setShowMenu(false);
    navigate(`/${s}/login`);
  };

  const markAllRead = () => markUserNotificationsRead();

  const navLinks = [
    { to: `/${s}`, label: 'HOME', icon: Home },
    { to: `/${s}/stylists`, label: 'STYLISTS', icon: UserCog },
    { to: `/${s}/services`, label: 'SERVICES', icon: Scissors },
    { to: `/${s}/contact`, label: 'CONTACT', icon: Phone },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-lg py-2' : 'bg-white/90 backdrop-blur-sm py-3'}`}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          {/* Logo */}
          <h1
            onClick={() => navigate(`/${s}`)}
            className="text-2xl font-bold bg-gradient-to-r from-primary via-blue-500 to-primary bg-clip-text text-transparent cursor-pointer flex items-center gap-2"
          >
            {currentShop?.logo && (
              <img src={currentShop.logo} alt={shopName} className="w-8 h-8 rounded-lg object-cover" />
            )}
            {shopName}
          </h1>

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-8 font-medium text-sm">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === `/${s}`}
                className={({ isActive }) => isActive ? 'text-primary' : 'hover:text-primary transition-colors'}
              >
                <li className="py-1 relative group">
                  {label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                </li>
              </NavLink>
            ))}
          </ul>

          {/* Right */}
          <div className="hidden md:flex items-center gap-3">
            {token && userData && (
              <div className="notification-container relative">
                <button
                  onClick={() => { setShowNotifications(!showNotifications); if (!showNotifications && unreadCount > 0) markAllRead(); }}
                  className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-30 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                      <span className="font-semibold text-gray-800 text-sm">Notifications</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-400 text-sm">No notifications yet</div>
                      ) : notifications.map((n) => (
                        <div key={n._id} className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${!n.read ? 'bg-orange-50' : ''}`}
                          onClick={() => { navigate(`/${s}/my-appointments`); setShowNotifications(false); }}>
                          <p className="text-xs font-semibold text-gray-800">{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {token && userData ? (
              <div className="user-dropdown-container relative">
                <div
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-full border"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 bg-gray-100">
                    {userData.image
                      ? <img className="w-full h-full object-cover" src={userData.image} alt="" />
                      : <User size={18} className="text-gray-400 m-auto mt-1" />}
                  </div>
                  <span className="font-medium text-gray-700 hidden lg:block text-sm">{userData.name?.split(' ')[0]}</span>
                  <ChevronDown size={16} className={`text-gray-500 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                </div>
                {showUserDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b bg-gray-50">
                      <p className="font-semibold text-gray-800 text-sm">{userData.name}</p>
                      <p className="text-xs text-gray-500">{userData.email}</p>
                    </div>
                    <div className="p-2">
                      <NavLink to={`/${s}/my-profile`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm" onClick={() => setShowUserDropdown(false)}>
                        <User size={16} className="text-primary" /> My Profile
                      </NavLink>
                      <NavLink to={`/${s}/my-appointments`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm" onClick={() => setShowUserDropdown(false)}>
                        <Calendar size={16} className="text-primary" /> My Appointments
                      </NavLink>
                      <button onClick={() => { logout(); setShowUserDropdown(false); }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-500 w-full text-left text-sm">
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate(`/${s}/login`)}
                className="bg-primary text-white px-5 py-2 rounded-full hover:bg-primary/90 shadow-md flex items-center gap-2 font-medium text-sm"
              >
                <User size={16} /> Login / Register
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button onClick={() => setShowMenu(true)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Menu size={20} className="text-gray-700" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {showMenu && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowMenu(false)} />}

      {/* Mobile side menu */}
      <div className={`fixed top-0 bottom-0 right-0 w-4/5 max-w-sm bg-white z-50 shadow-xl transform transition-transform duration-300 ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">{shopName}</h1>
            <button onClick={() => setShowMenu(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
              <X size={20} className="text-gray-700" />
            </button>
          </div>
          {token && userData && (
            <div className="p-5 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/30 bg-gray-100 flex items-center justify-center">
                  {userData.image ? <img className="w-full h-full object-cover" src={userData.image} alt="" /> : <User size={20} className="text-gray-400" />}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{userData.name}</p>
                  <p className="text-sm text-gray-500">{userData.email}</p>
                </div>
              </div>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end={to === `/${s}`}
                  className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setShowMenu(false)}>
                  <Icon size={20} /> <span>{label.charAt(0) + label.slice(1).toLowerCase()}</span>
                </NavLink>
              ))}
              {token && userData && (
                <>
                  <NavLink to={`/${s}/my-appointments`}
                    className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setShowMenu(false)}>
                    <Calendar size={20} /> <span>My Appointments</span>
                  </NavLink>
                  <NavLink to={`/${s}/my-profile`}
                    className={({ isActive }) => `flex items-center gap-3 p-3 rounded-lg ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                    onClick={() => setShowMenu(false)}>
                    <User size={20} /> <span>My Profile</span>
                  </NavLink>
                </>
              )}
            </ul>
          </div>
          <div className="p-5 border-t">
            {token && userData ? (
              <button onClick={logout}
                className="w-full py-3 text-center text-red-500 border border-red-300 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2">
                <LogOut size={18} /> Logout
              </button>
            ) : (
              <button onClick={() => { navigate(`/${s}/login`); setShowMenu(false); }}
                className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2">
                <User size={18} /> Login / Register
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30 px-2 py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around">
          {[
            { to: `/${s}`, icon: Home, label: 'Home', end: true },
            { to: `/${s}/services`, icon: Scissors, label: 'Services' },
            { to: `/${s}/stylists`, icon: UserCog, label: 'Stylists' },
            { to: `/${s}/my-appointments`, icon: Calendar, label: 'Bookings' },
          ].map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex flex-col items-center p-1 ${isActive ? 'text-primary font-medium' : 'text-gray-500'}`}>
              <Icon size={20} />
              <span className="text-xs mt-1">{label}</span>
            </NavLink>
          ))}
          {token && userData ? (
            <NavLink to={`/${s}/my-profile`}
              className={({ isActive }) => `flex flex-col items-center p-1 ${isActive ? 'text-primary font-medium' : 'text-gray-500'}`}>
              <User size={20} />
              <span className="text-xs mt-1">Profile</span>
            </NavLink>
          ) : (
            <NavLink to={`/${s}/login`}
              className={({ isActive }) => `flex flex-col items-center p-1 ${isActive ? 'text-primary font-medium' : 'text-gray-500'}`}>
              <User size={20} />
              <span className="text-xs mt-1">Login</span>
            </NavLink>
          )}
        </div>
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-20" />
    </>
  );
};

export default ShopNavbar;
