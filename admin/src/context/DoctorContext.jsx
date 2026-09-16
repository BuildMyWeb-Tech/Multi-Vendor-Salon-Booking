import { createContext, useState } from "react";
import axios from 'axios';
import { toast } from 'react-toastify';

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [dToken, setDToken] = useState(localStorage.getItem('dToken') || '');
    const [appointments, setAppointments] = useState([]);
    const [dashData, setDashData] = useState(false);
    const [profileData, setProfileData] = useState(false);
    const [loading, setLoading] = useState(false);

    // Getting Doctor appointment data from Database using API
    const getAppointments = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(
                backendUrl + '/api/doctor/appointments', 
                { headers: { dToken } }
            );

            if (data.success) {
                setAppointments(data.appointments.reverse());
                return data.appointments;
            } else {
                toast.error(data.message);
                return [];
            }
        } catch (error) {
            console.error("Error fetching appointments:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to fetch appointments");
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Getting Doctor profile data from Database using API
    const getProfileData = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(
                backendUrl + '/api/doctor/profile', 
                { headers: { dToken } }
            );
            
            if (data.success) {
                // Normalize data structure
                const doctor = data.profileData;
                
                // Ensure specialty is always an array
                if (doctor.speciality && !doctor.specialty) {
                    doctor.specialty = Array.isArray(doctor.speciality) ? 
                        doctor.speciality : [doctor.speciality];
                } else if (doctor.specialty && !Array.isArray(doctor.specialty)) {
                    doctor.specialty = [doctor.specialty];
                }
                
                // Ensure price/fees fields are in sync
                if (doctor.fees && !doctor.price) {
                    doctor.price = doctor.fees;
                } else if (doctor.price && !doctor.fees) {
                    doctor.fees = doctor.price;
                }
                
                setProfileData(doctor);
                return doctor;
            } else {
                toast.error(data.message);
                return null;
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to fetch profile data");
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Function to update doctor profile
    const updateProfile = async (formData) => {
        setLoading(true);
        try {
            const { data } = await axios.put(
                backendUrl + '/api/doctor/update-profile',
                formData,
                {
                    headers: {
                        dToken,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            if (data.success) {
                toast.success(data.message || "Profile updated successfully");
                await getProfileData(); // Refresh profile data
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to update profile");
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Function to cancel doctor appointment using API
    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/doctor/cancel-appointment', 
                { appointmentId }, 
                { headers: { dToken } }
            );

            if (data.success) {
                toast.success(data.message);
                await getAppointments();
                await getDashData();
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            console.error("Error cancelling appointment:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to cancel appointment");
            return false;
        }
    };

    // Function to Mark appointment completed using API
    const completeAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(
                backendUrl + '/api/doctor/complete-appointment', 
                { appointmentId }, 
                { headers: { dToken } }
            );

            if (data.success) {
                toast.success(data.message);
                await getAppointments();
                await getDashData();
                return true;
            } else {
                toast.error(data.message);
                return false;
            }
        } catch (error) {
            console.error("Error completing appointment:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to complete appointment");
            return false;
        }
    };

    // Getting Doctor dashboard data using API
    const getDashData = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(
                backendUrl + '/api/doctor/dashboard', 
                { headers: { dToken } }
            );

            if (data.success) {
                setDashData(data.dashData);
                return data.dashData;
            } else {
                toast.error(data.message);
                return null;
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            toast.error(error.response?.data?.message || error.message || "Failed to fetch dashboard data");
            return null;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        dToken, 
        setDToken, 
        backendUrl,
        appointments,
        loading,
        getAppointments,
        cancelAppointment,
        completeAppointment,
        dashData, 
        getDashData,
        profileData, 
        setProfileData,
        getProfileData,
        updateProfile,
    };

    return (
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    );
};

export default DoctorContextProvider;
