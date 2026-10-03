import React, { useState, useEffect, useContext } from 'react';
import { SlotManagementContext } from '../../context/SlotManagementContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';
import {
  Clock, Calendar, PlusCircle, Trash2, AlertCircle, Save, Check,
  CalendarX, CalendarClock, CalendarPlus, Loader2, ChevronDown, X,
  Coffee, Sun, Repeat,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────
const ordinalSuffix = (n) => {
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) { case 1: return 'st'; case 2: return 'nd'; case 3: return 'rd'; default: return 'th'; }
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
});

const toIso = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};

// 12-hour time input
const TimeInput = ({ label, name, value, onChange }) => {
  const parse = () => {
    if (!value) return { h: '12', m: '00', p: 'AM' };
    const [hh, mm] = value.split(':').map(Number);
    return { h: String(hh % 12 || 12), m: String(mm).padStart(2,'0'), p: hh >= 12 ? 'PM' : 'AM' };
  };
  const { h, m, p } = parse();
  const emit = (nh, nm, np) => {
    let hour = parseInt(nh);
    if (np === 'PM' && hour !== 12) hour += 12;
    if (np === 'AM' && hour === 12) hour = 0;
    onChange({ target: { name, value: `${String(hour).padStart(2,'0')}:${nm}` } });
  };
  const sel = 'border-none outline-none bg-transparent font-semibold text-gray-800 cursor-pointer text-sm';
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
        <Clock size={14} className="text-primary mr-1 flex-shrink-0" />
        <select value={h} onChange={e => emit(e.target.value, m, p)} className={sel}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(v => <option key={v} value={v}>{String(v).padStart(2,'0')}</option>)}
        </select>
        <span className="font-bold text-gray-400">:</span>
        <select value={m} onChange={e => emit(h, e.target.value, p)} className={sel}>
          {['00','15','30','45'].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={p} onChange={e => emit(h, m, e.target.value)} className={sel}>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  </div>
);

const FieldLabel = ({ children }) => (
  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{children}</label>
);

const Section = ({ icon: Icon, title, action, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-gray-50/50">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
        {Icon && <Icon size={16} className="text-primary" />}
        {title}
      </h2>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="text-center py-8 text-gray-400 text-sm">{message}</div>
);

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
const TABS = [
  { id: 'hours',   label: 'Operating Hours', icon: Clock },
  { id: 'dates',   label: 'Date Controls',   icon: Calendar },
  { id: 'booking', label: 'Booking Rules',   icon: CalendarClock },
];

// ── Main Component ────────────────────────────────────────────────────────────
const SlotManagement = () => {
  const {
    loading, settings,
    saveSettings: apiSave,
    addBlockedDate: apiAddBlocked, removeBlockedDate: apiRemoveBlocked,
    addRecurringHoliday: apiAddHoliday, removeRecurringHoliday: apiRemoveHoliday,
    addSpecialWorkingDay: apiAddSpecial, removeSpecialWorkingDay: apiRemoveSpecial,
  } = useContext(SlotManagementContext);

  const [local, setLocal] = useState({ ...settings });
  const [activeTab, setActiveTab] = useState('hours');
  const [dirty, setDirty] = useState(false);

  // Modals
  const [blockModal, setBlockModal] = useState(false);
  const [blockDate, setBlockDate] = useState(new Date());
  const [blockReason, setBlockReason] = useState('');

  const [holModal, setHolModal] = useState(false);
  const [holName, setHolName] = useState('');
  const [holType, setHolType] = useState('weekly');
  const [holDay, setHolDay] = useState('Monday');
  const [holDayOfMonth, setHolDayOfMonth] = useState(1);

  const [specialModal, setSpecialModal] = useState(false);
  const [specialDate, setSpecialDate] = useState(new Date());

  useEffect(() => { setLocal({ ...settings }); setDirty(false); }, [settings]);

  const set = (key, val) => { setLocal(p => ({ ...p, [key]: val })); setDirty(true); };
  const handleInput = (e) => set(e.target.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value);
  const handleTime = (e) => set(e.target.name, e.target.value);

  const toggleDay = (day) => {
    const next = local.daysOpen?.includes(day)
      ? local.daysOpen.filter(d => d !== day)
      : [...(local.daysOpen || []), day];
    set('daysOpen', next);
  };

  const saveSettings = async () => {
    if (!local.slotStartTime || !local.slotEndTime) { toast.error('Set start and end times'); return; }
    if (local.slotStartTime >= local.slotEndTime) { toast.error('End time must be after start time'); return; }
    if (local.breakTime && local.breakStartTime && local.breakEndTime) {
      if (local.breakStartTime >= local.breakEndTime) { toast.error('Break end must be after break start'); return; }
    }
    if (!local.daysOpen?.length) { toast.error('Select at least one open day'); return; }
    await apiSave(local);
    setDirty(false);
  };

  // Blocked dates
  const handleAddBlocked = async () => {
    if (!blockReason.trim()) { toast.error('Please enter a reason'); return; }
    const result = await apiAddBlocked(blockDate, blockReason);
    if (result) { setBlockDate(new Date()); setBlockReason(''); setBlockModal(false); }
  };

  // Recurring holidays
  const handleAddHoliday = async () => {
    if (!holName.trim()) { toast.error('Please enter a holiday name'); return; }
    const value = holType === 'weekly' ? holDay : String(holDayOfMonth);
    const result = await apiAddHoliday(holName, holType, value);
    if (result) { setHolName(''); setHolType('weekly'); setHolDay('Monday'); setHolDayOfMonth(1); setHolModal(false); }
  };

  // Special working days
  const handleAddSpecial = async () => {
    const result = await apiAddSpecial(specialDate);
    if (result) { setSpecialDate(new Date()); setSpecialModal(false); }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20';

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Clock size={20} className="text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Slot Management</h1>
          <p className="text-sm text-gray-500">Configure availability for your salon</p>
        </div>
        {dirty && (
          <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">Unsaved changes</span>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1 flex gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === id ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: Operating Hours ── */}
      {activeTab === 'hours' && (
        <div className="space-y-4">
          <Section icon={Clock} title="Operating Hours">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <TimeInput label="Opens at" name="slotStartTime" value={local.slotStartTime} onChange={handleTime} />
              <TimeInput label="Closes at" name="slotEndTime" value={local.slotEndTime} onChange={handleTime} />
            </div>

            <div className="mb-5">
              <FieldLabel>Slot Duration</FieldLabel>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set('slotDuration', d)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                      Number(local.slotDuration) === d
                        ? 'bg-primary text-white border-primary'
                        : 'border-gray-100 text-gray-600 hover:border-primary/30'
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            {/* Days Open */}
            <div className="mb-5">
              <FieldLabel>Days Open</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(day => {
                  const on = local.daysOpen?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        on ? 'bg-primary text-white border-primary' : 'border-gray-100 text-gray-500 hover:border-primary/30'
                      }`}
                    >
                      {DAY_SHORT[day]}
                    </button>
                  );
                })}
              </div>
              {local.daysOpen?.length === 0 && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle size={12} /> Select at least one open day
                </p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                {local.daysOpen?.length ? `${local.daysOpen.length} day${local.daysOpen.length > 1 ? 's' : ''} open` : 'No days selected'}
              </p>
            </div>

            {/* Break Time */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <div
                  onClick={() => set('breakTime', !local.breakTime)}
                  className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${local.breakTime ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${local.breakTime ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Coffee size={14} className="text-primary" /> Enable Break Time
                </span>
              </label>
              {local.breakTime && (
                <div className="ml-2 pl-4 border-l-2 border-primary/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TimeInput label="Break Starts" name="breakStartTime" value={local.breakStartTime} onChange={handleTime} />
                  <TimeInput label="Break Ends" name="breakEndTime" value={local.breakEndTime} onChange={handleTime} />
                </div>
              )}
            </div>
          </Section>
        </div>
      )}

      {/* ── TAB: Date Controls ── */}
      {activeTab === 'dates' && (
        <div className="space-y-4">

          {/* Blocked Dates */}
          <Section
            icon={CalendarX}
            title="Blocked Dates"
            action={
              <button
                onClick={() => setBlockModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all"
              >
                <PlusCircle size={13} /> Block a Date
              </button>
            }
          >
            {local.blockedDates?.length > 0 ? (
              <div className="space-y-2">
                {local.blockedDates.map(item => (
                  <div key={item._id} className="flex items-center justify-between p-3 rounded-xl bg-red-50 border border-red-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{fmtDate(item.date)}</p>
                      {item.reason && <p className="text-xs text-gray-500 mt-0.5">{item.reason}</p>}
                    </div>
                    <button onClick={() => apiRemoveBlocked(item._id)} className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-100 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No blocked dates — all days within your schedule are open." />
            )}
          </Section>

          {/* Recurring Holidays */}
          <Section
            icon={Repeat}
            title="Recurring Holidays"
            action={
              <button
                onClick={() => setHolModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all"
              >
                <PlusCircle size={13} /> Add Holiday
              </button>
            }
          >
            <p className="text-xs text-gray-400 mb-3">
              Recurring holidays automatically hide those dates from booking — even if the day is normally open.
            </p>
            {local.recurringHolidays?.length > 0 ? (
              <div className="space-y-2">
                {local.recurringHolidays.map(item => (
                  <div key={item._id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {item.type === 'weekly'
                          ? `Every ${item.value}`
                          : `${item.value}${ordinalSuffix(parseInt(item.value))} of every month`}
                      </p>
                    </div>
                    <button onClick={() => apiRemoveHoliday(item._id)} className="text-amber-500 hover:text-amber-700 p-1 rounded-lg hover:bg-amber-100 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No recurring holidays set." />
            )}
          </Section>

          {/* Special Working Days */}
          <Section
            icon={CalendarPlus}
            title="Special Working Days"
            action={
              <button
                onClick={() => setSpecialModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-all"
              >
                <PlusCircle size={13} /> Add Special Day
              </button>
            }
          >
            <p className="text-xs text-gray-400 mb-3">
              Special working days open a normally closed or holiday date for bookings.
            </p>
            {local.specialWorkingDays?.length > 0 ? (
              <div className="space-y-2">
                {local.specialWorkingDays.map(item => (
                  <div key={item._id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-sm font-semibold text-gray-800">{fmtDate(item.date)}</p>
                    <button onClick={() => apiRemoveSpecial(item._id)} className="text-emerald-500 hover:text-emerald-700 p-1 rounded-lg hover:bg-emerald-100 transition-all">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No special working days set." />
            )}
          </Section>
        </div>
      )}

      {/* ── TAB: Booking Rules ── */}
      {activeTab === 'booking' && (
        <div className="space-y-4">

          <Section icon={CalendarClock} title="Rescheduling Options">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <div
                onClick={() => set('allowRescheduling', !local.allowRescheduling)}
                className={`w-10 h-5 rounded-full relative transition-all cursor-pointer flex-shrink-0 ${local.allowRescheduling ? 'bg-primary' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${local.allowRescheduling ? 'left-5' : 'left-0.5'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Allow Customers to Reschedule</p>
                <p className="text-xs text-gray-400">Customers can change their appointment time</p>
              </div>
            </label>
            {local.allowRescheduling && (
              <div className="ml-2 pl-4 border-l-2 border-primary/20">
                <FieldLabel>Cancel/Reschedule Cutoff (hours before appointment)</FieldLabel>
                <input
                  type="number"
                  name="rescheduleHoursBefore"
                  value={local.rescheduleHoursBefore}
                  onChange={handleInput}
                  min="1"
                  className={`${inputCls} max-w-xs`}
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  Customers must reschedule at least {local.rescheduleHoursBefore}h before their appointment
                </p>
              </div>
            )}
          </Section>

          <Section icon={Calendar} title="Advance Booking Rules">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Max Days Ahead Customers Can Book</FieldLabel>
                <input
                  type="number"
                  name="maxAdvanceBookingDays"
                  value={local.maxAdvanceBookingDays}
                  onChange={handleInput}
                  min="1"
                  max="365"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-gray-400">Show up to {local.maxAdvanceBookingDays} days in calendar</p>
              </div>
              <div>
                <FieldLabel>Min Hours Before Slot to Allow Booking</FieldLabel>
                <input
                  type="number"
                  name="minBookingTimeBeforeSlot"
                  value={local.minBookingTimeBeforeSlot}
                  onChange={handleInput}
                  min="0"
                  step="0.5"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-gray-400">0 = allow last-minute bookings</p>
              </div>
            </div>
          </Section>

        </div>
      )}

      {/* Save Button */}
      <button
        onClick={saveSettings}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
          dirty
            ? 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {loading ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><Save size={16} /> Save Settings</>}
      </button>

      {/* ── Modals ── */}
      {blockModal && (
        <Modal title="Block a Date" onClose={() => setBlockModal(false)}>
          <div>
            <FieldLabel>Date to Block</FieldLabel>
            <DatePicker
              selected={blockDate}
              onChange={setBlockDate}
              dateFormat="MMMM d, yyyy"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
              minDate={new Date()}
            />
          </div>
          <div>
            <FieldLabel>Reason</FieldLabel>
            <input
              type="text"
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              placeholder="e.g., Public holiday, Staff training"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleAddBlocked} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90">Block Date</button>
            <button onClick={() => setBlockModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </Modal>
      )}

      {holModal && (
        <Modal title="Add Recurring Holiday" onClose={() => setHolModal(false)}>
          <div>
            <FieldLabel>Holiday Name</FieldLabel>
            <input
              type="text"
              value={holName}
              onChange={e => setHolName(e.target.value)}
              placeholder="e.g., Sunday Leave, Diwali"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <FieldLabel>Repeat</FieldLabel>
            <div className="grid grid-cols-2 gap-2">
              {['weekly', 'monthly'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setHolType(t)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all capitalize ${
                    holType === t ? 'bg-primary text-white border-primary' : 'border-gray-100 text-gray-600 hover:border-primary/30'
                  }`}
                >
                  {t === 'weekly' ? 'Every Week' : 'Every Month'}
                </button>
              ))}
            </div>
          </div>
          {holType === 'weekly' ? (
            <div>
              <FieldLabel>Day of Week</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setHolDay(d)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                      holDay === d ? 'bg-primary text-white border-primary' : 'border-gray-100 text-gray-600 hover:border-primary/30'
                    }`}
                  >
                    {DAY_SHORT[d]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <FieldLabel>Day of Month</FieldLabel>
              <select
                value={holDayOfMonth}
                onChange={e => setHolDayOfMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
              >
                {[...Array(31)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}{ordinalSuffix(i+1)}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={handleAddHoliday} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90">Add Holiday</button>
            <button onClick={() => setHolModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </Modal>
      )}

      {specialModal && (
        <Modal title="Add Special Working Day" onClose={() => setSpecialModal(false)}>
          <p className="text-sm text-gray-500">This will override a holiday or closed day to allow bookings.</p>
          <div>
            <FieldLabel>Date</FieldLabel>
            <DatePicker
              selected={specialDate}
              onChange={setSpecialDate}
              dateFormat="MMMM d, yyyy"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary"
              minDate={new Date()}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleAddSpecial} className="flex-1 bg-primary text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90">Add Special Day</button>
            <button onClick={() => setSpecialModal(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SlotManagement;
