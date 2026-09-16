import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import { 
  User, 
  Mail, 
  Phone, 
  Award, 
  Clock, 
  IndianRupee, 
  CheckCircle, 
  Edit, 
  Save, 
  X,
  Instagram,
  Scissors,
  Upload,
  Loader2
} from 'lucide-react'

const StylistProfile = () => {
    const { dToken, profileData, setProfileData, getProfileData, backendUrl } = useContext(DoctorContext)
    const { currency } = useContext(AppContext)
    
    const [isEdit, setIsEdit] = useState(false)
    const [services, setServices] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [loadingServices, setLoadingServices] = useState(false)
    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')

    // Fetch all services for specialty dropdown
    const fetchServices = async () => {
        setLoadingServices(true)
        try {
            const { data } = await axios.get(`${backendUrl}/api/user/services`)
            if (data.success) {
                setServices(data.services)
            }
        } catch (error) {
            console.error('Error fetching services:', error)
            toast.error('Failed to load services')
        } finally {
            setLoadingServices(false)
        }
    }

    // Handle image change
    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setImageFile(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    // Update profile function with image upload
    const updateProfile = async () => {
        setIsLoading(true)
        try {
            const formData = new FormData()
            
            // Add image if changed
            if (imageFile) {
                formData.append('image', imageFile)
            }
            
            // Add all profile data
            formData.append('price', profileData.price || profileData.fees || 0)
            formData.append('available', profileData.available)
            formData.append('about', profileData.about || '')
            formData.append('workingHours', profileData.workingHours || '')
            
            // Convert specialty array to JSON string
            formData.append('specialty', JSON.stringify(profileData.specialty || []))

            const { data } = await axios.post(
                `${backendUrl}/api/doctor/update-profile`, 
                formData,
                { 
                    headers: { 
                        dToken,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            )

            if (data.success) {
                toast.success(data.message || 'Profile updated successfully')
                setIsEdit(false)
                setImageFile(null)
                setImagePreview('')
                // Refresh profile data to show the latest changes
                await getProfileData()
            } else {
                toast.error(data.message || 'Failed to update profile')
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || 'Error updating profile')
            console.error('Update profile error:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Toggle specialty selection
    const toggleSpecialty = (serviceName) => {
        if (!isEdit) return

        setProfileData(prev => {
            // Ensure specialty is always an array
            const currentSpecialty = Array.isArray(prev.specialty) ? prev.specialty : []
            
            if (currentSpecialty.includes(serviceName)) {
                return {
                    ...prev,
                    specialty: currentSpecialty.filter(s => s !== serviceName)
                }
            } else {
                return {
                    ...prev,
                    specialty: [...currentSpecialty, serviceName]
                }
            }
        })
    }

    // Cancel edit and reset changes
    const cancelEdit = () => {
        setIsEdit(false)
        setImageFile(null)
        setImagePreview('')
        getProfileData() // Reset to original data
    }

    // Load stylist data and services on component mount
    useEffect(() => {
        if (dToken) {
            getProfileData()
            fetchServices()
        }
    }, [dToken])

    // Update image preview when profile data changes
    useEffect(() => {
        if (profileData?.image && !imagePreview) {
            setImagePreview(profileData.image)
        }
    }, [profileData])

    if (!profileData) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="rounded-full bg-gray-200 h-24 w-24 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-48 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-40"></div>
                </div>
            </div>
        )
    }

    return (
        <div className='max-w-6xl mx-auto'>
            <div className='flex flex-col md:flex-row gap-6 m-5'>
                
                {/* Profile Image and Quick Info Card */}
                <div className="flex flex-col gap-4 md:w-1/3">
                    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center">
                        <div className="relative mb-4">
                            <img 
                                className='w-40 h-40 rounded-full object-cover border-4 border-white shadow-md' 
                                src={imagePreview || profileData.image || 'https://via.placeholder.com/200?text=Stylist'} 
                                alt={profileData.name} 
                            />
                            {isEdit && (
                                <label 
                                    htmlFor="profile-image" 
                                    className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-primary/90 transition-all"
                                >
                                    <Upload className="h-4 w-4" />
                                    <input 
                                        type="file" 
                                        id="profile-image"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                            {!isEdit && profileData.available && (
                                <div className="absolute bottom-2 right-2 bg-green-500 p-1 rounded-full border-2 border-white">
                                    <CheckCircle className="h-4 w-4 text-white" />
                                </div>
                            )}
                        </div>

                        <h2 className='text-xl font-semibold text-gray-800 text-center'>
                            {profileData.name}
                        </h2>
                        
                        <div className='flex items-center gap-1 mt-1 text-gray-600 text-sm'>
                            <Mail className="h-3.5 w-3.5" />
                            <p className="truncate max-w-full">{profileData.email}</p>
                        </div>

                        {profileData.phone && (
                            <div className='flex items-center gap-1 mt-1 text-gray-600 text-sm'>
                                <Phone className="h-3.5 w-3.5" />
                                <p>{profileData.phone}</p>
                            </div>
                        )}

                        <div className='flex justify-center gap-1.5 mt-3 flex-wrap'>
                            <span className='py-1 px-3 bg-primary/10 text-primary rounded-full text-xs font-medium'>
                                {profileData.certification || 'Certified Stylist'}
                            </span>
                            <span className='py-1 px-3 bg-purple-100 text-purple-700 rounded-full text-xs font-medium'>
                                {profileData.experience || 'Experienced'}
                            </span>
                        </div>

                        {/* Availability Toggle */}
                        <div className='flex items-center gap-2 mt-5 w-full'>
                            <div 
                                onClick={() => isEdit && setProfileData(prev => ({ ...prev, available: !prev.available }))}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${profileData.available ? 'bg-green-500' : 'bg-gray-200'} ${isEdit ? 'cursor-pointer' : 'opacity-80 cursor-not-allowed'}`}
                            >
                                <span 
                                    aria-hidden="true" 
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profileData.available ? 'translate-x-5' : 'translate-x-0'}`} 
                                />
                            </div>
                            <label className={`text-sm ${isEdit ? 'cursor-pointer' : ''}`}>
                                {profileData.available ? 'Available for appointments' : 'Not available'}
                            </label>
                        </div>

                        {/* Instagram Handle */}
                        {profileData.instagram && (
                            <a 
                                href={`https://instagram.com/${profileData.instagram.replace('@', '')}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className='mt-5 flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors py-2 px-4 bg-pink-50 rounded-full text-sm'
                            >
                                <Instagram className="h-4 w-4" />
                                {profileData.instagram}
                            </a>
                        )}
                    </div>
                </div>

                {/* Main Profile Content */}
                <div className='flex-1 border border-stone-100 rounded-xl p-5 bg-white shadow-sm md:w-2/3'>
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-xl font-semibold text-gray-800">Professional Profile</h1>
                        
                        {/* Edit/Save Button */}
                        {isEdit ? (
                            <div className='flex gap-2'>
                                <button 
                                    onClick={updateProfile} 
                                    disabled={isLoading}
                                    className='px-4 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed'
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save
                                        </>
                                    )}
                                </button>
                                <button 
                                    onClick={cancelEdit} 
                                    disabled={isLoading}
                                    className='px-4 py-1.5 bg-white border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition-all flex items-center gap-1 disabled:opacity-50'
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setIsEdit(true)} 
                                className='px-4 py-1.5 border border-primary text-primary text-sm rounded-lg hover:bg-primary hover:text-white transition-all flex items-center gap-1'
                            >
                                <Edit className="h-4 w-4" />
                                Edit Profile
                            </button>
                        )}
                    </div>

                    {/* About Section */}
                    <div className='mb-6'>
                        <h3 className='flex items-center gap-2 text-gray-700 font-medium mb-3'>
                            <User className="h-4 w-4" />
                            About Me
                        </h3>
                        {isEdit ? (
                            <textarea 
                                onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))} 
                                className='w-full outline-primary p-3 border rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary' 
                                rows={6} 
                                value={profileData.about || ''}
                                placeholder="Tell your clients about yourself, your experience and expertise..."
                            />
                        ) : (
                            <p className='text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg'>
                                {profileData.about || 'No information provided.'}
                            </p>
                        )}
                    </div>

                    {/* Working Hours */}
                    <div className='mb-6'>
                        <h3 className='flex items-center gap-2 text-gray-700 font-medium mb-3'>
                            <Clock className="h-4 w-4" />
                            Working Hours
                        </h3>
                        {isEdit ? (
                            <input 
                                type="text"
                                onChange={(e) => setProfileData(prev => ({ ...prev, workingHours: e.target.value }))} 
                                className='w-full outline-primary p-3 border rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary' 
                                value={profileData.workingHours || ''}
                                placeholder="e.g., Mon-Fri: 10AM-7PM, Sat: 10AM-5PM"
                            />
                        ) : (
                            <div className='text-gray-600 text-sm bg-gray-50 p-4 rounded-lg'>
                                {profileData.workingHours || 'Not specified'}
                            </div>
                        )}
                    </div>

                    {/* Specialization / Services */}
                    <div className='mb-6'>
                        <h3 className='flex items-center gap-2 text-gray-700 font-medium mb-3'>
                            <Scissors className="h-4 w-4" />
                            Specialization
                        </h3>
                        {isEdit ? (
                            <div className='flex flex-wrap gap-2'>
                                {loadingServices ? (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Loading services...</span>
                                    </div>
                                ) : services.length > 0 ? (
                                    services.map((service) => {
                                        const isSelected = Array.isArray(profileData.specialty) && 
                                                         profileData.specialty.includes(service.name)
                                        return (
                                            <button
                                                type="button"
                                                key={service._id}
                                                onClick={() => toggleSpecialty(service.name)}
                                                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                                    isSelected 
                                                        ? 'bg-primary text-white border-primary shadow-sm' 
                                                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                                } border`}
                                            >
                                                {service.name}
                                            </button>
                                        )
                                    })
                                ) : (
                                    <p className="text-sm text-gray-500">No services available. Please contact admin.</p>
                                )}
                            </div>
                        ) : (
                            <div className='flex flex-wrap gap-2'>
                                {Array.isArray(profileData.specialty) && profileData.specialty.length > 0 ? (
                                    profileData.specialty.map((spec, idx) => (
                                        <span key={idx} className='px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm'>
                                            {spec}
                                        </span>
                                    ))
                                ) : (
                                    <span className='px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm'>
                                        No specialties specified
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Certification Information */}
                    <div className='mb-6'>
                        <h3 className='flex items-center gap-2 text-gray-700 font-medium mb-3'>
                            <Award className="h-4 w-4" />
                            Certification
                        </h3>
                        <div className='text-gray-600 text-sm bg-gray-50 p-4 rounded-lg'>
                            {profileData.certification || 'No certification information provided'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default StylistProfile