// backend/utils/slotUtils.js
import SlotSettings from '../models/SlotSettings.js';
import BlockedDate from '../models/BlockedDate.js';
import RecurringHoliday from '../models/RecurringHoliday.js';
import SpecialWorkingDay from '../models/SpecialWorkingDay.js';

/**
 * Check if a date is blocked
 */
const isDateBlocked = async(date) => {
    const dateStr = new Date(date).toISOString().split('T')[0];

    // Check blocked dates
    const blockedDate = await BlockedDate.findOne({
        date: {
            $gte: new Date(dateStr),
            $lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000)
        }
    });

    if (blockedDate) return true;

    // Check recurring holidays
    const dateObj = new Date(date);
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateObj.getDay()];
    const dayOfMonth = dateObj.getDate();

    const recurringHolidays = await RecurringHoliday.find({
        $or: [
            { type: 'weekly', value: dayOfWeek },
            { type: 'monthly', value: dayOfMonth.toString() }
        ]
    });

    return recurringHolidays.length > 0;
};

/**
 * Check if a date is a special working day
 */
const isSpecialWorkingDay = async(date) => {
    const dateStr = new Date(date).toISOString().split('T')[0];

    const specialDay = await SpecialWorkingDay.findOne({
        date: {
            $gte: new Date(dateStr),
            $lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000)
        }
    });

    return !!specialDay;
};

/**
 * Generate time slots for a specific date
 */
export const generateAvailableSlots = async(dateString) => {
    try {
        const settings = await SlotSettings.findOne();

        if (!settings) {
            return {
                slots: [],
                error: 'Slot settings not configured'
            };
        }

        const date = new Date(dateString);
        const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];

        // Check if date is blocked
        const blocked = await isDateBlocked(date);
        const specialWorking = await isSpecialWorkingDay(date);

        // If blocked and not special working day, return empty
        if (blocked && !specialWorking) {
            return {
                slots: [],
                error: 'This date is blocked'
            };
        }

        // Check if day is normally open (unless it's a special working day)
        if (!specialWorking && !settings.daysOpen.includes(dayOfWeek)) {
            return {
                slots: [],
                error: 'Closed on this day'
            };
        }

        // Check date range
        if (date < settings.openSlotsFromDate || date > settings.openSlotsTillDate) {
            return {
                slots: [],
                error: 'Date outside booking range'
            };
        }

        // Check max advance booking
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date(today);
        maxDate.setDate(maxDate.getDate() + settings.maxAdvanceBookingDays);

        if (date > maxDate) {
            return {
                slots: [],
                error: `Can only book ${settings.maxAdvanceBookingDays} days in advance`
            };
        }

        // Generate slots
        const slots = [];
        const [startHour, startMin] = settings.slotStartTime.split(':').map(Number);
        const [endHour, endMin] = settings.slotEndTime.split(':').map(Number);

        let currentTime = new Date(date);
        currentTime.setHours(startHour, startMin, 0, 0);

        const endTime = new Date(date);
        endTime.setHours(endHour, endMin, 0, 0);

        // Handle break time
        let breakStart, breakEnd;
        if (settings.breakTime) {
            const [breakStartHour, breakStartMin] = settings.breakStartTime.split(':').map(Number);
            const [breakEndHour, breakEndMin] = settings.breakEndTime.split(':').map(Number);

            breakStart = new Date(date);
            breakStart.setHours(breakStartHour, breakStartMin, 0, 0);

            breakEnd = new Date(date);
            breakEnd.setHours(breakEndHour, breakEndMin, 0, 0);
        }

        const now = new Date();
        const minBookingTime = settings.minBookingTimeBeforeSlot * 60 * 60 * 1000; // Convert hours to ms

        while (currentTime < endTime) {
            // Skip break time
            if (settings.breakTime && currentTime >= breakStart && currentTime < breakEnd) {
                currentTime = new Date(breakEnd);
                continue;
            }

            // Check if slot is in the past or too soon
            if (currentTime - now < minBookingTime) {
                currentTime = new Date(currentTime.getTime() + settings.slotDuration * 60 * 1000);
                continue;
            }

            // Format display time
            const displayTime = currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            slots.push({
                startTime: currentTime.toISOString(),
                displayTime: displayTime
            });

            currentTime = new Date(currentTime.getTime() + settings.slotDuration * 60 * 1000);
        }

        return { slots, error: null };

    } catch (error) {
        console.error('Error generating slots:', error);
        return {
            slots: [],
            error: 'Failed to generate slots'
        };
    }
};

/**
 * Check if a specific slot is available
 */
export const isSlotAvailable = async(dateString, slotTimeISO) => {
    try {
        const { slots, error } = await generateAvailableSlots(dateString);

        if (error) return false;

        return slots.some(slot => slot.startTime === slotTimeISO);

    } catch (error) {
        console.error('Error checking slot availability:', error);
        return false;
    }
};