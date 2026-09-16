// pages/Admin/SlotManagement.jsx (updated with context integration)
import React, { useState, useEffect, useContext } from 'react';
import { SlotManagementContext } from '../../context/SlotManagementContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';
import { 
  Clock, 
  Calendar, 
  PlusCircle, 
  Trash, 
  AlertCircle, 
  Save, 
  X, 
  Check, 
  ChevronLeft, 
  AlarmClock,
  CalendarDays,
  CalendarX,
  CalendarClock,
  CalendarRange,
  CalendarPlus,
  RotateCcw,
  TimerReset,
  Timer,
  Settings,
  Loader
} from 'lucide-react';

const SlotManagement = () => {
  const {
    loading,
    settings,
    saveSettings: saveSettingsToAPI,
    addBlockedDate: addBlockedDateToAPI,
    removeBlockedDate: removeBlockedDateFromAPI,
    addRecurringHoliday: addRecurringHolidayToAPI,
    removeRecurringHoliday: removeRecurringHolidayFromAPI,
    addSpecialWorkingDay: addSpecialWorkingDayToAPI,
    removeSpecialWorkingDay: removeSpecialWorkingDayFromAPI
  } = useContext(SlotManagementContext);

  // Local state for form values
  const [localSettings, setLocalSettings] = useState({...settings});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockDate, setBlockDate] = useState(new Date());
  const [blockReason, setBlockReason] = useState('');
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringType, setRecurringType] = useState('weekly');
  const [recurringDay, setRecurringDay] = useState('Monday');
  const [recurringDate, setRecurringDate] = useState(1);
  const [recurringName, setRecurringName] = useState('');
  const [showSpecialModal, setShowSpecialModal] = useState(false);
  const [specialDate, setSpecialDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('basic');

  // Days array
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Update local settings when settings from context change
  useEffect(() => {
    setLocalSettings({...settings});
  }, [settings]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLocalSettings({ ...localSettings, [name]: value });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setLocalSettings({ ...localSettings, [name]: checked });
  };

  const handleDayToggle = (day) => {
    const daysOpen = [...localSettings.daysOpen];
    if (daysOpen.includes(day)) {
      setLocalSettings({ 
        ...localSettings, 
        daysOpen: daysOpen.filter(d => d !== day)
      });
    } else {
      setLocalSettings({
        ...localSettings,
        daysOpen: [...daysOpen, day]
      });
    }
  };

  const handleDateRangeChange = (dateType, date) => {
    setLocalSettings({
      ...localSettings,
      [dateType]: date
    });
  };

  const addBlockedDate = async () => {
    try {
      const result = await addBlockedDateToAPI(blockDate, blockReason);
      if (result) {
        setBlockDate(new Date());
        setBlockReason('');
        setShowBlockModal(false);
      }
    } catch (err) {
      setError('Failed to block date');
    }
  };

  const removeBlockedDate = async (id) => {
    try {
      await removeBlockedDateFromAPI(id);
    } catch (err) {
      setError('Failed to remove blocked date');
    }
  };

  const addRecurringHoliday = async () => {
    try {
      const value = recurringType === 'weekly' ? recurringDay : recurringDate.toString();
      const result = await addRecurringHolidayToAPI(recurringName, recurringType, value);
      
      if (result) {
        setRecurringName('');
        setRecurringType('weekly');
        setRecurringDay('Monday');
        setRecurringDate(1);
        setShowRecurringModal(false);
      }
    } catch (err) {
      setError('Failed to add recurring holiday');
    }
  };

  const removeRecurringHoliday = async (id) => {
    try {
      await removeRecurringHolidayFromAPI(id);
    } catch (err) {
      setError('Failed to remove recurring holiday');
    }
  };

  const addSpecialWorkingDay = async () => {
    try {
      const result = await addSpecialWorkingDayToAPI(specialDate);
      
      if (result) {
        setSpecialDate(new Date());
        setShowSpecialModal(false);
      }
    } catch (err) {
      setError('Failed to add special working day');
    }
  };

  const removeSpecialWorkingDay = async (id) => {
    try {
      await removeSpecialWorkingDayFromAPI(id);
    } catch (err) {
      setError('Failed to remove special working day');
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      await saveSettingsToAPI(localSettings);
      // setSuccess('Settings saved successfully');
    } catch (err) {
      setError('Failed to save settings');
    }
  };

  return (
  <div className="w-full max-w-7xl mx-auto px-4 py-6">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <CalendarClock className="h-6 w-6 text-primary" />
        Slot Management
      </h1>
      <div className="text-sm text-gray-500">Control your salon's availability</div>
    </div>
    
    {error && (
      <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 border border-red-200">
        <AlertCircle size={18} />
        {error}
      </div>
    )}
    
    {success && (
      <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2 border border-green-200">
        <Check size={18} />
        {success}
      </div>
    )}
    
    {/* Tabs */}  
    <div className="mb-6 border-b border-gray-200">
      <div className="flex overflow-x-auto">
        <button
          className={`py-3 px-5 border-b-2 font-medium text-sm ${activeTab === 'basic' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('basic')}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} />
            Basic Settings
          </div>
        </button>
        <button
          className={`py-3 px-5 border-b-2 font-medium text-sm ${activeTab === 'dates' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('dates')}
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            Date Controls
          </div>
        </button>
        <button
          className={`py-3 px-5 border-b-2 font-medium text-sm ${activeTab === 'booking' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('booking')}
        >
          <div className="flex items-center gap-2">
            <Settings size={16} />
            Booking Rules
          </div>
        </button>
      </div>
    </div>
    
    <form onSubmit={saveSettings}>
      {/* Basic Settings */}
      {activeTab === 'basic' && (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden mb-6 animate-fadeIn">
          <div className="p-5 border-b bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Operating Hours
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Slot Start Time</label>
                <input 
                  type="time" 
                  name="slotStartTime" 
                  value={localSettings.slotStartTime} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Slot End Time</label>
                <input 
                  type="time" 
                  name="slotEndTime" 
                  value={localSettings.slotEndTime} 
                  onChange={handleInputChange} 
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
            </div>
            
            <div className="mt-6 space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Slot Duration (minutes)</label>
              <select 
                name="slotDuration" 
                value={localSettings.slotDuration} 
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
            
            <div className="mt-6 flex items-center">
              <input 
                type="checkbox" 
                id="breakTime"
                name="breakTime" 
                checked={localSettings.breakTime} 
                onChange={handleCheckboxChange}
                className="rounded text-primary focus:ring-primary"
              />
              <label htmlFor="breakTime" className="ml-2 text-sm font-medium text-gray-700">
                Enable Break Time
              </label>
            </div>
            
            {localSettings.breakTime && (
              <div className="mt-4 ml-6 pl-4 border-l-2 border-gray-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Break Start Time</label>
                    <input 
                      type="time" 
                      name="breakStartTime" 
                      value={localSettings.breakStartTime} 
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-gray-700">Break End Time</label>
                    <input 
                      type="time" 
                      name="breakEndTime" 
                      value={localSettings.breakEndTime} 
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Days Open</label>
              <div className="flex flex-wrap gap-3">
                {days.map(day => (
                  <label 
                    key={day} 
                    className={`flex items-center px-4 py-2 rounded-full cursor-pointer ${
                      localSettings.daysOpen?.includes(day) 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={localSettings.daysOpen?.includes(day) || false}
                      onChange={() => handleDayToggle(day)}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{day.substring(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Date Controls */}
      {activeTab === 'dates' && (
        <div className="space-y-6 animate-fadeIn">
          {/* <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CalendarRange size={18} className="text-primary" />
                Availability Period
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Open Slots From Date</label>
                  <div className="custom-datepicker">
                    <DatePicker
                      selected={localSettings.openSlotsFromDate}
                      onChange={(date) => handleDateRangeChange('openSlotsFromDate', date)}
                      dateFormat="MMMM d, yyyy"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Open Slots Till Date</label>
                  <div className="custom-datepicker">
                    <DatePicker
                      selected={localSettings.openSlotsTillDate}
                      onChange={(date) => handleDateRangeChange('openSlotsTillDate', date)}
                      dateFormat="MMMM d, yyyy"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      minDate={localSettings.openSlotsFromDate}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div> */}
          
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50 flex flex-wrap justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CalendarX size={18} className="text-primary" />
                Blocked Dates
              </h2>
              
              <button 
                type="button" 
                className="bg-white text-primary border border-primary px-4 py-1.5 rounded-lg hover:bg-primary/5 flex items-center gap-1.5 text-sm"
                onClick={() => setShowBlockModal(true)}
              >
                <PlusCircle size={16} />
                Add Blocked Date
              </button>
            </div>
            
            <div className="p-6">
              {localSettings.blockedDates && localSettings.blockedDates.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {localSettings.blockedDates.map(item => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {new Date(item.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.reason}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button 
                              type="button"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeBlockedDate(item._id)}
                            >
                              <Trash size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarX size={40} className="mx-auto text-gray-300 mb-2" />
                  <p>No blocked dates added</p>
                  <button 
                    type="button" 
                    className="mt-3 text-primary hover:underline text-sm"
                    onClick={() => setShowBlockModal(true)}
                  >
                    Add your first blocked date
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50 flex flex-wrap justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CalendarClock size={18} className="text-primary" />
                Recurring Holidays
              </h2>
              
              <button 
                type="button" 
                className="bg-white text-primary border border-primary px-4 py-1.5 rounded-lg hover:bg-primary/5 flex items-center gap-1.5 text-sm"
                onClick={() => setShowRecurringModal(true)}
              >
                <PlusCircle size={16} />
                Add Recurring Holiday
              </button>
            </div>
            
            <div className="p-6">
              {localSettings.recurringHolidays && localSettings.recurringHolidays.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {localSettings.recurringHolidays.map(item => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm capitalize text-gray-700">
                            {item.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.type === 'weekly' ? item.value : `Day ${item.value} of each month`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button 
                              type="button"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeRecurringHoliday(item._id)}
                            >
                              <Trash size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarClock size={40} className="mx-auto text-gray-300 mb-2" />
                  <p>No recurring holidays added</p>
                  <button 
                    type="button" 
                    className="mt-3 text-primary hover:underline text-sm"
                    onClick={() => setShowRecurringModal(true)}
                  >
                    Add your first recurring holiday
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50 flex flex-wrap justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <CalendarPlus size={18} className="text-primary" />
                Special Working Days
              </h2>
              
              <button 
                type="button" 
                className="bg-white text-primary border border-primary px-4 py-1.5 rounded-lg hover:bg-primary/5 flex items-center gap-1.5 text-sm"
                onClick={() => setShowSpecialModal(true)}
              >
                <PlusCircle size={16} />
                Add Special Day
              </button>
            </div>
            
            <div className="p-6">
              {localSettings.specialWorkingDays && localSettings.specialWorkingDays.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {localSettings.specialWorkingDays.map(item => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {new Date(item.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button 
                              type="button"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => removeSpecialWorkingDay(item._id)}
                            >
                              <Trash size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarPlus size={40} className="mx-auto text-gray-300 mb-2" />
                  <p>No special working days added</p>
                  <button 
                    type="button" 
                    className="mt-3 text-primary hover:underline text-sm"
                    onClick={() => setShowSpecialModal(true)}
                  >
                    Add your first special working day
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Booking Rules */}
      {activeTab === 'booking' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <RotateCcw size={18} className="text-primary" />
                Rescheduling Options
              </h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="allowRescheduling"
                  name="allowRescheduling" 
                  checked={localSettings.allowRescheduling} 
                  onChange={handleCheckboxChange}
                  className="rounded text-primary focus:ring-primary"
                />
                <label htmlFor="allowRescheduling" className="ml-2 text-sm font-medium text-gray-700">
                  Allow Appointment Rescheduling
                </label>
              </div>
              
              {localSettings.allowRescheduling && (
                <div className="mt-4 ml-6 pl-4 border-l-2 border-gray-200">
                  <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Allow Rescheduling Before (hours)
                    </label>
                    <input 
                      type="number" 
                      name="rescheduleHoursBefore" 
                      value={localSettings.rescheduleHoursBefore} 
                      onChange={handleInputChange} 
                      min="1"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Clients can reschedule appointments if it's at least this many hours before the appointment time
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <TimerReset size={18} className="text-primary" />
                Advance Booking Rules
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Maximum Advance Booking Days</label>
                  <input 
                    type="number" 
                    name="maxAdvanceBookingDays" 
                    value={localSettings.maxAdvanceBookingDays} 
                    onChange={handleInputChange} 
                    min="1"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How many days in advance can clients book appointments
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700">Minimum Booking Time Before Slot (hours)</label>
                  <input 
                    type="number" 
                    name="minBookingTimeBeforeSlot" 
                    value={localSettings.minBookingTimeBeforeSlot} 
                    onChange={handleInputChange} 
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum hours before an appointment that clients can book (e.g., 2 means clients must book at least 2 hours before)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Save Button */}
      <div className="mt-8">
        <button 
          type="submit" 
          className="w-full md:w-auto bg-primary text-white font-medium py-3 px-8 rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader size={20} className="animate-spin" />
              <span>Saving Settings...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </form>
    
    {/* Modals */}
    {/* Blocked Date Modal */}
    {showBlockModal && (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
            aria-hidden="true"
            onClick={() => setShowBlockModal(false)}
          ></div>
          
          {/* Modal */}
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <CalendarX className="h-6 w-6 text-red-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Add Blocked Date
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <div className="mt-1 custom-datepicker">
                        <DatePicker
                          selected={blockDate}
                          onChange={setBlockDate}
                          dateFormat="MMMM d, yyyy"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          minDate={new Date()}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reason</label>
                      <input 
                        type="text" 
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="e.g. Holiday, Maintenance, etc."
                        className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button 
                type="button" 
                onClick={addBlockedDate}
                disabled={!blockReason}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
              >
                Add Blocked Date
              </button>
              <button 
                type="button" 
                onClick={() => setShowBlockModal(false)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Recurring Holiday Modal */}
    {showRecurringModal && (
      <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
            aria-hidden="true"
            onClick={() => setShowRecurringModal(false)}
          ></div>
          
          {/* Modal */}
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                  <CalendarClock className="h-6 w-6 text-blue-600" aria-hidden="true" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Add Recurring Holiday
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Holiday Name</label>
                      <input 
                        type="text" 
                        value={recurringName}
                        onChange={(e) => setRecurringName(e.target.value)}
                        placeholder="e.g. Sunday Closure, Staff Training"
                        className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <select
                        value={recurringType}
                        onChange={(e) => setRecurringType(e.target.value)}
                        className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      >
                        <option value="weekly">Weekly (Same day every week)</option>
                        <option value="monthly">Monthly (Same date every month)</option>
                      </select>
                    </div>
                    
                    {recurringType === 'weekly' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Day of Week</label>
                        <select
                          value={recurringDay}
                          onChange={(e) => setRecurringDay(e.target.value)}
                          className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        >
                          {days.map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Day of Month</label>
                        <select
                          value={recurringDate}
                          onChange={(e) => setRecurringDate(parseInt(e.target.value))}
                          className="mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        >
                          {[...Array(31)].map((_, i) => (
                            <option key={i+1} value={i+1}>
                              {i+1}{getOrdinalSuffix(i+1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button 
                type="button" 
                onClick={addRecurringHoliday}
                disabled={!recurringName}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none disabled:bg-gray-400 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
              >
                Add Holiday
              </button>
              <button 
                type="button" 
                onClick={() => setShowRecurringModal(false)}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Special Working Days Modal */}
      {showSpecialModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={() => setShowSpecialModal(false)}
            ></div>
            
            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CalendarPlus className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Add Special Working Day
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Add days when you'll be working even though they would normally be closed (like holidays or weekends)
                    </p>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <div className="mt-1 custom-datepicker">
                        <DatePicker
                          selected={specialDate}
                          onChange={setSpecialDate}
                          dateFormat="MMMM d, yyyy"
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          minDate={new Date()}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  onClick={addSpecialWorkingDay}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary/90 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Add Special Working Day
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowSpecialModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toast.show && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-md flex items-center gap-2 animate-slideIn">
          <CheckCircle size={20} className="text-green-600" />
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast({ show: false, message: '' })}
            className="ml-auto text-green-600 hover:text-green-800"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SlotManagement;
