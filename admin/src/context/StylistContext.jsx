import axios from "axios";
import { createContext, useState } from "react";
import { toast } from "react-toastify";

export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [sToken, setSToken] = useState(
    localStorage.getItem("sToken") ? localStorage.getItem("sToken") : ""
  );
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [dashData, setDashData] = useState(false);
  const [profileData, setProfileData] = useState(false);

  // Getting stylist appointments from Database using API
  const getAppointments = async () => {
    setAppointmentsLoading(true);
    try {
      const { data } = await axios.get(
        backendUrl + "/api/doctor/appointments",
        { headers: { sToken } }
      );

      if (data.success) {
        setAppointments(data.appointments.reverse());
        return data.appointments;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error.message);
      toast.error(
        "Failed to load appointments: " + (error.message || "Unknown error")
      );
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // Function to mark appointment as completed
  const completeAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/complete-appointment",
        { appointmentId },
        { headers: { sToken } }
      );

      if (data.success) {
        toast.success(data.message);
        // Update local state
        setAppointments((prev) =>
          prev.map((app) =>
            app._id === appointmentId ? { ...app, isCompleted: true } : app
          )
        );
        getAppointments(); // Refresh the list
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Function to cancel appointment
  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/doctor/cancel-appointment",
        { appointmentId },
        { headers: { sToken } }
      );

      if (data.success) {
        toast.success(data.message);
        getAppointments(); // Refresh the list
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Getting stylist dashboard data from Database using API
  const getDashData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/dashboard", {
        headers: { sToken },
      });

      if (data.success) {
        setDashData(data.dashData);
        console.log(data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  // Getting stylist profile data from Database using API
  const getProfileData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/doctor/profile", {
        headers: { sToken },
      });

      if (data.success) {
        setProfileData(data.profileData);
        console.log(data.profileData);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const value = {
    sToken,
    setSToken,
    backendUrl,
    appointments,
    appointmentsLoading,
    getAppointments,
    completeAppointment,
    cancelAppointment,
    dashData,
    getDashData,
    profileData,
    setProfileData,
    getProfileData,
  };

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;