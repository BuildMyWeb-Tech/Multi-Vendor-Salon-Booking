import React, { useContext, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { DoctorContext } from '../../context/DoctorContext';
import { AdminContext } from '../../context/AdminContext';
import {
  Calendar, UserPlus2, ChevronLeft, ChevronRight, MenuIcon, X,
  Scissors, LayoutGrid, CalendarClock, UserCog, LayoutDashboard,
  User, IndianRupee,
} from 'lucide-react';

const iconClass = 'min-w-[23px] w-[23px] h-[23px]';

const AdminSidebar = ({ shopSlug: shopSlugProp }) => {
  const { dToken } = useContext(DoctorContext);
  const { aToken } = useContext(AdminContext);
  const params = useParams();
  const slug = shopSlugProp || params.shopSlug || '';

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminLinks = [
    { to: `/${slug}/admin/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `/${slug}/admin/appointments`, label: 'Appointments', icon: Calendar },
    { to: `/${slug}/admin/stylists`, label: 'Stylists', icon: UserCog },
    { to: `/${slug}/admin/services`, label: 'Services', icon: LayoutGrid },
    { to: `/${slug}/admin/slot-management`, label: 'Slots', icon: CalendarClock },
    { to: `/${slug}/admin/add-stylist`, label: 'Add Stylist', icon: UserPlus2 },
    // { to: `/${slug}/admin/my-profile`, label: 'My Profile', icon: User },
  ];

  const stylistLinks = [
    { to: `/${slug}/admin/stylist-dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { to: `/${slug}/admin/stylist-appointments`, label: 'Appointments', icon: CalendarClock },
    { to: `/${slug}/admin/stylist-earnings`, label: 'Earnings', icon: IndianRupee },
    { to: `/${slug}/admin/stylist-profile`, label: 'My Profile', icon: User },
  ];

  const linkClass = (isActive, extra = '') =>
    `flex items-center gap-3 py-3.5 px-5 ${extra}
     ${isActive ? 'bg-blue-50 text-primary font-semibold border-l-4 border-primary' : 'hover:bg-gray-50'}`;

  const renderLinks = (links) =>
    links.map(({ to, label, icon: Icon }) => (
      <li key={to}>
        <NavLink
          to={to}
          className={({ isActive }) => linkClass(isActive, collapsed ? 'justify-center' : '')}
          onClick={() => setMobileOpen(false)}
        >
          <Icon className={iconClass} />
          {!collapsed && <p>{label}</p>}
        </NavLink>
      </li>
    ));

  const renderMobileLinks = (links) =>
    links.map(({ to, label, icon: Icon }) => (
      <li key={to}>
        <NavLink
          to={to}
          className={({ isActive }) => linkClass(isActive)}
          onClick={() => setMobileOpen(false)}
        >
          <Icon className={iconClass} />
          <p>{label}</p>
        </NavLink>
      </li>
    ));

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-2 left-2 z-50 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="bg-white p-2 rounded-full shadow-md text-primary hover:bg-gray-50"
        >
          {!mobileOpen && <MenuIcon size={24} />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden md:flex flex-col bg-white border-r h-screen shadow-sm fixed z-40
          transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
      >
        <div className="py-5 px-6 border-b flex justify-between items-center">
          {!collapsed ? (
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                {slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Admin'}
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
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-primary p-1 rounded-md hover:bg-gray-100"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {aToken && (
          <ul className="text-[#515151] mt-5 flex flex-col gap-1 flex-grow overflow-y-auto">
            {renderLinks(adminLinks)}
          </ul>
        )}

        {dToken && (
          <ul className="text-[#515151] mt-5 flex flex-col gap-1 flex-grow overflow-y-auto">
            {renderLinks(stylistLinks)}
          </ul>
        )}
      </div>

      {/* Mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300
          ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className={`absolute top-0 left-0 h-screen w-72 bg-white shadow-lg transform transition-transform duration-300
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="py-5 px-6 border-b flex justify-between items-center bg-gradient-to-r from-primary/5 to-blue-50">
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                {slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Admin'}
              </h2>
              <p className="text-xs text-gray-500">
                {aToken ? 'Admin Portal' : dToken ? 'Stylist Portal' : 'Dashboard'}
              </p>
            </div>
            {mobileOpen && (
              <button onClick={() => setMobileOpen(false)} className="text-gray-600 hover:text-primary p-1 rounded-full hover:bg-gray-100">
                <X size={24} />
              </button>
            )}
          </div>

          {aToken && (
            <div className="overflow-y-auto h-[calc(100vh-80px)]">
              <ul className="text-[#515151] py-2 flex flex-col">
                {renderMobileLinks(adminLinks)}
              </ul>
            </div>
          )}

          {dToken && (
            <div className="overflow-y-auto h-[calc(100vh-80px)]">
              <ul className="text-[#515151] py-2 flex flex-col">
                {renderMobileLinks(stylistLinks)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom nav — admin */}
      {!mobileOpen && aToken && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl py-1 z-30">
          <div className="flex justify-around">
            {[
              { to: `/${slug}/admin/dashboard`, icon: LayoutDashboard, label: 'Dashboard' },
              { to: `/${slug}/admin/appointments`, icon: Calendar, label: 'Appts' },
              { to: `/${slug}/admin/stylists`, icon: UserCog, label: 'Stylists' },
              { to: `/${slug}/admin/services`, icon: Scissors, label: 'Services' },
              { to: `/${slug}/admin/slot-management`, icon: CalendarClock, label: 'Slots' },
            ].map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center text-xs p-2 ${isActive ? 'text-primary' : 'text-gray-500'}`
                }
              >
                <Icon className="w-5 h-5 mb-1" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}

      {/* Mobile bottom nav — stylist */}
      {!mobileOpen && dToken && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-xl py-1 z-30">
          <div className="flex justify-around">
            {stylistLinks.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center text-xs p-2 ${isActive ? 'text-primary' : 'text-gray-500'}`
                }
              >
                <Icon className="w-5 h-5 mb-1" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
