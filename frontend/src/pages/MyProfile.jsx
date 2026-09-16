// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\frontend\src\pages\MyProfile.jsx
import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Camera, Pencil, User, Phone, MapPin, Calendar, Clock, X } from 'lucide-react'
import { assets } from '../assets/assets'
import { motion } from 'framer-motion' // Add this package for animations

import { useNavigate } from 'react-router-dom';


const MyProfile = () => {
  const [isEdit, setIsEdit] = useState(false)
  const [image, setImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hairPreferences, setHairPreferences] = useState({
    hairType: '',
    preferredStyles: [],
    allergies: '',
    stylistNotes: ''
  })
  const [newPreferredStyle, setNewPreferredStyle] = useState('')



  const navigate = useNavigate();
  
  const {
    token,
    backendUrl,
    userData,
    setUserData,
    loadUserProfileData
  } = useContext(AppContext);

  // Redirect & load profile
  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      loadUserProfileData();
    }
  }, [token]);


  // Load hair preferences from userData if available
  useEffect(() => {
    if (userData && userData.hairPreferences) {
      setHairPreferences(userData.hairPreferences)
    }
  }, [userData])

  

  const updateUserProfileData = async () => {
    try {
      setLoading(true)
      const formData = new FormData()

      formData.append('name', userData.name)
      formData.append('phone', userData.phone)
      formData.append('address', JSON.stringify(userData.address))
      formData.append('gender', userData.gender)
      formData.append('dob', userData.dob)
      formData.append('hairPreferences', JSON.stringify(hairPreferences))
      image && formData.append('image', image)

      const { data } = await axios.post(
        backendUrl + '/api/user/update-profile',
        formData,
        { headers: { token } }
      )

      if (data.success) {
      toast.success(data.message)
      setImage(false)
      setIsEdit(false)
      await loadUserProfileData(token)  // ← pass token explicitly
    } else {
      toast.error(data.message)
    }
    } catch (error) {
      console.error(error)
      toast.error("Profile update failed")
    } finally {
      setLoading(false)
    }
  }

  const addPreferredStyle = () => {
    if (newPreferredStyle.trim() !== '' && 
        !hairPreferences.preferredStyles.includes(newPreferredStyle.trim())) {
      setHairPreferences({
        ...hairPreferences,
        preferredStyles: [...hairPreferences.preferredStyles, newPreferredStyle.trim()]
      })
      setNewPreferredStyle('')
    }
  }

  const removePreferredStyle = (style) => {
    setHairPreferences({
      ...hairPreferences,
      preferredStyles: hairPreferences.preferredStyles.filter(s => s !== style)
    })
  }

  const hairTypeOptions = [
    "Straight", "Wavy", "Curly", "Coily", 
    "Fine", "Medium", "Thick", 
    "Dry", "Oily", "Combination",
    "Color-treated", "Damaged", "Virgin Hair"
  ]

  if (!userData) return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="animate-pulse">
        <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto"></div>
        <div className="h-4 w-32 bg-gray-200 rounded mt-4 mx-auto"></div>
      </div>
    </div>
  )

  return (
    <motion.div 
      className="max-w-4xl mx-auto py-8 px-4 sm:px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-gray-800 mb-6 hidden sm:block">My Profile</h1>

      {/* PROFILE HEADER */}
      <motion.div 
        className="bg-white rounded-xl shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-gradient-to-r from-primary to-indigo-600 h-24 sm:h-32"></div>
        <div className="p-4 sm:p-6 -mt-12 sm:-mt-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-8">
            <div className="relative">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white overflow-hidden bg-gray-100 shadow-md">
                <img
                  src={image ? URL.createObjectURL(image) : userData.image || assets.profile_pic}
                  alt="profile"
                  className="w-full h-full object-cover"
                />
              </div>

              {isEdit && (
                <label htmlFor="profile-img" className="absolute bottom-2 right-2 bg-primary p-2 rounded-full cursor-pointer text-white shadow-md hover:bg-primary/90 transition-colors">
                  <Camera size={16} />
                  <input
                    id="profile-img"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => setImage(e.target.files[0])}
                  />
                </label>
              )}
            </div>

            <div className="text-center sm:text-left flex-1">
              {isEdit ? (
                <input
                  className="text-2xl font-bold border px-3 py-1 rounded w-full max-w-xs sm:max-w-md"
                  value={userData.name}
                  onChange={(e) =>
                    setUserData(prev => ({ ...prev, name: e.target.value }))
                  }
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-800">
                  {userData.name}
                </h2>
              )}

              <p className="text-gray-500 mt-1">{userData.email}</p>
            </div>

            <div className="mt-4 sm:mt-0">
              {!isEdit ? (
                <button
                  onClick={() => setIsEdit(true)}
                  className="inline-flex items-center gap-2 bg-white border border-primary text-primary px-5 py-2 rounded-full hover:bg-primary hover:text-white transition-colors shadow-sm"
                >
                  <Pencil size={16} />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsEdit(false);
                    setImage(false);
                  }}
                  className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors shadow-sm"
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* PROFILE DETAILS */}
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* PERSONAL INFORMATION */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-5 border-b">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <User size={18} />
              Personal Information
            </h3>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1.5">Gender</p>
              {isEdit ? (
                <select
                  className="border px-3 py-2.5 rounded-lg w-full focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  value={userData.gender || ""}
                  onChange={(e) =>
                    setUserData(prev => ({ ...prev, gender: e.target.value }))
                  }
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              ) : (
                <p className="text-gray-800">{userData.gender || "Not specified"}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-1.5">Date of Birth</p>
              {isEdit ? (
                <input
                  type="date"
                  className="border px-3 py-2.5 rounded-lg w-full focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  value={userData.dob || ""}
                  onChange={(e) =>
                    setUserData(prev => ({ ...prev, dob: e.target.value }))
                  }
                />
              ) : (
                <p className="text-gray-800">
                  {userData.dob ? new Date(userData.dob).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : "Not specified"}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* CONTACT INFORMATION */}
        <motion.div 
          className="bg-white rounded-xl shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-5 border-b">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <Phone size={18} />
              Contact Information
            </h3>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1.5">Phone Number</p>
              {isEdit ? (
                <input
                  className="border px-3 py-2.5 rounded-lg w-full focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  value={userData.phone || ""}
                  placeholder="e.g. (555) 123-4567"
                  onChange={(e) =>
                    setUserData(prev => ({ ...prev, phone: e.target.value }))
                  }
                />
              ) : (
                <p className="text-gray-800">{userData.phone || "Not specified"}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500 mb-1.5">Address</p>
              {isEdit ? (
                <div className="space-y-2">
                  <input
                    className="border px-3 py-2.5 rounded-lg w-full focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    placeholder="Street address"
                    value={userData.address?.line1 || ""}
                    onChange={(e) =>
                      setUserData(prev => ({
                        ...prev,
                        address: { 
                          ...prev.address || {}, 
                          line1: e.target.value 
                        }
                      }))
                    }
                  />
                  <input
                    className="border px-3 py-2.5 rounded-lg w-full focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    placeholder="City, State, Zip code"
                    value={userData.address?.line2 || ""}
                    onChange={(e) =>
                      setUserData(prev => ({
                        ...prev,
                        address: { 
                          ...prev.address || {}, 
                          line2: e.target.value 
                        }
                      }))
                    }
                  />
                </div>
              ) : (
                <p className="text-gray-800">
                  {userData.address?.line1 ? (
                    <>
                      {userData.address.line1}<br />
                      {userData.address.line2}
                    </>
                  ) : "Not specified"}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* HAIR PREFERENCES SECTION */}
      {/* <motion.div 
        className="bg-white rounded-xl shadow-sm overflow-hidden mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="p-5 border-b">
          <h3 className="font-bold text-gray-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19a1 1 0 0 1-1-1v-1a3 3 0 0 1 3-3h.5a1 1 0 0 0 1-1 1 1 0 0 1 1-1h.5a1 1 0 0 0 1-1 1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1Z" />
              <path d="M4 14a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H6a1 1 0 0 0-1 1v1Z" />
              <path d="M12 16v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1h-.5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H16a1 1 0 0 1 1 1v1" />
              <path d="M22 12v4" />
              <path d="M20 13a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
            </svg>
            Hair Styling Preferences
          </h3>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1.5">Hair Type</p>
            {isEdit ? (
              <select
                className="border px-3 py-2.5 rounded-lg w-full focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                value={hairPreferences.hairType || ""}
                onChange={(e) =>
                  setHairPreferences(prev => ({ ...prev, hairType: e.target.value }))
                }
              >
                <option value="">Select Hair Type</option>
                {hairTypeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <p className="text-gray-800">{hairPreferences.hairType || "Not specified"}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 mb-1.5">Preferred Styles</p>
            {isEdit ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 mt-2">
                  {hairPreferences.preferredStyles?.map(style => (
                    <span key={style} className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                      {style}
                      <button 
                        onClick={() => removePreferredStyle(style)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="border flex-1 px-3 py-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                    placeholder="Add a preferred hairstyle"
                    value={newPreferredStyle}
                    onChange={(e) => setNewPreferredStyle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPreferredStyle()}
                  />
                  <button
                    onClick={addPreferredStyle}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Examples: Bob Cut, Pixie, Highlights, Balayage, Updo, etc.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hairPreferences.preferredStyles?.length > 0 ? (
                  hairPreferences.preferredStyles.map(style => (
                    <span key={style} className="inline-block bg-gray-100 px-3 py-1 rounded-full text-sm">
                      {style}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-600">No preferred styles specified</p>
                )}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 mb-1.5">Allergies or Sensitivities</p>
            {isEdit ? (
              <textarea
                className="border px-3 py-2.5 rounded-lg w-full h-20 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="List any allergies or sensitivities to hair products"
                value={hairPreferences.allergies || ""}
                onChange={(e) =>
                  setHairPreferences(prev => ({ ...prev, allergies: e.target.value }))
                }
              ></textarea>
            ) : (
              <p className="text-gray-800">{hairPreferences.allergies || "None specified"}</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500 mb-1.5">Notes for Stylists</p>
            {isEdit ? (
              <textarea
                className="border px-3 py-2.5 rounded-lg w-full h-24 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                placeholder="Any additional information you'd like your stylist to know"
                value={hairPreferences.stylistNotes || ""}
                onChange={(e) =>
                  setHairPreferences(prev => ({ ...prev, stylistNotes: e.target.value }))
                }
              ></textarea>
            ) : (
              <p className="text-gray-800 whitespace-pre-line">
                {hairPreferences.stylistNotes || "No additional notes"}
              </p>
            )}
          </div>
        </div>
      </motion.div> */}

      {/* SAVE BUTTON */}
      {isEdit && (
        <div className="sticky bottom-0 bg-white border-t py-4 px-4 mt-6 -mx-4 sm:static sm:bg-transparent sm:border-0 sm:mt-6 sm:mx-0">
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsEdit(false);
                setImage(false);
              }}
              className="px-6 py-2.5 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={updateUserProfileData}
              disabled={loading}
              className={`bg-primary px-8 py-2.5 text-white rounded-full hover:bg-primary/90 transition-colors flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default MyProfile
