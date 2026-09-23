// frontend/src/pages/stylist/StylistSection.jsx
// Stylist panel route wrapper + sidebar + profile UI

import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, NavLink, Navigate, useParams, useNavigate } from 'react-router-dom';

import { StylistContext } from '../../context/StylistContext';
import StylistLogin from './StylistLogin';
import StylistDashboard from './StylistDashboard';
import StylistAppointments from './StylistAppointments';

import {
  Scissors,
  LayoutDashboard,
  Calendar,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Mail,
  Star,
  Award,
  Store,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────

const StylistSidebar = ({ slug }) => {
  const { stylistInfo, logout } = useContext(StylistContext);
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    {
      to: `/${slug}/stylist/dashboard`,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: `/${slug}/stylist/appointments`,
      label: 'Appointments',
      icon: Calendar,
    },
    // {
    //   to: `/${slug}/stylist/profile`,
    //   label: 'My Profile',
    //   icon: User,
    // },
  ];

  const linkClass = ({ isActive }) =>
    `
      group
      flex items-center gap-3
      mx-3 my-1
      px-4 py-3
      rounded-xl
      text-sm
      transition-all duration-200
      ${
        isActive
          ? 'bg-blue-50 text-primary font-semibold shadow-sm'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }
      ${collapsed ? 'justify-center px-2' : ''}
    `;

  const handleLogout = () => {
    logout();
    navigate(`/${slug}/stylist`);
  };

  const renderLinks = (onClickExtra) =>
    links.map(({ to, label, icon: Icon }) => (
      <li key={to}>
        <NavLink to={to} className={linkClass} onClick={onClickExtra}>
          <Icon size={19} strokeWidth={2} className="min-w-[19px]" />

          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      </li>
    ));

  return (
    <>
      {/* ======================================================
          MOBILE MENU BUTTON
      ====================================================== */}

      <div className="fixed top-3 left-3 z-50 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="
            w-10 h-10
            flex items-center justify-center
            bg-white
            border border-gray-200
            rounded-xl
            shadow-md
            text-gray-700
            hover:text-primary
            hover:bg-blue-50
            transition-all
          "
        >
          {!mobileOpen && <Menu size={21} />}
        </button>
      </div>

      {/* ======================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <div
        className={`
          hidden md:flex
          flex-col
          fixed
          left-0
          top-0
          z-40
          h-screen
          bg-white
          border-r border-gray-200
          shadow-[2px_0_10px_rgba(0,0,0,0.03)]
          transition-all duration-300
          ${collapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* ----------------------------------------------------
            BRAND HEADER
        ---------------------------------------------------- */}

        <div
          className={`
            h-[80px]
            px-5
            border-b border-gray-100
            flex items-center
            ${collapsed ? 'justify-center' : 'justify-between'}
          `}
        >
          {!collapsed ? (
            <div className="min-w-0">
              <h2 className="font-bold text-primary text-[18px] leading-tight truncate">
                {slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </h2>

              <p className="text-[11px] text-gray-400 mt-0.5">Stylist Portal</p>
            </div>
          ) : (
            <div
              className="
                w-10 h-10
                rounded-xl
                bg-blue-50
                flex items-center justify-center
              "
            >
              <Scissors className="text-primary" size={20} />
            </div>
          )}

          <button
            onClick={() => setCollapsed((p) => !p)}
            className="
              w-7 h-7
              flex items-center justify-center
              rounded-lg
              text-gray-400
              hover:text-primary
              hover:bg-blue-50
              transition-all
            "
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
        </div>

        {/* ----------------------------------------------------
            STYLIST INFORMATION
        ---------------------------------------------------- */}

        {!collapsed && stylistInfo && (
          <div
            className="
              px-5 py-4
              border-b border-gray-100
              bg-gray-50/70
            "
          >
            <div className="flex items-center gap-3">
              {stylistInfo.image ? (
                <img
                  src={stylistInfo.image}
                  alt=""
                  className="
                    w-10 h-10
                    rounded-full
                    object-cover
                    border-2 border-white
                    shadow-sm
                  "
                />
              ) : (
                <div
                  className="
                    w-10 h-10
                    rounded-full
                    bg-blue-50
                    flex items-center justify-center
                    border border-blue-100
                  "
                >
                  <User size={17} className="text-primary" />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{stylistInfo.name}</p>

                <p className="text-[11px] text-gray-400 truncate mt-0.5">{stylistInfo.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            NAVIGATION
        ---------------------------------------------------- */}

        <div className="flex-1 overflow-y-auto py-5">
          {!collapsed && (
            <p className="px-7 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Menu
            </p>
          )}

          <ul>{renderLinks()}</ul>
        </div>

        {/* ----------------------------------------------------
            LOGOUT
        ---------------------------------------------------- */}

        <div className="border-t border-gray-100 p-3">
          <button
            onClick={handleLogout}
            className={`
              flex items-center gap-3
              w-full
              px-3.5 py-3
              rounded-xl
              text-red-500
              hover:bg-red-50
              transition-all
              text-sm
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut size={18} />

            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* ======================================================
          MOBILE SIDEBAR OVERLAY
      ====================================================== */}

      <div
        className={`
          md:hidden
          fixed inset-0
          bg-black/40
          backdrop-blur-[2px]
          z-40
          transition-opacity duration-300
          ${mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setMobileOpen(false)}
      >
        <div
          className={`
            absolute
            top-0 left-0
            h-screen
            w-[280px]
            bg-white
            shadow-2xl
            flex flex-col
            transform
            transition-transform duration-300
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Header */}

          <div className="h-[76px] px-5 border-b flex items-center justify-between">
            <div>
              <p className="font-bold text-primary text-lg">
                {slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </p>

              <p className="text-[11px] text-gray-400">Stylist Portal</p>
            </div>

            <button
              onClick={() => setMobileOpen(false)}
              className="
                w-9 h-9
                rounded-lg
                flex items-center justify-center
                text-gray-500
                hover:bg-gray-100
              "
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Stylist */}

          {stylistInfo && (
            <div
              className="
                px-5 py-4
                border-b
                bg-gray-50
                flex items-center gap-3
              "
            >
              {stylistInfo.image ? (
                <img
                  src={stylistInfo.image}
                  alt=""
                  className="
                    w-10 h-10
                    rounded-full
                    object-cover
                    border-2 border-white
                    shadow-sm
                  "
                />
              ) : (
                <div
                  className="
                    w-10 h-10
                    rounded-full
                    bg-blue-50
                    flex items-center justify-center
                  "
                >
                  <User size={17} className="text-primary" />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{stylistInfo.name}</p>

                <p className="text-[11px] text-gray-400 truncate">{stylistInfo.email}</p>
              </div>
            </div>
          )}

          {/* Mobile Navigation */}

          <ul className="flex-1 py-4">{renderLinks(() => setMobileOpen(false))}</ul>

          {/* Mobile Logout */}

          <div className="border-t p-3">
            <button
              onClick={handleLogout}
              className="
                flex items-center gap-3
                w-full
                px-4 py-3
                rounded-xl
                text-red-500
                hover:bg-red-50
                text-sm
              "
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          MOBILE BOTTOM NAVIGATION
      ====================================================== */}

      {!mobileOpen && (
        <div
          className="
            md:hidden
            fixed
            bottom-0 left-0 right-0
            bg-white
            border-t border-gray-200
            shadow-[0_-4px_15px_rgba(0,0,0,0.05)]
            py-1.5
            z-30
          "
        >
          <div className="flex justify-around">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `
                    flex flex-col
                    items-center
                    justify-center
                    min-w-[70px]
                    py-1.5
                    rounded-xl
                    text-[10px]
                    font-medium
                    transition-all
                    ${isActive ? 'text-primary bg-blue-50' : 'text-gray-500'}
                  `
                }
              >
                <Icon className="w-[19px] h-[19px] mb-1" strokeWidth={2} />

                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// SPECIALTY PARSER
// ─────────────────────────────────────────────────────────────

const parseSpecialty = (raw) => {
  if (!raw) return [];

  let value = raw;

  /*
   * Handles all of these formats:
   *
   * ["Colors","Beard","Hair Cut"]
   *
   * '["Colors","Beard","Hair Cut"]'
   *
   * ['["Colors","Beard","Hair Cut"]']
   *
   * [["Colors","Beard","Hair Cut"]]
   *
   * ["Colors", "Beard", "Hair Cut"]
   */

  for (let i = 0; i < 5; i++) {
    if (typeof value !== 'string') {
      break;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    const looksLikeJson =
      (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'));

    if (!looksLikeJson) {
      break;
    }

    try {
      const parsed = JSON.parse(trimmed);

      value = parsed;
    } catch {
      break;
    }
  }

  const arr = Array.isArray(value) ? value : [value];

  const result = arr
    .flat(Infinity)
    .filter(Boolean)
    .map((item) => String(item).trim())
    .filter(Boolean);

  return result;
};

// ─────────────────────────────────────────────────────────────
// PROFILE PAGE
// ─────────────────────────────────────────────────────────────

const StylistProfile = () => {
  const { stylistInfo } = useContext(StylistContext);

  if (!stylistInfo) return null;

  const specialties = parseSpecialty(stylistInfo.specialty);

  const initials = (stylistInfo.name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="max-w-[510px] mx-auto space-y-4">
      {/* ======================================================
          PROFILE CARD
      ====================================================== */}

      <div
        className="
          bg-white
          rounded-2xl
          border border-gray-100
          shadow-[0_2px_12px_rgba(0,0,0,0.04)]
          overflow-hidden
        "
      >
        {/* ----------------------------------------------------
            PROFILE BANNER
        ---------------------------------------------------- */}

        <div
          className="
            h-32
            bg-gradient-to-br
            from-blue-600
            via-blue-600
            to-blue-800
            relative
            overflow-hidden
          "
        >
          {/* Decorative Circle - Right */}

          <div
            className="
              absolute
              -top-10
              -right-10
              w-40
              h-40
              rounded-full
              bg-white/10
            "
          />

          {/* Decorative Circle - Top */}

          <div
            className="
              absolute
              top-3
              right-20
              w-14
              h-14
              rounded-full
              bg-white/10
            "
          />

          {/* Decorative Circle - Bottom */}

          <div
            className="
              absolute
              -bottom-10
              left-6
              w-32
              h-32
              rounded-full
              bg-white/10
            "
          />

          {/* Stars */}

          <div
            className="
              absolute
              top-4
              left-5
              flex
              items-center
              gap-0.5
            "
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={10}
                fill="white"
                strokeWidth={1.5}
                className="text-white opacity-75"
              />
            ))}
          </div>

          {/* Banner Text */}

          <p
            className="
              absolute
              top-7
              left-5
              text-white/60
              text-[10px]
              mt-1
              tracking-wide
            "
          >
            Professional Stylist
          </p>
        </div>

        {/* ----------------------------------------------------
            PROFILE AVATAR + NAME
        ---------------------------------------------------- */}

        <div className="px-6">
          <div
            className="
              flex
              items-center
              gap-4
              -mt-10
              mb-4
            "
          >
            {/* Profile Image */}

            {stylistInfo.image ? (
              <img
                src={stylistInfo.image}
                alt=""
                style={{
                  width: 80,
                  height: 80,
                }}
                className="
                  rounded-2xl
                  object-cover
                  border-4
                  border-white
                  shadow-[0_4px_12px_rgba(0,0,0,0.15)]
                  flex-shrink-0
                "
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                }}
                className="
                  rounded-2xl
                  bg-gradient-to-br
                  from-primary
                  to-blue-700
                  border-4
                  border-white
                  shadow-[0_4px_12px_rgba(0,0,0,0.15)]
                  flex
                  items-center
                  justify-center
                  flex-shrink-0
                "
              >
                <span
                  className="
                    text-white
                    font-bold
                    text-2xl
                  "
                >
                  {initials}
                </span>
              </div>
            )}

            {/* Name */}

            <div className="pt-10 min-w-0">
              <h2
                className="
                  text-lg
                  font-bold
                  text-gray-800
                  leading-tight
                  truncate
                "
              >
                {stylistInfo.name}
              </h2>

              <span
                className="
                  inline-flex
                  items-center
                  mt-1
                  bg-blue-50
                  text-primary
                  text-[11px]
                  font-semibold
                  px-2.5
                  py-1
                  rounded-full
                "
              >
                Stylist
              </span>
            </div>
          </div>

          {/* Divider */}

          <div className="border-t border-gray-100 mb-2" />

          {/* --------------------------------------------------
              PROFILE INFORMATION
          -------------------------------------------------- */}

          <div className="pb-4">
            <InfoRow icon={Mail} label="Email" value={stylistInfo.email} />

            <InfoRow icon={Store} label="Salon" value={stylistInfo.shopName} />
          </div>
        </div>
      </div>

      {/* ======================================================
          SERVICE SPECIALTIES
      ====================================================== */}

      <div
        className="
          bg-white
          rounded-2xl
          border border-gray-100
          shadow-[0_2px_12px_rgba(0,0,0,0.04)]
          p-5
        "
      >
        {/* Header */}

        <div
          className="
            flex
            items-center
            gap-3
            mb-4
          "
        >
          <div
            className="
              w-9
              h-9
              bg-blue-50
              rounded-xl
              flex
              items-center
              justify-center
              flex-shrink-0
            "
          >
            <Scissors size={16} className="text-primary" strokeWidth={2} />
          </div>

          <div>
            <h3
              className="
                font-semibold
                text-gray-800
                text-sm
              "
            >
              Service Specialties
            </h3>

            <p
              className="
                text-[11px]
                text-gray-400
                mt-0.5
              "
            >
              {specialties.length > 0
                ? `${specialties.length} skill${specialties.length !== 1 ? 's' : ''}`
                : 'No specialties added'}
            </p>
          </div>
        </div>

        {/* Specialty Badges */}

        {specialties.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty, index) => (
              <span
                key={`${specialty}-${index}`}
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  bg-gradient-to-r
                  from-primary
                  to-blue-600
                  text-white
                  text-xs
                  font-medium
                  px-3
                  py-1.5
                  rounded-full
                  shadow-sm
                  shadow-primary/20
                "
              >
                <Star
                  size={9}
                  fill="white"
                  strokeWidth={1.5}
                  className="text-white flex-shrink-0"
                />

                {specialty}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Contact your admin to add specialties.</p>
        )}
      </div>

      {/* ======================================================
          ADMIN NOTICE
      ====================================================== */}

      <div
        className="
          bg-blue-50
          border border-blue-100
          rounded-xl
          px-4
          py-3
          flex
          items-start
          gap-3
        "
      >
        <div
          className="
            w-8
            h-8
            bg-blue-100
            rounded-lg
            flex
            items-center
            justify-center
            flex-shrink-0
            mt-0.5
          "
        >
          <Award size={14} className="text-blue-600" />
        </div>

        <p
          className="
            text-[11px]
            text-blue-600
            leading-relaxed
            pt-0.5
          "
        >
          To update your profile photo, specialties or contact details, please ask your salon admin
          to edit your profile from the admin panel.
        </p>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// INFO ROW
// ─────────────────────────────────────────────────────────────

const InfoRow = ({ icon: Icon, label, value }) => (
  <div
    className="
      flex
      items-center
      gap-3
      py-2.5
      border-b
      border-gray-50
      last:border-0
    "
  >
    {/* Icon */}

    <div
      className="
        w-8
        h-8
        bg-gray-50
        border
        border-gray-100
        rounded-lg
        flex
        items-center
        justify-center
        flex-shrink-0
      "
    >
      <Icon size={14} strokeWidth={1.8} className="text-gray-500" />
    </div>

    {/* Text */}

    <div className="min-w-0">
      <p
        className="
          text-[11px]
          text-gray-400
        "
      >
        {label}
      </p>

      <p
        className="
          text-sm
          font-medium
          text-gray-800
          truncate
        "
      >
        {value || '—'}
      </p>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// STYLIST SECTION
// ─────────────────────────────────────────────────────────────

const StylistSection = () => {
  const { shopSlug } = useParams();

  const { stylistToken, stylistInfo, backendUrl } = useContext(StylistContext);

  const [panelEnabled, setPanelEnabled] = useState(null);

  // ==========================================================
  // CHECK STYLIST PANEL STATUS
  // ==========================================================

  useEffect(() => {
    axios
      .get(`${backendUrl}/api/salon-admin/public-info/${shopSlug}`)
      .then(({ data }) => {
        setPanelEnabled(data.success ? data.stylistPanelEnabled : false);
      })
      .catch(() => {
        setPanelEnabled(false);
      });
  }, [shopSlug]);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (panelEnabled === null) {
    return (
      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
          bg-[#F8F9FD]
        "
      >
        <div
          className="
            w-8
            h-8
            border-4
            border-primary/20
            border-t-primary
            rounded-full
            animate-spin
          "
        />
      </div>
    );
  }

  // ==========================================================
  // PORTAL DISABLED
  // ==========================================================

  if (!panelEnabled) {
    return (
      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
          bg-[#F8F9FD]
          p-4
        "
      >
        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-lg
            p-8
            max-w-sm
            text-center
          "
        >
          <div
            className="
              w-16
              h-16
              bg-gray-50
              rounded-2xl
              flex
              items-center
              justify-center
              mx-auto
              mb-4
            "
          >
            <Scissors size={28} className="text-gray-400" />
          </div>

          <h2
            className="
              font-bold
              text-gray-800
              mb-2
            "
          >
            Stylist Portal Unavailable
          </h2>

          <p
            className="
              text-gray-500
              text-sm
              leading-relaxed
            "
          >
            The stylist portal is not enabled for <strong>{shopSlug}</strong>. Please contact your
            salon admin.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================================
  // WRONG SALON CHECK
  // ==========================================================

  if (stylistToken && stylistInfo && stylistInfo.shopSlug && stylistInfo.shopSlug !== shopSlug) {
    return (
      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
          bg-[#F8F9FD]
          p-4
        "
      >
        <div
          className="
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-lg
            p-8
            max-w-sm
            text-center
          "
        >
          <div
            className="
              w-14
              h-14
              bg-blue-50
              rounded-2xl
              flex
              items-center
              justify-center
              mx-auto
              mb-4
            "
          >
            <Scissors size={26} className="text-primary" />
          </div>

          <h2
            className="
              font-bold
              text-gray-800
              mb-2
            "
          >
            Wrong Salon
          </h2>

          <p
            className="
              text-gray-500
              text-sm
              mb-5
              leading-relaxed
            "
          >
            You are logged in as a stylist for <strong>{stylistInfo.shopName}</strong>.
          </p>

          <button
            onClick={() => {
              window.location.href = `/${shopSlug}/stylist`;
            }}
            className="
              bg-primary
              text-white
              px-5
              py-2.5
              rounded-xl
              text-sm
              font-medium
              hover:bg-blue-700
              transition-colors
            "
          >
            Login to {shopSlug}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================================
  // LOGIN
  // ==========================================================

  if (!stylistToken) {
    return <StylistLogin />;
  }

  // ==========================================================
  // MAIN STYLIST PANEL
  // ==========================================================

  return (
    <div
      className="
        bg-[#F8F9FD]
        min-h-screen
      "
    >
      {/* Sidebar */}

      <StylistSidebar slug={shopSlug} />

      {/* Main Content */}

      <div
        className="
          flex
          flex-col
          min-h-screen
          md:ml-20
          lg:ml-64
        "
      >
        <div
          className="
            p-4
            sm:p-6
            pb-20
            md:pb-6
            flex-grow
          "
        >
          <Routes>
            {/* Dashboard */}

            <Route path="dashboard" element={<StylistDashboard />} />

            {/* Appointments */}

            <Route path="appointments" element={<StylistAppointments />} />

            {/* Profile */}

            <Route path="profile" element={<StylistProfile />} />

            {/* Default */}

            <Route path="" element={<Navigate to={`/${shopSlug}/stylist/dashboard`} replace />} />

            {/* Unknown route */}

            <Route path="*" element={<Navigate to={`/${shopSlug}/stylist/dashboard`} replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default StylistSection;
