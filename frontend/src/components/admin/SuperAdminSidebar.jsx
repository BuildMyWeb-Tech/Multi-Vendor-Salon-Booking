import React, { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { SuperAdminContext } from '../../context/SuperAdminContext';
import {
  ShieldCheck, LayoutDashboard, Store, Plus,
  LogOut, MenuIcon, X, ChevronLeft, ChevronRight, Scissors
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
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="py-4 px-4 border-b border-gray-100 flex items-center justify-between min-h-[64px]">
        {(!collapsed || mobile) ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Scissors size={15} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-sm leading-none">Super Admin</h2>
              <p className="text-gray-400 text-xs mt-0.5">Platform Console</p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Scissors size={15} className="text-white" />
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/super-admin/dashboard'}
            onClick={() => mobile && setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all font-medium ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${collapsed && !mobile ? 'justify-center' : ''}`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {(!collapsed || mobile) && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Super Admin Badge */}
      {(!collapsed || mobile) && (
        <div className="mx-2 mb-2 px-3 py-2.5 bg-primary/5 rounded-xl border border-primary/10">
          <div className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-primary" />
            <span className="text-xs font-medium text-primary">Super Admin</span>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          <LogOut size={17} className="flex-shrink-0" />
          {(!collapsed || mobile) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="fixed top-3 left-3 z-50 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="bg-white border border-gray-200 p-2 rounded-xl shadow-sm text-primary"
        >
          {!mobileOpen && <MenuIcon size={20} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full bg-white shadow-2xl border-r border-gray-200">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <SidebarContent mobile />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-200 fixed z-40 transition-all duration-300 shadow-sm ${collapsed ? 'w-16' : 'w-64'}`}
      >
        <SidebarContent />
      </div>
    </>
  );
};

export default SuperAdminSidebar;
