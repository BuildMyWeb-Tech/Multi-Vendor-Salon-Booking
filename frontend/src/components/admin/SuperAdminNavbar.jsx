import React, { useContext } from 'react';
import { SuperAdminContext } from '../../context/SuperAdminContext';
import { ShieldCheck, LogOut, Scissors } from 'lucide-react';
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
    <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left — mobile brand */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
          <Scissors size={14} className="text-primary" />
        </div>
        <span className="font-semibold text-gray-800 text-sm">Super Admin</span>
      </div>

      {/* Left — desktop status */}
      <div className="hidden md:flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <span className="text-xs text-gray-400">Platform Online</span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-xl">
          <ShieldCheck size={13} className="text-primary" />
          <span className="text-xs font-medium text-primary">Super Admin</span>
        </div>
        <button
          onClick={logout}
          className="bg-primary hover:bg-primary/90 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default SuperAdminNavbar;
