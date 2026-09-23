// frontend/src/pages/stylist/StylistAppointments.jsx
import React, { useContext, useEffect, useState } from 'react';
import { StylistContext } from '../../context/StylistContext';
import {
  Calendar, CheckCircle, XCircle, Eye, Search,
  Clock, IndianRupee, User, Phone, Mail, Scissors,
  AlertCircle, TrendingUp, Users, Filter,
} from 'lucide-react';

const fmt = (isoStr) => {
  if (!isoStr) return { date: '—', time: '—' };
  const d = new Date(isoStr);
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
};

const getStatus = (apt) => {
  if (apt.cancelled)   return { label: 'Cancelled', color: 'bg-red-100 text-red-600',    icon: XCircle };
  if (apt.isCompleted) return { label: 'Completed', color: 'bg-green-100 text-green-600', icon: CheckCircle };
  if (new Date(apt.slotDateTime) > new Date()) return { label: 'Upcoming', color: 'bg-blue-100 text-blue-600', icon: Clock };
  return { label: 'Pending', color: 'bg-amber-100 text-amber-600', icon: AlertCircle };
};

const StatusBadge = ({ apt }) => {
  const { label, color, icon: Icon } = getStatus(apt);
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium ${color}`}>
      <Icon size={10} />{label}
    </span>
  );
};

const FILTERS = [
  { key: 'all',       label: 'All',       icon: Users },
  { key: 'upcoming',  label: 'Upcoming',  icon: Clock },
  { key: 'today',     label: 'Today',     icon: Calendar },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle },
];

const StylistAppointments = () => {
  const { appointments, loading, getAppointments, completeAppointment, cancelAppointment } = useContext(StylistContext);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewApt, setViewApt] = useState(null);

  useEffect(() => { getAppointments(); }, []);

  const filtered = appointments.filter(apt => {
    const now = new Date();
    const matchFilter =
      filter === 'all'       ? true :
      filter === 'upcoming'  ? (!apt.cancelled && !apt.isCompleted && new Date(apt.slotDateTime) > now) :
      filter === 'completed' ? apt.isCompleted :
      filter === 'cancelled' ? apt.cancelled :
      filter === 'today'     ? new Date(apt.slotDateTime).toDateString() === now.toDateString() :
      true;
    const q = search.toLowerCase();
    const matchSearch = !search
      || (apt.userData?.name || '').toLowerCase().includes(q)
      || (apt.service || '').toLowerCase().includes(q)
      || (apt.services || []).some(s => s.name.toLowerCase().includes(q));
    return matchFilter && matchSearch;
  });

  const counts = {
    all:       appointments.length,
    upcoming:  appointments.filter(a => !a.cancelled && !a.isCompleted && new Date(a.slotDateTime) > new Date()).length,
    today:     appointments.filter(a => new Date(a.slotDateTime).toDateString() === new Date().toDateString()).length,
    completed: appointments.filter(a => a.isCompleted).length,
    cancelled: appointments.filter(a => a.cancelled).length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Calendar size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">My Appointments</h1>
          <p className="text-xs text-gray-400">{appointments.length} total appointments</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === key
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary'
            }`}
          >
            <Icon size={12} />
            {label}
            <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs ${
              filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by customer name or service…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
        />
      </div>

      {/* Cards / Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center gap-3">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
            <Scissors size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-400 font-medium">No appointments found</p>
          <p className="text-gray-300 text-sm">Try a different filter or search term</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(apt => {
            const { date, time } = fmt(apt.slotDateTime);
            const { label, color, icon: StatusIcon } = getStatus(apt);
            return (
              <div key={apt._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-lg">
                      {(apt.userData?.name || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">{apt.userData?.name || '—'}</span>
                      <StatusBadge apt={apt} />
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {apt.services?.map(s => s.name).join(' · ') || apt.service || '—'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={10} />{date}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={10} />{time}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                        <IndianRupee size={10} />{apt.amount}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => setViewApt(apt)}
                      title="View Details"
                      className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    {!apt.isCompleted && !apt.cancelled && (
                      <button
                        onClick={() => completeAppointment(apt._id)}
                        title="Mark Complete"
                        className="w-8 h-8 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 flex items-center justify-center transition-colors"
                      >
                        <CheckCircle size={14} />
                      </button>
                    )}
                    {!apt.cancelled && (
                      <button
                        onClick={() => { if (window.confirm('Cancel this appointment?')) cancelAppointment(apt._id); }}
                        title="Cancel"
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {viewApt && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setViewApt(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-gradient-to-r from-primary to-blue-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Appointment Details</h2>
                    <p className="text-white/70 text-xs">Full booking info</p>
                  </div>
                </div>
                <button onClick={() => setViewApt(null)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors">
                  <XCircle size={16} />
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">
              {/* Customer */}
              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-bold text-xl">
                    {(viewApt.userData?.name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{viewApt.userData?.name || '—'}</p>
                  {viewApt.userData?.phone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone size={11} />{viewApt.userData.phone}
                    </p>
                  )}
                  {viewApt.userData?.email && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Mail size={11} />{viewApt.userData.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                <InfoTile icon={Calendar} label="Date" value={fmt(viewApt.slotDateTime).date} />
                <InfoTile icon={Clock}    label="Time" value={fmt(viewApt.slotDateTime).time} />
                <InfoTile icon={IndianRupee} label="Total"    value={`₹${viewApt.amount}`} />
                <InfoTile icon={IndianRupee} label="Paid"     value={`₹${viewApt.paidAmount || 0}`} />
              </div>

              {/* Services */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                  <Scissors size={11} /> Services
                </p>
                {viewApt.services?.length ? (
                  <div className="space-y-1.5">
                    {viewApt.services.map((s, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-700">{s.name}</span>
                        <span className="font-medium text-gray-800">₹{s.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">{viewApt.service || '—'}</p>
                )}
              </div>

              {/* Payment & status */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Payment: </span>
                  <span className="text-gray-700 capitalize">{viewApt.paymentMethod || 'Not specified'}</span>
                </div>
                <StatusBadge apt={viewApt} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-6 pb-6">
              {!viewApt.isCompleted && !viewApt.cancelled && (
                <button
                  onClick={() => { completeAppointment(viewApt._id); setViewApt(null); }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle size={15} /> Mark Complete
                </button>
              )}
              <button
                onClick={() => setViewApt(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoTile = ({ icon: Icon, label, value }) => (
  <div className="bg-gray-50 rounded-xl p-3">
    <p className="text-xs text-gray-400 flex items-center gap-1 mb-1"><Icon size={10} />{label}</p>
    <p className="text-sm font-semibold text-gray-800">{value}</p>
  </div>
);

export default StylistAppointments;
