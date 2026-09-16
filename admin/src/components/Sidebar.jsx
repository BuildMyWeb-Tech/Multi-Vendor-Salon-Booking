import React, { useContext, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { DoctorContext } from '../context/DoctorContext';
import { AdminContext } from '../context/AdminContext';

import {
  Home,
  Calendar,
  UserPlus2,
  UsersRound,
  ChevronLeft,
  ChevronRight,
  Cog,
  MenuIcon,
  X,
  Scissors,
  LayoutGrid,
  CalendarClock,
  CreditCard,
  Users,
  LayoutDashboard,
  Palette,
  User,
  Settings,
  ClipboardList,
  ImagePlus,
  BookOpen,
  IndianRupee,
  BarChart3,
  Store,
  UserCog
} from "lucide-react";

const iconClass = "min-w-[23px] w-[23px] h-[23px]";

const Sidebar = () => {
  const { dToken } = useContext(DoctorContext);
  const { aToken } = useContext(AdminContext);

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <div className="fixed top-2 left-2 z-50 md:hidden">
        <button 
          onClick={() => setMobileOpen(true)}
          className="bg-white p-2 rounded-full shadow-md text-primary hover:bg-gray-50 transition-all"
        >
          {!mobileOpen && <MenuIcon size={24} />}
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div 
        className={`hidden md:flex flex-col bg-white border-r h-screen shadow-sm fixed z-40 
        transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}
      >
        {/* Desktop Logo */}
        <div className="py-5 px-6 border-b flex justify-between items-center">
          {!collapsed ? (
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                StyleStudio
              </h2>
              <p className="text-xs text-gray-400">
                {aToken ? 'Admin Portal' : dToken ? 'Stylist Portal' : 'Dashboard'}
              </p>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <Scissors className="text-primary" size={24} />
            </div>
          )}

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-primary p-1 rounded-md hover:bg-gray-100 transition-all"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* ADMIN MENU - DESKTOP */}
        {aToken && (
          <ul className="text-[#515151] mt-5 flex flex-col gap-1 flex-grow overflow-y-auto">
            
            {/* Dashboard */}
            <li>
              <NavLink to="/" className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-5 ${collapsed ? "justify-center" : ""}
                 ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
              }>
                <LayoutDashboard className={iconClass} />
                {!collapsed && <p>Dashboard</p>}
              </NavLink>
            </li>

            {/* Appointments */}
            <li>
              <NavLink to="/all-appointments" className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-5 ${collapsed ? "justify-center" : ""}
                 ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
              }>
                <Calendar className={iconClass} />
                {!collapsed && <p>Appointments</p>}
              </NavLink>
            </li>

            {/* Stylists */}
            <li>
              <NavLink to="/stylist-list" className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-5 ${collapsed ? "justify-center" : ""}
                ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
              }>
                <UserCog className={iconClass} />
                {!collapsed && <p>Stylists</p>}
              </NavLink>
            </li>

            {/* Services Category */}
            <li>
              <NavLink
                to="/services-category"
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3.5 px-5 ${collapsed ? "justify-center" : ""}
                  ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
                }
              >
                <LayoutGrid className={iconClass} />
                {!collapsed && <p>Services</p>}
              </NavLink>
            </li>

            {/* Slot Management */}
            <li>
              <NavLink
                to="/slot-management"
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3.5 px-5 ${collapsed ? "justify-center" : ""}
                  ${isActive
                    ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary'
                    : 'hover:bg-gray-50'}`
                }
              >
                <CalendarClock className={iconClass} />
                {!collapsed && <p>Slots</p>}
              </NavLink>
            </li>
          </ul>
        )}

        {/* STYLIST MENU - DESKTOP */}
        {dToken && (
          <ul className="text-[#515151] mt-5 flex flex-col gap-1 flex-grow overflow-y-auto">
            <li>
              <NavLink to="/stylist-dashboard" className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-5 ${collapsed ? "justify-center" : ""}
                ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
              }>
                <LayoutDashboard className={iconClass} />
                {!collapsed && <p>Dashboard</p>}
              </NavLink>
            </li>

            <li>
              <NavLink to="/stylist-appointments" className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-5 ${collapsed ? "justify-center" : ""}
                ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
              }>
                <CalendarClock className={iconClass} />
                {!collapsed && <p>Appointment </p>}
              </NavLink>
            </li>

            {/* <li>
              <NavLink to="/stylist-services" className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-5 ${collapsed ? "justify-center" : ""}
                ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
              }>
                <Scissors className={iconClass} />
                {!collapsed && <p>My Services</p>}
              </NavLink>
            </li>

            <li>
              <NavLink to="/stylist-portfolio" className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-5 ${collapsed ? "justify-center" : ""}
                ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
              }>
                <Palette className={iconClass} />
                {!collapsed && <p>Portfolio</p>}
              </NavLink>
            </li>

            <li>
              <NavLink to="/stylist-clients" className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-5 ${collapsed ? "justify-center" : ""}
                ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
              }>
                <Users className={iconClass} />
                {!collapsed && <p>My Clients</p>}
              </NavLink>
            </li> */}

            <li>
              <NavLink to="/stylist-earnings" className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-5 ${collapsed ? "justify-center" : ""}
                ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
              }>
                <IndianRupee className={iconClass} />
                {!collapsed && <p>Earnings</p>}
              </NavLink>
            </li>

            <li>
              <NavLink to="/stylist-profile" className={({ isActive }) =>
                `flex items-center gap-3 py-3.5 px-5 ${collapsed ? "justify-center" : ""}
                ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
              }>
                <User className={iconClass} />
                {!collapsed && <p>My Profile</p>}
              </NavLink>
            </li>
          </ul>
        )}
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      <div className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 
        ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      >
        {/* MOBILE SIDEBAR PANEL */}
        <div 
          className={`absolute top-0 left-0 h-screen w-72 bg-white shadow-lg transform transition-transform duration-300 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          {/* Mobile Header */}
          <div className="py-5 px-6 border-b flex justify-between items-center bg-gradient-to-r from-primary/5 to-blue-50">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                StyleStudio
              </h2>
              <p className="text-xs text-gray-500">
                {aToken ? 'Admin Portal' : dToken ? 'Stylist Portal' : 'Dashboard'}
              </p>
            </div>

            {/* ALWAYS show X when mobileOpen */}
            {mobileOpen && (
              <button
                onClick={() => setMobileOpen(false)}
                className="text-gray-600 hover:text-primary p-1 rounded-full hover:bg-gray-100 transition"
              >
                <X size={24} />
              </button>
            )}
          </div>

          {/* Mobile Menu - ADMIN */}
          {aToken && (
            <div className="overflow-y-auto h-[calc(100vh-80px)]">
              <ul className="text-[#515151] py-2 flex flex-col">
                <li>
                  <NavLink 
                    to="/" 
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3.5 px-5
                      ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className={iconClass} />
                    <p>Dashboard</p>
                  </NavLink>
                </li>

                <li>
                  <NavLink 
                    to="/all-appointments" 
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3.5 px-5
                      ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <Calendar className={iconClass} />
                    <p>Appointments</p>
                  </NavLink>
                </li>

                <li>
                  <NavLink 
                    to="/stylist-list" 
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3.5 px-5
                      ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <UserCog className={iconClass} />
                    <p>Stylists</p>
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/services-category"
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3.5 px-5
                      ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <Scissors className={iconClass} />
                    <p>Services</p>
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/slot-management"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3.5 px-5
                      ${isActive
                        ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary'
                        : 'hover:bg-gray-50'}`
                    }
                  >
                    <CalendarClock className={iconClass} />
                    <p>Slot Management</p>
                  </NavLink>
                </li>
              </ul>
            </div>
          )}

          {/* Mobile Menu - STYLIST */}
          {dToken && (
            <div className="overflow-y-auto h-[calc(100vh-80px)]">
              <ul className="text-[#515151] py-2 flex flex-col">
                <li>
                  <NavLink 
                    to="/stylist-dashboard" 
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3.5 px-5
                      ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className={iconClass} />
                    <p>Dashboard</p>
                  </NavLink>
                </li>

                <li>
                  <NavLink 
                    to="/stylist-appointments" 
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3.5 px-5
                      ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <CalendarClock className={iconClass} />
                    <p>Appointments</p>
                  </NavLink>
                </li>

                {/* <li>
                  <NavLink 
                    to="/stylist-services" 
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3.5 px-5
                      ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <Scissors className={iconClass} />
                    <p>My Services</p>
                  </NavLink>
                </li>

                <li>
                  <NavLink 
                    to="/stylist-portfolio" 
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3.5 px-5
                      ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <Palette className={iconClass} />
                    <p>Portfolio</p>
                  </NavLink>
                </li>

                <li>
                  <NavLink 
                    to="/stylist-clients" 
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3.5 px-5
                      ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <Users className={iconClass} />
                    <p>My Clients</p>
                  </NavLink>
                </li> */}

                <li>
                  <NavLink 
                    to="/stylist-earnings" 
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3.5 px-5
                      ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <IndianRupee className={iconClass} />
                    <p>Earnings</p>
                  </NavLink>
                </li>

                <li>
                  <NavLink 
                    to="/stylist-profile" 
                    className={({ isActive }) =>
                      `flex items-center gap-3 py-3.5 px-5
                      ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className={iconClass} />
                    <p>Profile</p>
                  </NavLink>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE BOTTOM NAV - ADMIN */}
      {!mobileOpen && aToken && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl py-1 z-30">
          <div className="flex justify-around">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex flex-col items-center text-xs p-2 ${isActive ? 'text-primary' : 'text-gray-500'}`
              }
            >
              <LayoutDashboard className="w-5 h-5 mb-1" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink 
              to="/all-appointments" 
              className={({ isActive }) => 
                `flex flex-col items-center text-xs p-2 ${isActive ? 'text-primary' : 'text-gray-500'}`
              }
            >
              <Calendar className="w-5 h-5 mb-1" />
              <span>Appointments</span>
            </NavLink>

            <NavLink 
              to="/stylist-list" 
              className={({ isActive }) => 
                `flex flex-col items-center text-xs p-2 ${isActive ? 'text-primary' : 'text-gray-500'}`
              }
            >
              <UserCog className="w-5 h-5 mb-1" />
              <span>Stylists</span>
            </NavLink>

            <NavLink
              to="/services-category"
              className={({ isActive }) =>
                `flex flex-col items-center text-xs p-2 ${
                  isActive ? 'text-primary' : 'text-gray-500'
                }`
              }
            >
              <Scissors className="w-5 h-5 mb-1" />
              <span>Services</span>
            </NavLink>

            <NavLink
              to="/slot-management"
              className={({ isActive }) =>
                `flex flex-col items-center text-xs p-2 ${
                  isActive ? 'text-primary' : 'text-gray-500'
                }`
              }
            >
              <CalendarClock className="w-5 h-5 mb-1" />
              <span>Slots</span>
            </NavLink>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV - STYLIST */}
      {!mobileOpen && dToken && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl py-1 z-30">
          <div className="flex justify-around">
            <NavLink 
              to="/stylist-dashboard" 
              className={({ isActive }) => 
                `flex flex-col items-center text-xs p-2 ${isActive ? 'text-primary' : 'text-gray-500'}`
              }
            >
              <LayoutDashboard className="w-5 h-5 mb-1" />
              <span>Dashboard</span>
            </NavLink>

            <NavLink 
              to="/stylist-appointments" 
              className={({ isActive }) => 
                `flex flex-col items-center text-xs p-2 ${isActive ? 'text-primary' : 'text-gray-500'}`
              }
            >
              <CalendarClock className="w-5 h-5 mb-1" />
              <span>Appointments</span>
            </NavLink>

            {/* <NavLink 
              to="/stylist-services" 
              className={({ isActive }) => 
                `flex flex-col items-center text-xs p-2 ${isActive ? 'text-primary' : 'text-gray-500'}`
              }
            >
              <Scissors className="w-5 h-5 mb-1" />
              <span>Services</span>
            </NavLink> */}

            <NavLink 
              to="/stylist-earnings" 
              className={({ isActive }) => 
                `flex flex-col items-center text-xs p-2 ${isActive ? 'text-primary' : 'text-gray-500'}`
              }
            >
              <IndianRupee className="w-5 h-5 mb-1" />
              <span>Earnings</span>
            </NavLink>

            <NavLink 
              to="/stylist-profile" 
              className={({ isActive }) => 
                `flex flex-col items-center text-xs p-2 ${isActive ? 'text-primary' : 'text-gray-500'}`
              }
            >
              <User className="w-5 h-5 mb-1" />
              <span>Profile</span>
            </NavLink>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
