import React, { useState, useEffect, useContext } from 'react';
import { SlotManagementContext } from '../../context/SlotManagementContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'react-toastify';
import { 
  Clock, Calendar, PlusCircle, Trash, AlertCircle, Save, Check, 
  CalendarX, CalendarClock, CalendarPlus, Settings, Loader, CreditCard
} from 'lucide-react';

const getOrdinalSuffix = (day) => {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

// ✅ 12hr Time Input Component
const TimeInput12Hr = ({ label, name, value, onChange }) => {
  const to24Hr = (h, m, period) => {
    let hour = parseInt(h);
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${m}`;
  };

  const getValues = () => {
    if (!value) return { hour: '12', minute: '00', period: 'AM' };
    const [h, m] = value.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return { hour: String(hour12), minute: String(m).padStart(2, '0'), period };
  };

  const { hour, minute, period } = getValues();

  const handleChange = (newHour, newMinute, newPeriod) => {
    const time24 = to24Hr(newHour, newMinute, newPeriod);
    onChange({ target: { name, value: time24 } });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-1 items-center border rounded-md px-3 py-2.5 bg-white w-full">
        <select
          value={hour}
          onChange={(e) => handleChange(e.target.value, minute, period)}
          className="border-none outline-none bg-transparent font-medium text-gray-800 cursor-pointer"
        >
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => (
            <option key={h} value={String(h)}>{String(h).padStart(2, '0')}</option>
          ))}
        </select>
        <span className="font-bold text-gray-600">:</span>
        <select
          value={minute}
          onChange={(e) => handleChange(hour, e.target.value, period)}
          className="border-none outline-none bg-transparent font-medium text-gray-800 cursor-pointer"
        >
          {['00', '15', '30', '45'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => handleChange(hour, minute, e.target.value)}
          className="border-none outline-none bg-transparent font-medium text-gray-800 cursor-pointer"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
};

const SlotManagement = () => {
  const {
    loading, settings, saveSettings: saveSettingsToAPI,
    addBlockedDate: addBlockedDateToAPI, removeBlockedDate: removeBlockedDateFromAPI,
    addRecurringHoliday: addRecurringHolidayToAPI, removeRecurringHoliday: removeRecurringHolidayFromAPI,
    addSpecialWorkingDay: addSpecialWorkingDayToAPI, removeSpecialWorkingDay: removeSpecialWorkingDayFromAPI
  } = useContext(SlotManagementContext);

  const [localSettings, setLocalSettings] = useState({...settings});
  const [error, setError] = useState('');
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

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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

  const addBlockedDate = async () => {
    if (!blockReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    const result = await addBlockedDateToAPI(blockDate, blockReason);
    if (result) {
      setBlockDate(new Date());
      setBlockReason('');
      setShowBlockModal(false);
    }
  };

  const addRecurringHoliday = async () => {
    if (!recurringName.trim()) {
      toast.error('Please provide a holiday name');
      return;
    }
    const value = recurringType === 'weekly' ? recurringDay : recurringDate.toString();
    const result = await addRecurringHolidayToAPI(recurringName, recurringType, value);
    if (result) {
      setRecurringName('');
      setRecurringType('weekly');
      setRecurringDay('Monday');
      setRecurringDate(1);
      setShowRecurringModal(false);
    }
  };

  const addSpecialWorkingDay = async () => {
    const result = await addSpecialWorkingDayToAPI(specialDate);
    if (result) {
      setSpecialDate(new Date());
      setShowSpecialModal(false);
    }
  };

  const saveSettings = async () => {
    setError('');
    await saveSettingsToAPI(localSettings);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Slot Management</h1>
      </div>
      
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}
      
      <div className="mb-6 border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {['basic', 'dates', 'booking', 'payment'].map(tab => (
            <button
              key={tab}
              className={`py-3 px-2 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'basic' && 'Basic Settings'}
              {tab === 'dates' && 'Date Controls'}
              {tab === 'booking' && 'Booking Rules'}
              {tab === 'payment' && 'Payment Settings'}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        {activeTab === 'basic' && (
          <div className="bg-white border rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-6">Operating Hours</h2>
            
            {/* ✅ All 4 time inputs now use 12hr AM/PM format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <TimeInput12Hr
                label="Slot Start Time"
                name="slotStartTime"
                value={localSettings.slotStartTime}
                onChange={handleInputChange}
              />
              <TimeInput12Hr
                label="Slot End Time"
                name="slotEndTime"
                value={localSettings.slotEndTime}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Slot Duration</label>
              <select 
                name="slotDuration" 
                value={localSettings.slotDuration} 
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border rounded-md"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="breakTime" 
                  checked={localSettings.breakTime} 
                  onChange={handleCheckboxChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Enable Break Time</span>
              </label>
            </div>
            
            {localSettings.breakTime && (
              <div className="ml-6 pl-4 border-l-2 border-gray-200 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <TimeInput12Hr
                    label="Break Start"
                    name="breakStartTime"
                    value={localSettings.breakStartTime}
                    onChange={handleInputChange}
                  />
                  <TimeInput12Hr
                    label="Break End"
                    name="breakEndTime"
                    value={localSettings.breakEndTime}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Days Open</label>
              <div className="flex flex-wrap gap-3">
                {days.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayToggle(day)}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      localSettings.daysOpen?.includes(day) 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'dates' && (
          <div className="space-y-6">
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarX size={18} className="text-primary" />
                  Blocked Dates
                </h2>
                <button 
                  type="button" 
                  className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                  onClick={() => setShowBlockModal(true)}
                >
                  <PlusCircle size={16} />
                  Add Blocked Date
                </button>
              </div>
              <div className="p-6">
                {localSettings.blockedDates?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {localSettings.blockedDates.map(item => (
                          <tr key={item._id}>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {new Date(item.date).toLocaleDateString('en-US', { 
                                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{item.reason}</td>
                            <td className="px-6 py-4 text-center">
                              <button 
                                type="button"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => removeBlockedDateFromAPI(item._id)}
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
                    <p>No blocked dates</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarClock size={18} className="text-primary" />
                  Recurring Holidays
                </h2>
                <button 
                  type="button" 
                  className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                  onClick={() => setShowRecurringModal(true)}
                >
                  <PlusCircle size={16} />
                  Add Recurring Holiday
                </button>
              </div>
              <div className="p-6">
                {localSettings.recurringHolidays?.length > 0 ? (
                  <div className="space-y-2">
                    {localSettings.recurringHolidays.map(item => (
                      <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.type === 'weekly' ? `Every ${item.value}` : `${item.value}${getOrdinalSuffix(parseInt(item.value))} of each month`}
                          </p>
                        </div>
                        <button 
                          type="button"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeRecurringHolidayFromAPI(item._id)}
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recurring holidays</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
              <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarPlus size={18} className="text-primary" />
                  Special Working Days
                </h2>
                <button 
                  type="button" 
                  className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
                  onClick={() => setShowSpecialModal(true)}
                >
                  <PlusCircle size={16} />
                  Add Special Day
                </button>
              </div>
              <div className="p-6">
                {localSettings.specialWorkingDays?.length > 0 ? (
                  <div className="space-y-2">
                    {localSettings.specialWorkingDays.map(item => (
                      <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <p className="font-medium">
                          {new Date(item.date).toLocaleDateString('en-US', { 
                            weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </p>
                        <button 
                          type="button"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => removeSpecialWorkingDayFromAPI(item._id)}
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No special working days</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'booking' && (
          <div className="space-y-6">
            <div className="bg-white border rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Rescheduling Options</h2>
              <div className="mb-4">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="allowRescheduling" 
                    checked={localSettings.allowRescheduling} 
                    onChange={handleCheckboxChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Allow Appointment Rescheduling</span>
                </label>
              </div>
              {localSettings.allowRescheduling && (
                <div className="ml-6 pl-4 border-l-2 border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allow Rescheduling Before (hours)
                  </label>
                  <input 
                    type="number" 
                    name="rescheduleHoursBefore" 
                    value={localSettings.rescheduleHoursBefore} 
                    onChange={handleInputChange} 
                    min="1"
                    className="w-full max-w-xs px-3 py-2.5 border rounded-md"
                  />
                </div>
              )}
            </div>
            
            <div className="bg-white border rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Advance Booking Rules</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Advance Booking Days</label>
                  <input 
                    type="number" 
                    name="maxAdvanceBookingDays" 
                    value={localSettings.maxAdvanceBookingDays} 
                    onChange={handleInputChange} 
                    min="1"
                    className="w-full px-3 py-2.5 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Booking Time Before Slot (hours)</label>
                  <input 
                    type="number" 
                    name="minBookingTimeBeforeSlot" 
                    value={localSettings.minBookingTimeBeforeSlot} 
                    onChange={handleInputChange} 
                    min="0"
                    step="0.5"
                    className="w-full px-3 py-2.5 border rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'payment' && (
          <div className="bg-white border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <CreditCard size={20} />
              Payment Settings
            </h2>
            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="advancePaymentRequired" 
                  checked={localSettings.advancePaymentRequired} 
                  onChange={handleCheckboxChange}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Require Advance Payment</span>
              </label>
            </div>
            {localSettings.advancePaymentRequired && (
              <div className="ml-6 pl-4 border-l-2 border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Advance Payment Percentage
                </label>
                <select 
                  name="advancePaymentPercentage" 
                  value={localSettings.advancePaymentPercentage} 
                  onChange={handleInputChange}
                  className="w-full max-w-xs px-3 py-2.5 border rounded-md"
                >
                  <option value={10}>10% - Token Amount</option>
                  <option value={25}>25% - Quarter Payment</option>
                  <option value={30}>30% - Partial Payment</option>
                  <option value={50}>50% - Half Payment</option>
                  <option value={75}>75% - Major Payment</option>
                  <option value={100}>100% - Full Payment</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  Customers will pay {localSettings.advancePaymentPercentage}% of the total service amount
                </p>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-8">
          <button 
            onClick={saveSettings}
            className="w-full md:w-auto bg-primary text-white font-medium py-3 px-8 rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
      
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Blocked Date</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <DatePicker
                selected={blockDate}
                onChange={setBlockDate}
                dateFormat="MMMM d, yyyy"
                className="w-full px-3 py-2 border rounded-md"
                minDate={new Date()}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <input 
                type="text" 
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Holiday, Maintenance"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={addBlockedDate} className="flex-1 bg-primary text-white py-2 rounded-lg">Add</button>
              <button onClick={() => setShowBlockModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRecurringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Recurring Holiday</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Holiday Name</label>
              <input 
                type="text" 
                value={recurringName}
                onChange={(e) => setRecurringName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                value={recurringType}
                onChange={(e) => setRecurringType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {recurringType === 'weekly' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                <select
                  value={recurringDay}
                  onChange={(e) => setRecurringDay(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Day of Month</label>
                <select
                  value={recurringDate}
                  onChange={(e) => setRecurringDate(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {[...Array(31)].map((_, i) => (
                    <option key={i+1} value={i+1}>
                      {i+1}{getOrdinalSuffix(i+1)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={addRecurringHoliday} className="flex-1 bg-primary text-white py-2 rounded-lg">Add</button>
              <button onClick={() => setShowRecurringModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showSpecialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Special Working Day</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <DatePicker
                selected={specialDate}
                onChange={setSpecialDate}
                dateFormat="MMMM d, yyyy"
                className="w-full px-3 py-2 border rounded-md"
                minDate={new Date()}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={addSpecialWorkingDay} className="flex-1 bg-primary text-white py-2 rounded-lg">Add</button>
              <button onClick={() => setShowSpecialModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotManagement;