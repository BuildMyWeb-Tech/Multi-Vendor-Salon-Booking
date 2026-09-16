// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\admin\src\pages\Admin\EditStylist.jsx
import React, { useContext, useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { Pencil, User, Mail, Phone, Award, Hash, Instagram, Clock, FileText, ArrowLeft, Scissors, Loader2, Upload, Lock, Eye, EyeOff } from 'lucide-react';

const EditStylist = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getDoctorById, updateDoctor } = useContext(AdminContext);
    const { backendUrl } = useContext(AppContext);
    const { aToken } = useContext(AdminContext);

    // Form state
    const [stylistImg, setStylistImg] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // ✅ NEW: eye toggle state
    const [phone, setPhone] = useState('');
    const [experience, setExperience] = useState('1 Year');
    const [price, setPrice] = useState('');
    const [about, setAbout] = useState('');
    const [specialty, setSpecialty] = useState([]);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [certification, setCertification] = useState('');
    const [instagram, setInstagram] = useState('');
    const [workingHours, setWorkingHours] = useState('');
    const [available, setAvailable] = useState(true);
    
    // UI state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [serviceCategories, setServiceCategories] = useState([]);
    const [categoriesLoaded, setCategoriesLoaded] = useState(false);

    // Fetch service categories
    const fetchServiceCategories = async () => {
        try {
            const { data } = await axios.get(`${backendUrl}/api/admin/services`, {
                headers: { aToken }
            });
            if (data.success && data.services.length > 0) {
                setServiceCategories(data.services);
            }
        } catch (error) {
            console.error("Failed to fetch service categories:", error);
        } finally {
            setCategoriesLoaded(true);
        }
    };

    // Load stylist data and service categories in parallel
    useEffect(() => {
        const fetchData = async () => {
            if (!id || !aToken) {
                setInitialLoading(false);
                return;
            }

            try {
                const [stylist] = await Promise.all([
                    getDoctorById(id),
                    fetchServiceCategories()
                ]);
                
                if (stylist) {
                    setName(stylist.name || '');
                    setEmail(stylist.email || '');
                    setPhone(stylist.phone || '');
                    setExperience(stylist.experience || '1 Year');
                    setPrice(stylist.price?.toString() || stylist.fees?.toString() || '');
                    setAbout(stylist.about || '');
                    // ✅ Pre-fill password from DB so admin can see and edit it
                    setPassword(stylist.password || '');
                    
                    if (Array.isArray(stylist.specialty)) {
                        setSpecialty(stylist.specialty);
                    } else if (stylist.specialty) {
                        setSpecialty([stylist.specialty]);
                    }
                    
                    setCertification(stylist.certification || '');
                    setInstagram(stylist.instagram || '');
                    setWorkingHours(stylist.workingHours || '');
                    setImagePreview(stylist.image || '');
                    setAvailable(stylist.available !== undefined ? stylist.available : true);
                } else {
                    toast.error('Could not find stylist data');
                    navigate('/stylist-list');
                }
            } catch (error) {
                console.error('Error loading data:', error);
                toast.error('Failed to load stylist data');
                navigate('/stylist-list');
            } finally {
                setInitialLoading(false);
            }
        };

        fetchData();
    }, [id, aToken]);

    // Handle dropdown clicks outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    // Form submission
    const onSubmitHandler = async (event) => {
        event.preventDefault();

        try {
            if (specialty.length === 0) {
                return toast.error('Please select at least one specialty');
            }

            setIsSubmitting(true);
            
            const formData = new FormData();

            if (stylistImg) {
                formData.append('image', stylistImg);
            }
            
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('experience', experience);
            formData.append('price', price);
            formData.append('about', about);
            formData.append('available', available);
            formData.append('specialty', JSON.stringify(specialty));
            formData.append('certification', certification);
            formData.append('instagram', instagram);
            formData.append('workingHours', workingHours);

            // ✅ Always send password (it's pre-filled and editable)
            if (password) {
                formData.append('password', password);
            }

            const updatedStylist = await updateDoctor(id, formData);
            
            if (updatedStylist) {
                navigate('/stylist-list');
            }
        } catch (error) {
            toast.error(error.message || 'Failed to update stylist');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle image change
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setStylistImg(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Get specialty options from service categories
    const specialtyOptions = serviceCategories.length > 0 
        ? serviceCategories.map(service => service.name) 
        : [
            'Hair Styling Specialist',
            'Beard & Grooming Specialist',
            'Hair Coloring Specialist',
            'Hair Treatment Specialist',
            'Bridal Hairstylist',
            'Unisex Hairstylist'
        ];

    // Show skeleton loader during initial load
    if (initialLoading) {
        return (
            <div className='m-5 w-full'>
                <div className='flex justify-between items-center mb-5'>
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>

                <div className='bg-white px-6 py-8 sm:p-8 border rounded-lg shadow-sm w-full max-w-5xl'>
                    <div className='flex flex-col items-center justify-center mb-8 p-4'>
                        <div className='w-32 h-32 rounded-full bg-gray-200 animate-pulse mb-3'></div>
                        <div className='h-4 w-40 bg-gray-200 rounded animate-pulse mb-2'></div>
                        <div className='h-3 w-32 bg-gray-200 rounded animate-pulse'></div>
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className='space-y-2'>
                                <div className='h-4 w-24 bg-gray-200 rounded animate-pulse'></div>
                                <div className='h-11 w-full bg-gray-200 rounded animate-pulse'></div>
                            </div>
                        ))}
                    </div>

                    <div className='mt-6 space-y-2'>
                        <div className='h-4 w-32 bg-gray-200 rounded animate-pulse'></div>
                        <div className='h-11 w-full bg-gray-200 rounded animate-pulse'></div>
                    </div>

                    <div className='mt-6 space-y-2'>
                        <div className='h-4 w-36 bg-gray-200 rounded animate-pulse'></div>
                        <div className='h-24 w-full bg-gray-200 rounded animate-pulse'></div>
                    </div>

                    <div className='mt-6 pt-4 border-t flex justify-end gap-3'>
                        <div className='h-11 w-24 bg-gray-200 rounded-lg animate-pulse'></div>
                        <div className='h-11 w-32 bg-gray-200 rounded-lg animate-pulse'></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>
            <div className='flex justify-between items-center mb-5'>
                <div className="flex items-center gap-3">
                    <button 
                        type="button" 
                        onClick={() => navigate('/stylist-list')}
                        className="text-gray-600 hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
                        <Scissors className="text-primary" size={24} />
                        Edit Stylist
                    </h1>
                </div>
            </div>

            <div className='bg-white px-6 py-8 sm:p-8 border rounded-lg shadow-sm w-full max-w-5xl max-h-[85vh] overflow-y-auto'>
                
                {/* Profile Image Upload Section */}
                <div className='flex flex-col items-center justify-center mb-8 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50'>
                    <div className='relative mb-3'>
                        <div className='w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center'>
                            {imagePreview ? (
                                <img 
                                    className='w-full h-full object-cover' 
                                    src={imagePreview} 
                                    alt="Stylist profile" 
                                />
                            ) : (
                                <User size={48} className="text-gray-300" />
                            )}
                        </div>
                        <label 
                            htmlFor="stylist-img" 
                            className='absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-primary/90 transition-colors'
                        >
                            <Upload size={16} />
                        </label>
                        <input 
                            onChange={handleImageChange} 
                            type="file" 
                            id="stylist-img" 
                            hidden 
                            accept="image/*"
                        />
                    </div>
                    <p className='text-gray-500 text-sm mb-2'>Update stylist profile picture</p>
                    <p className='text-xs text-gray-400'>Leave empty to keep current image</p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-600'>
                    {/* Left Column */}
                    <div className='space-y-5'>
                        
                        {/* Full Name */}
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <User size={16} className="mr-1.5" /> Full Name
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input 
                                onChange={e => setName(e.target.value)} 
                                value={name} 
                                className='border rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary' 
                                type="text" 
                                placeholder='Enter stylist name' 
                                required 
                            />
                        </div>

                        {/* Email */}
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <Mail size={16} className="mr-1.5" /> Email Address
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input 
                                onChange={e => setEmail(e.target.value)} 
                                value={email} 
                                className='border rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary' 
                                type="email" 
                                placeholder='Enter email address' 
                                required 
                            />
                        </div>

                        {/* ✅ FIXED: Password — pre-filled, visible, editable with eye toggle */}
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <Lock size={16} className="mr-1.5" /> Password
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className='relative'>
                                <input
                                    onChange={e => setPassword(e.target.value)}
                                    value={password}
                                    className='border rounded-md px-3 py-2.5 pr-10 w-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
                                    type={showPassword ? "text" : "password"}
                                    placeholder='Enter password'
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">Edit to change the stylist's password</p>
                        </div>

                        {/* Experience */}
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <Award size={16} className="mr-1.5" /> Experience
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select 
                                onChange={e => setExperience(e.target.value)} 
                                value={experience} 
                                className='border rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary appearance-none bg-white' 
                                required
                            >
                                <option value="1 Year">1 Year</option>
                                <option value="2 Years">2 Years</option>
                                <option value="3 Years">3 Years</option>
                                <option value="4 Years">4 Years</option>
                                <option value="5 Years">5 Years</option>
                                <option value="6-10 Years">6-10 Years</option>
                                <option value="10+ Years">10+ Years</option>
                            </select>
                        </div>

                        {/* Base Price */}
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <Hash size={16} className="mr-1.5" /> Base Price
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                <input 
                                    onChange={e => setPrice(e.target.value)} 
                                    value={price} 
                                    className='border rounded-md pl-7 pr-3 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary' 
                                    type="number" 
                                    placeholder='Starting price for services' 
                                    required 
                                />
                            </div>
                        </div>
                        
                        {/* Availability Toggle */}
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <Clock size={16} className="mr-1.5" /> Availability Status
                            </label>
                            <div className="flex items-center gap-3">
                                <label className="relative inline-flex cursor-pointer items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={available}
                                        onChange={() => setAvailable(!available)}
                                        className="peer sr-only" 
                                    />
                                    <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:ring-4 peer-focus:ring-primary/20"></div>
                                </label>
                                <span className="text-sm text-gray-700">
                                    {available ? 'Available for bookings' : 'Not available'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Toggle to control whether clients can book appointments with this stylist
                            </p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className='space-y-5'>

                        {/* Working Hours */}
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <Clock size={16} className="mr-1.5" /> Working Hours
                            </label>
                            <input 
                                onChange={e => setWorkingHours(e.target.value)} 
                                value={workingHours} 
                                className='border rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary' 
                                type="text" 
                                placeholder='e.g. Mon-Fri: 10AM-7PM' 
                            />
                            <p className="text-xs text-gray-500">
                                Working hours will be displayed to clients when booking
                            </p>
                        </div>

                        {/* Certification */}
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <FileText size={16} className="mr-1.5" /> Certification
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input 
                                onChange={e => setCertification(e.target.value)} 
                                value={certification} 
                                className='border rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary' 
                                type="text" 
                                placeholder='Professional certifications' 
                                required 
                            />
                        </div>

                        {/* ✅ Phone — 10 digits only */}
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <Phone size={16} className="mr-1.5" /> Phone Number
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <input 
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val.length <= 10) setPhone(val);
                                }} 
                                value={phone} 
                                className='border rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary'
                                type="tel" 
                                placeholder='Enter 10-digit phone number'
                                pattern="[0-9]{10}"
                                minLength={10}
                                maxLength={10}
                                required 
                            />
                            <p className="text-xs text-gray-500">10-digit number • digits only</p>
                            {phone.length > 0 && phone.length < 10 && (
                                <p className="text-xs text-red-500">Phone number must be exactly 10 digits</p>
                            )}
                        </div>

                        {/* Instagram */}
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <Instagram size={16} className="mr-1.5" /> Instagram Handle
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">@</span>
                                <input 
                                    onChange={e => setInstagram(e.target.value)} 
                                    value={instagram} 
                                    className='border rounded-md pl-7 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary' 
                                    type="text" 
                                    placeholder='username (optional)' 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dropdown Multi-Select for Specialties */}
                <div ref={dropdownRef} className="mt-6 w-full relative">
                    <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                        <Scissors size={16} className="mr-1.5" />
                        Service Specialties
                        <span className="text-red-500 ml-1">*</span>
                    </label>

                    <div
                        onClick={() => setOpen(prev => !prev)}
                        className="w-full min-h-[46px] border rounded-md px-3 py-2 flex flex-wrap items-center gap-2 cursor-pointer focus-within:ring-2 focus-within:ring-primary/50 bg-white"
                    >
                        {!categoriesLoaded && (
                            <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
                        )}
                        
                        {specialty.length === 0 && categoriesLoaded && (
                            <span className="text-gray-400 text-sm">Select service specialties</span>
                        )}

                        {specialty.map(item => (
                            <span
                                key={item}
                                className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1"
                            >
                                {item}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSpecialty(specialty.filter(s => s !== item));
                                    }}
                                    className="hover:text-red-500"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>

                    {open && (
                        <div className="absolute z-30 mt-2 w-full bg-white border rounded-md shadow-lg max-h-56 overflow-y-auto">
                            {!categoriesLoaded ? (
                                <div className="flex justify-center items-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : specialtyOptions.length > 0 ? (
                                specialtyOptions.map(option => {
                                    const selected = specialty.includes(option);
                                    return (
                                        <div
                                            key={option}
                                            onClick={() =>
                                                setSpecialty(
                                                    selected
                                                    ? specialty.filter(s => s !== option)
                                                    : [...specialty, option]
                                                )
                                            }
                                            className={`px-4 py-2 cursor-pointer text-sm ${selected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-gray-100'}`}
                                        >
                                            {option}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500">
                                    No service categories found. Please add some first.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* About Section */}
                <div className="mt-6">
                    <label className='text-sm font-medium text-gray-700 flex items-center mb-1.5'>
                        <FileText size={16} className="mr-1.5" /> About The Stylist
                        <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea 
                        onChange={e => setAbout(e.target.value)} 
                        value={about} 
                        className='w-full px-4 pt-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary' 
                        rows={4} 
                        placeholder="Describe the stylist's expertise, style philosophy, and approach to client service"
                        required
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-1">
                        Include relevant experience, specializations, and unique styling approach to help clients connect with the stylist
                    </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-4">
                        <span className="text-red-500 mr-1">*</span> Required fields
                    </p>
                    <div className='flex justify-end gap-3'>
                        <button
                            type="button"
                            onClick={() => navigate('/stylist-list')}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button 
                            type='submit' 
                            disabled={isSubmitting}
                            className='bg-primary px-8 py-2.5 text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed'
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Updating Stylist...</span>
                                </>
                            ) : (
                                <>
                                    <Pencil size={16} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default EditStylist;