// admin/src/components/SuperAdminNavbar.jsx
import React, { useContext } from 'react';
import { SuperAdminContext } from '../../context/SuperAdminContext';
import { ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuperAdminNavbar = () => {
  const { setSaToken } = useContext(SuperAdminContext);
  const navigate = useNavigate();

  const logout = () => {
    setSaToken('');
    localStorage.removeItem('saToken');
    navigate('/super-admin/login');
  };

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-2 md:hidden">
        <ShieldCheck size={18} className="text-purple-600" />
        <span className="font-semibold text-gray-800 text-sm">Super Admin</span>
      </div>
      <div className="hidden md:flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-xs text-gray-400">Platform Online</span>
      </div>
      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-xl">
          <ShieldCheck size={14} className="text-purple-600" />
          <span className="text-xs font-medium text-purple-700">Super Admin</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-gray-200"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default SuperAdminNavbar;
