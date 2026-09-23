// frontend/src/pages/stylist/StylistDashboard.jsx
import React, { useContext, useEffect } from 'react';
import { StylistContext } from '../../context/StylistContext';
import {
  Calendar, CheckCircle, XCircle, Users, Scissors,
  CalendarCheck, TrendingUp, Clock, IndianRupee, Star,
  AlertCircle, ArrowRight,
} from 'lucide-react';
import { NavLink, useParams } from 'react-router-dom';

const fmt = (isoStr) => {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
};

const StatCard = ({ icon: Icon, label, value, gradient, sub }) => (
  <div className={`relative overflow-hidden rounded-2xl p-5 text-white ${gradient} shadow-lg`}>
    <div className="flex items-start justify-between mb-3">
      <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
        <Icon size={20} />
      </div>
      <span className="text-3xl font-extrabold">{value ?? 0}</span>
    </div>
    <p className="text-sm font-semibold opacity-90">{label}</p>
    {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-white/10 rounded-full" />
    <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-white/5 rounded-full" />
  </div>
);

const statusBadge = (apt) => {
  if (apt.cancelled)   return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full bg-red-100 text-red-600 font-medium"><XCircle size={10} />Cancelled</span>;
  if (apt.isCompleted) return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full bg-green-100 text-green-600 font-medium"><CheckCircle size={10} />Completed</span>;
  if (new Date(apt.slotDateTime) > new Date()) return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-600 font-medium"><Clock size={10} />Upcoming</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-600 font-medium"><AlertCircle size={10} />Pending</span>;
};

const StylistDashboard = () => {
  const { shopSlug } = useParams();
  const { stylistInfo, dashData, getDashboard } = useContext(StylistContext);

  useEffect(() => { getDashboard(); }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-xl shadow-primary/20">
        <div className="relative z-10">
          <p className="text-white/70 text-sm mb-1">{today}</p>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Scissors size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Welcome back, {stylistInfo?.name || 'Stylist'}</h1>
              <p className="text-white/70 text-xs">{stylistInfo?.shopName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Star size={13} className="fill-yellow-300 text-yellow-300" />
            <span className="text-white/80 text-sm">
              {dashData?.upcoming ?? 0} upcoming appointment{dashData?.upcoming !== 1 ? 's' : ''} today
            </span>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}       label="Total"     value={dashData?.total}      gradient="bg-gradient-to-br from-primary to-blue-700"   sub="all time" />
        <StatCard icon={Calendar}    label="Today"     value={dashData?.todayCount} gradient="bg-gradient-to-br from-amber-400 to-orange-500" sub={new Date().toLocaleDateString('en-IN',{month:'short',day:'numeric'})} />
        <StatCard icon={TrendingUp}  label="Upcoming"  value={dashData?.upcoming}   gradient="bg-gradient-to-br from-violet-500 to-purple-700" sub="not yet done" />
        <StatCard icon={CheckCircle} label="Completed" value={dashData?.completed}  gradient="bg-gradient-to-br from-emerald-400 to-green-600" sub="all time" />
      </div>

      {/* Recent appointments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <CalendarCheck size={16} className="text-primary" />
            </div>
            <h2 className="font-semibold text-gray-800">Recent Appointments</h2>
          </div>
          <NavLink
            to={`/${shopSlug}/stylist/appointments`}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium"
          >
            View all <ArrowRight size={12} />
          </NavLink>
        </div>

        {!dashData?.recentAppointments?.length ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
              <Calendar size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-400 text-sm">No appointments yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {dashData.recentAppointments.map((apt) => {
              const { date, time } = fmt(apt.slotDateTime);
              return (
                <div key={apt._id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">
                      {(apt.userData?.name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{apt.userData?.name || '—'}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {apt.services?.map(s => s.name).join(', ') || apt.service || '—'}
                    </p>
                  </div>
                  {/* Date */}
                  <div className="text-right hidden sm:block flex-shrink-0">
                    <p className="text-xs font-medium text-gray-700">{date}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 justify-end"><Clock size={10} />{time}</p>
                  </div>
                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-0.5 text-sm font-bold text-gray-800">
                      <IndianRupee size={13} />{apt.amount}
                    </div>
                    <div className="mt-1">{statusBadge(apt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancelled notice */}
      {dashData?.cancelled > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-red-600">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <XCircle size={16} />
          </div>
          <span>
            <strong>{dashData.cancelled}</strong> cancelled appointment{dashData.cancelled !== 1 ? 's' : ''} in total
          </span>
        </div>
      )}
    </div>
  );
};

export default StylistDashboard;
