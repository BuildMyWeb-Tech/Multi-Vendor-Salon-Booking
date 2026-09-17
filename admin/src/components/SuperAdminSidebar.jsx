// admin/src/components/SuperAdminSidebar.jsx
import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { SuperAdminContext } from '../context/SuperAdminContext';
import {
  ShieldCheck, LayoutDashboard, Store, Plus,
  LogOut, MenuIcon, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const navItems = [
  { to: '/super-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/super-admin/salons', icon: Store, label: 'All Salons' },
  { to: '/super-admin/salons/create', icon: Plus, label: 'Create Salon' },
];

const SuperAdminSidebar = () => {
  const { setSaToken } = useContext(SuperAdminContext);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const logout = () => {
    setSaToken('');
    localStorage.removeItem('saToken');
    navigate('/super-admin/login');
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className={`flex flex-col h-full ${mobile ? '' : ''}`}>
      {/* Logo */}
      <div className="py-5 px-5 border-b border-white/10 flex items-center justify-between">
        {!collapsed || mobile ? (
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-purple-400" />
              <h2 className="font-bold text-white text-base">Super Admin</h2>
            </div>
            <p className="text-white/40 text-xs mt-0.5 ml-7">Platform Console</p>
          </div>
        ) : (
          <ShieldCheck size={22} className="text-purple-400 mx-auto" />
        )}
        {!mobile && (
          <button onClick={() => setCollapsed(!collapsed)} className="text-white/40 hover:text-white/70 p-1 rounded-md transition-colors">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/super-admin/dashboard'}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all font-medium ${
                isActive
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              } ${collapsed && !mobile ? 'justify-center' : ''}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:bg-red-500/20 hover:text-red-400 transition-all ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {(!collapsed || mobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="fixed top-2 left-2 z-50 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="bg-slate-800 p-2 rounded-xl shadow-lg text-purple-400 hover:bg-slate-700 transition-all"
        >
          {!mobileOpen && <MenuIcon size={22} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X size={20} />
            </button>
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={`hidden md:flex flex-col h-screen bg-gradient-to-b from-slate-900 to-slate-800 fixed z-40 transition-all duration-300 shadow-2xl ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default SuperAdminSidebar;
