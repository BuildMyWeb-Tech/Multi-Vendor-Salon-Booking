import React from 'react'
import {
  Scissors,
  Phone,
  Mail,
  Award,
  Camera,
  Plus,
  Trash,
  Clock,
  Settings
} from 'lucide-react'

const MyProfile = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

        {/* HEADER */}
        <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Scissors className="text-primary" />
            My Profile
          </h1>
          <p className="text-gray-500">
            Manage your personal and professional details
          </p>
        </div>

        {/* PROFILE CONTENT */}
        <ProfileContent />

      </div>
    </div>
  )
}

export default MyProfile

/* -------------------------------- PROFILE CONTENT -------------------------------- */

const ProfileContent = () => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex flex-col sm:flex-row gap-6">

          {/* IMAGE */}
          <div className="sm:w-1/3 md:w-1/4 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full overflow-hidden relative mb-4">
              <img
                src="https://randomuser.me/api/portraits/men/85.jpg"
                alt="Stylist"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition cursor-pointer">
                <Camera className="text-white" />
              </div>
            </div>

            <button className="border border-primary text-primary px-4 py-2 rounded-md text-sm hover:bg-primary/10 w-full">
              Change Photo
            </button>
          </div>

          {/* DETAILS */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

              <Input label="Full Name" defaultValue="James Rodriguez" />
              <Input label="Email" type="email" defaultValue="james@stylestudio.com" />
              <Input label="Phone" defaultValue="+91 9876543210" />

              <div>
                <label className="text-sm font-medium">Specialization</label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option>Master Hair Stylist</option>
                  <option>Hair Coloring Specialist</option>
                  <option>Bridal Hairstylist</option>
                </select>
              </div>
            </div>

            <Textarea
              label="About"
              defaultValue="Professional hairstylist with 8+ years experience in modern cuts, coloring and styling."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <Input label="Experience" defaultValue="8 Years" />
              <Input label="Languages" defaultValue="English, Tamil, Hindi" />
            </div>

            {/* CERTIFICATIONS */}
            <h3 className="font-medium mb-3">Professional Certifications</h3>

            <Certification
              title="Advanced Hair Coloring"
              subtitle="L'Oreal Professional, 2020"
            />
            <Certification
              title="Master Stylist Certification"
              subtitle="Vidal Sassoon Academy, 2018"
            />

            <button className="mt-3 w-full border border-dashed p-2 rounded-md text-sm flex justify-center items-center gap-2">
              <Plus size={16} /> Add Certification
            </button>

            <div className="flex justify-end gap-3 mt-6">
              <button className="border px-4 py-2 rounded-md">Cancel</button>
              <button className="bg-primary text-white px-4 py-2 rounded-md">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER GRID */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

        
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-medium flex items-center gap-2 mb-4">
            <Clock className="text-primary" /> Working Hours
          </h3>

          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="flex justify-between mb-2">
              <span>{day}</span>
              <span className="text-sm text-gray-500">9:00 AM – 6:00 PM</span>
            </div>
          ))}

          <p className="text-sm text-red-500">Sunday – Closed</p>
        </div>

        
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-medium flex items-center gap-2 mb-4">
            <Settings className="text-primary" /> Account Settings
          </h3>

          <SettingItem title="Change Password" />
          <SettingItem title="Notification Settings" />
          <SettingItem title="Two Factor Authentication" status="Enabled" />
          <SettingItem title="Delete Account" danger />
        </div>
      </div> */}
    </div>
  )
}

/* -------------------------------- SMALL COMPONENTS -------------------------------- */

const Input = ({ label, ...props }) => (
  <div>
    <label className="text-sm font-medium">{label}</label>
    <input {...props} className="w-full mt-1 p-2 border rounded-md" />
  </div>
)

const Textarea = ({ label, ...props }) => (
  <div className="mb-6">
    <label className="text-sm font-medium">{label}</label>
    <textarea {...props} rows="4" className="w-full mt-1 p-2 border rounded-md" />
  </div>
)

const Certification = ({ title, subtitle }) => (
  <div className="flex items-center border rounded-md p-3 mb-2">
    <Award className="text-yellow-500 mr-3" />
    <div className="flex-1">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
    <Trash className="text-gray-400 hover:text-red-500 cursor-pointer" />
  </div>
)

const SettingItem = ({ title, status, danger }) => (
  <div className={`flex justify-between items-center p-3 border rounded-md mb-3 ${danger ? 'bg-red-50 border-red-200' : ''}`}>
    <span className={danger ? 'text-red-700' : ''}>{title}</span>
    {status ? (
      <span className="text-green-700 text-sm">{status}</span>
    ) : (
      <button className="text-sm border px-3 py-1 rounded-md">Manage</button>
    )}
  </div>
)
