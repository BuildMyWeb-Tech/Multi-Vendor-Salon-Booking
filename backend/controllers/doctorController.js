import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";

// API for doctor Login 
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
    try {
        const { docId } = req.body
        
        // ✅ FIX: Query using doctorId instead of docId
        const appointments = await appointmentModel
            .find({ doctorId: docId })
            .populate('userId', 'name phone email image dob')
            .sort({ createdAt: -1 })

        // ✅ Process appointments to ensure userData is present
        const processedAppointments = appointments.map(app => {
            const appObj = app.toObject()

            // Normalize userData from populated userId
            if (!appObj.userData && appObj.userId) {
                appObj.userData = {
                    _id: appObj.userId._id,
                    name: appObj.userId.name,
                    phone: appObj.userId.phone,
                    email: appObj.userId.email,
                    image: appObj.userId.image,
                    dob: appObj.userId.dob
                }
            }

            return appObj
        })

        res.json({ success: true, appointments: processedAppointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        
        // ✅ FIX: Check doctorId instead of docId
        if (appointmentData && appointmentData.doctorId.toString() === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { 
                cancelled: true,
                cancelledBy: 'doctor'
            })
            
            // ✅ Remove slot from doctor's booked slots
            const doctor = await doctorModel.findById(docId)
            if (doctor) {
                const slotDate = appointmentData.slotDate
                let slots_booked = doctor.slots_booked || new Map()
                
                // Convert to Map if needed
                if (!(slots_booked instanceof Map)) {
                    const oldSlots = slots_booked
                    slots_booked = new Map()
                    for (const [key, value] of Object.entries(oldSlots)) {
                        slots_booked.set(key, value)
                    }
                }
                
                const bookedSlotsForDate = slots_booked.get(slotDate) || []
                
                // Convert appointment time back to 24-hour format
                const slotTimeStr = appointmentData.slotTime
                let time24hr = ''
                
                const timeParts = slotTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i)
                if (timeParts) {
                    let hours = parseInt(timeParts[1])
                    const minutes = timeParts[2]
                    const period = timeParts[3].toUpperCase()
                    
                    if (period === 'PM' && hours !== 12) hours += 12
                    if (period === 'AM' && hours === 12) hours = 0
                    
                    time24hr = `${String(hours).padStart(2, '0')}:${minutes}`
                }
                
                // Remove the time slot
                const updatedSlots = bookedSlotsForDate.filter(time => time !== time24hr)
                slots_booked.set(slotDate, updatedSlots)
                
                await doctorModel.findByIdAndUpdate(
                    docId,
                    { slots_booked },
                    { runValidators: false }
                )
            }
            
            return res.json({ success: true, message: 'Appointment Cancelled' })
        }

        res.json({ success: false, message: 'Unauthorized action' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        
        // ✅ FIX: Check doctorId instead of docId
        if (appointmentData && appointmentData.doctorId.toString() === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true })
            return res.json({ success: true, message: 'Appointment Completed' })
        }

        res.json({ success: false, message: 'Unauthorized action' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to change doctor availability for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {
        const { docId } = req.body

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availability Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for Doctor Panel
const doctorProfile = async (req, res) => {
    try {
        const { docId } = req.body
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {
        const { docId, fees, address, available } = req.body

        await doctorModel.findByIdAndUpdate(docId, { fees, address, available })

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body

        // ✅ FIX: Query using doctorId instead of docId
        const appointments = await appointmentModel
            .find({ doctorId: docId })
            .populate('userId', 'name phone email image')
            .sort({ createdAt: -1 })

        let earnings = 0

        appointments.forEach((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount
            }
        })

        let patients = []

        appointments.forEach((item) => {
            if (!patients.includes(item.userId._id.toString())) {
                patients.push(item.userId._id.toString())
            }
        })

        // ✅ Process appointments to ensure userData is present
        const processedAppointments = appointments.map(app => {
            const appObj = app.toObject()

            if (!appObj.userData && appObj.userId) {
                appObj.userData = {
                    _id: appObj.userId._id,
                    name: appObj.userId.name,
                    phone: appObj.userId.phone,
                    email: appObj.userId.email,
                    image: appObj.userId.image
                }
            }

            return appObj
        })

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: processedAppointments
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile
}