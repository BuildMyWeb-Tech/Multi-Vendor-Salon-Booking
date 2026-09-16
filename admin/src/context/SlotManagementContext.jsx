// context/SlotManagementContext.jsx
import axios from "axios";
import { createContext, useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { AdminContext } from "./AdminContext";

export const SlotManagementContext = createContext();

const SlotManagementContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  // Get aToken from AdminContext instead of managing it separately
  const { aToken } = useContext(AdminContext);

  // State variables for slot management
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    slotStartTime: '09:00',
    slotEndTime: '17:00',
    slotDuration: 30,
    breakTime: true,
    breakStartTime: '13:00',
    breakEndTime: '14:00',
    daysOpen: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    openSlotsFromDate: new Date(),
    openSlotsTillDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    blockedDates: [],
    recurringHolidays: [],
    specialWorkingDays: [],
    allowRescheduling: true,
    rescheduleHoursBefore: 24,
    maxAdvanceBookingDays: 30,
    minBookingTimeBeforeSlot: 2,
    advancePaymentRequired: false,
    advancePaymentPercentage: 50
  });

  // Fetch slot settings
  const fetchSettings = async () => {
    if (!aToken) {
      console.log('No admin token available');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/api/admin/slot-settings`, { 
        headers: { aToken } 
      });
      
      if (data.success) {
        // Merge settings with the fetched arrays
        const processedData = {
          ...data.settings,
          openSlotsFromDate: new Date(data.settings.openSlotsFromDate),
          openSlotsTillDate: new Date(data.settings.openSlotsTillDate),
          blockedDates: data.blockedDates || [],
          recurringHolidays: data.recurringHolidays || [],
          specialWorkingDays: data.specialWorkingDays || []
        };
        
        console.log('Processed settings:', processedData);
        setSettings(processedData);
      } else {
        toast.error(data.message || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error fetching slot settings:', error);
      toast.error('Failed to load slot settings');
    } finally {
      setLoading(false);
    }
  };

  // Save slot settings
  const saveSettings = async (settingsData) => {
    if (!aToken) {
      toast.error('Not authorized. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/slot-settings`, 
        settingsData, 
        { headers: { aToken } }
      );
      
      if (data.success) {
        toast.success('Settings saved successfully');
        await fetchSettings();
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving slot settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Add a blocked date
  const addBlockedDate = async (date, reason) => {
    if (!aToken) {
      toast.error('Not authorized. Please login again.');
      return null;
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/blocked-dates`, 
        { date, reason }, 
        { headers: { aToken } }
      );
      
      if (data.success) {
        toast.success('Date blocked successfully');
        await fetchSettings();
        return data.blockedDate;
      } else {
        toast.error(data.message || 'Failed to block date');
        return null;
      }
    } catch (error) {
      console.error('Error blocking date:', error);
      toast.error('Failed to block date');
      return null;
    }
  };

  // Remove a blocked date
  const removeBlockedDate = async (id) => {
    if (!aToken) {
      toast.error('Not authorized. Please login again.');
      return false;
    }

    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/admin/blocked-dates/${id}`, 
        { headers: { aToken } }
      );
      
      if (data.success) {
        toast.success('Blocked date removed');
        await fetchSettings();
        return true;
      } else {
        toast.error(data.message || 'Failed to remove blocked date');
        return false;
      }
    } catch (error) {
      console.error('Error removing blocked date:', error);
      toast.error('Failed to remove blocked date');
      return false;
    }
  };

  // Add a recurring holiday
  const addRecurringHoliday = async (name, type, value) => {
    if (!aToken) {
      toast.error('Not authorized. Please login again.');
      return null;
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/recurring-holidays`, 
        { name, type, value }, 
        { headers: { aToken } }
      );
      
      if (data.success) {
        toast.success('Recurring holiday added');
        await fetchSettings();
        return data.recurringHoliday;
      } else {
        toast.error(data.message || 'Failed to add recurring holiday');
        return null;
      }
    } catch (error) {
      console.error('Error adding recurring holiday:', error);
      toast.error('Failed to add recurring holiday');
      return null;
    }
  };

  // Remove a recurring holiday
  const removeRecurringHoliday = async (id) => {
    if (!aToken) {
      toast.error('Not authorized. Please login again.');
      return false;
    }

    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/admin/recurring-holidays/${id}`, 
        { headers: { aToken } }
      );
      
      if (data.success) {
        toast.success('Recurring holiday removed');
        await fetchSettings();
        return true;
      } else {
        toast.error(data.message || 'Failed to remove recurring holiday');
        return false;
      }
    } catch (error) {
      console.error('Error removing recurring holiday:', error);
      toast.error('Failed to remove recurring holiday');
      return false;
    }
  };

  // Add a special working day
  const addSpecialWorkingDay = async (date) => {
    if (!aToken) {
      toast.error('Not authorized. Please login again.');
      return null;
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/admin/special-working-days`, 
        { date }, 
        { headers: { aToken } }
      );
      
      if (data.success) {
        toast.success('Special working day added');
        await fetchSettings();
        return data.specialWorkingDay;
      } else {
        toast.error(data.message || 'Failed to add special working day');
        return null;
      }
    } catch (error) {
      console.error('Error adding special working day:', error);
      toast.error('Failed to add special working day');
      return null;
    }
  };

  // Remove a special working day
  const removeSpecialWorkingDay = async (id) => {
    if (!aToken) {
      toast.error('Not authorized. Please login again.');
      return false;
    }

    try {
      const { data } = await axios.delete(
        `${backendUrl}/api/admin/special-working-days/${id}`, 
        { headers: { aToken } }
      );
      
      if (data.success) {
        toast.success('Special working day removed');
        await fetchSettings();
        return true;
      } else {
        toast.error(data.message || 'Failed to remove special working day');
        return false;
      }
    } catch (error) {
      console.error('Error removing special working day:', error);
      toast.error('Failed to remove special working day');
      return false;
    }
  };

  // Get available slots for a specific date and doctor
  const getAvailableSlots = async (date, docId) => {
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/user/available-slots`, 
        { 
          params: { date, docId },
          headers: { uToken: localStorage.getItem('uToken') } 
        }
      );
      
      if (data.success) {
        return { success: true, slots: data.slots };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return { success: false, message: 'Failed to fetch available slots' };
    }
  };

  // Load settings when aToken becomes available
  useEffect(() => {
    if (aToken) {
      fetchSettings();
    }
  }, [aToken]);

  const value = {
    loading,
    settings,
    fetchSettings,
    saveSettings,
    addBlockedDate,
    removeBlockedDate,
    addRecurringHoliday,
    removeRecurringHoliday,
    addSpecialWorkingDay,
    removeSpecialWorkingDay,
    getAvailableSlots
  };

  return (
    <SlotManagementContext.Provider value={value}>
      {props.children}
    </SlotManagementContext.Provider>
  );
};

export default SlotManagementContextProvider;