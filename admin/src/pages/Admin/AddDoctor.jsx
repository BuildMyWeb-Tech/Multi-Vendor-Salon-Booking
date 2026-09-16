import React, { useContext, useState, useRef, useEffect } from 'react';
import { assets } from '../../assets/assets';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AdminContext } from '../../context/AdminContext';
import { AppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
// ✅ FIX 1: Added X and RotateCcw to existing imports (only change on this line)
import { Pencil, Eye, EyeOff, User, Mail, Lock, Phone, Award, Briefcase, Scissors, Hash, Instagram, Clock, FileText, CheckCircle, X, RotateCcw } from 'lucide-react';

const AddStylist = () => {
    const navigate = useNavigate();
    const [stylistImg, setStylistImg] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [experience, setExperience] = useState('1 Year');
    const [price, setPrice] = useState('');
    const [about, setAbout] = useState('');
    const [specialty, setSpecialty] = useState([]);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [certification, setCertification] = useState('');
    const [instagram, setInstagram] = useState('');
    const [workingHours, setWorkingHours] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // New state for service categories
    const [serviceCategories, setServiceCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    const { backendUrl } = useContext(AppContext);
    const { aToken } = useContext(AdminContext);

    useEffect(() => {
        fetchServiceCategories();
        
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

    // Fetch service categories from the backend
    const fetchServiceCategories = async () => {
        setLoadingCategories(true);
        try {
            const { data } = await axios.get(`${backendUrl}/api/admin/services`, {
                headers: { aToken }
            });
            
            if (data.success && data.services.length > 0) {
                setServiceCategories(data.services);
            }
        } catch (error) {
            console.error("Failed to fetch service categories:", error);
            toast.error("Failed to load service categories");
        } finally {
            setLoadingCategories(false);
        }
    };

    const onSubmitHandler = async (event) => {
        event.preventDefault();

        try {
            if (!stylistImg) {
                return toast.error('Profile Image Required');
            }

            if (specialty.length === 0) {
                return toast.error('Please select at least one specialty');
            }

            setIsSubmitting(true);
            
            const formData = new FormData();

            formData.append('image', stylistImg);
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('password', password);
            formData.append('experience', experience);
            formData.append('price', Number(price));
            formData.append('about', about);
            
            // Convert specialty array to string for backend processing
            formData.append('specialty', JSON.stringify(specialty));
            
            formData.append('certification', certification);
            formData.append('instagram', instagram);
            formData.append('workingHours', workingHours);

            const { data } = await axios.post(
                `${backendUrl}/api/admin/add-doctor`, 
                formData, 
                { headers: { aToken } }
            );
            
            if (data.success) {
                setSuccess(true);
                toast.success(data.message);
                
                // Redirect after a short delay to show success state
                setTimeout(() => {
                    navigate('/stylist-list');
                }, 1500);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Something went wrong');
            console.log(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setStylistImg(false);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setCertification('');
        setAbout('');
        setPrice('');
        setInstagram('');
        setWorkingHours('');
        setSpecialty([]);
    };

    // Fallback to static options if API fails
    const fallbackSpecialtyOptions = [
        'Hair Styling Specialist',
        'Beard & Grooming Specialist',
        'Hair Coloring Specialist',
        'Hair Treatment Specialist',
        'Bridal Hairstylist',
        'Unisex Hairstylist'
    ];

    const specialtyOptions = serviceCategories.length > 0 
        ? serviceCategories.map(service => service.name) 
        : fallbackSpecialtyOptions;

    const togglePasswordVisibility = () => {
        setShowPassword(prevState => !prevState);
    };

    // If success, show success state before redirecting
    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Stylist Added Successfully!</h2>
                    <p className="text-gray-600 mb-8">
                        The new stylist has been added to your team. Redirecting to the stylists list...
                    </p>
                    <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmitHandler} className='m-5 w-full'>

            {/* ✅ FIX 2: Reset Form now has icon+border (visible on mobile too), X close button added */}
            <div className='flex justify-between items-center mb-5 gap-2'>
                <h1 className='text-2xl font-bold text-gray-800'>Add New Stylist</h1>
                <div className='flex items-center gap-2'>
                    <button 
                        type="button"
                        onClick={resetForm}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-primary transition-colors"
                    >
                        <RotateCcw size={14} />
                        <span>Reset Form</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/stylist-list')}
                        className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                        title="Close"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className='bg-white px-6 py-8 sm:p-8 border rounded-lg shadow-sm w-full max-w-5xl max-h-[85vh] overflow-y-auto'>
                {/* Profile Image Upload Section */}
                <div className='flex flex-col items-center justify-center mb-8 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50'>
                    <div className='relative mb-3'>
                        <div className='w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 flex items-center justify-center'>
                            {stylistImg ? (
                                <img 
                                    className='w-full h-full object-cover' 
                                    src={URL.createObjectURL(stylistImg)} 
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
                            <Pencil size={16} />
                        </label>
                        <input 
                            onChange={(e) => setStylistImg(e.target.files[0])} 
                            type="file" 
                            name="" 
                            id="stylist-img" 
                            hidden 
                            accept="image/*"
                        />
                    </div>
                    <p className='text-gray-500 text-sm mb-2'>Upload stylist profile picture</p>
                    <p className='text-xs text-gray-400'>Recommended: Square image, at least 300x300px</p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-600'>
                    {/* Left Column */}
                    <div className='space-y-5'>
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

                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <Mail size={16} className="mr-1.5" /> Email Address
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            {/* ✅ FIX 3: placeholder was 'admin@example.com' → now 'Enter stylist email' */}
                            <input 
                                onChange={e => setEmail(e.target.value)} 
                                value={email} 
                                className='border rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary' 
                                type="email" 
                                placeholder='Enter stylist email' 
                                required 
                            />
                        </div>

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
                                    placeholder='Create password' 
                                    required 
                                />
                                <button 
                                    type="button" 
                                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700'
                                    onClick={togglePasswordVisibility}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500">Minimum 8 characters recommended</p>
                        </div>

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

                        {/* <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <Hash size={16} className="mr-1.5" /> Base Price
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                                <input 
                                    onChange={e => setPrice(e.target.value)} 
                                    value={price} 
                                    className='border rounded-md pl-7 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary' 
                                    type="number" 
                                    placeholder='Starting price for services' 
                                    required 
                                />
                            </div>
                        </div> */}
                    </div>

                    {/* Right Column */}
                    <div className='space-y-5'>
                        <div className='flex flex-col gap-1.5'>
                            <label className='text-sm font-medium text-gray-700 flex items-center'>
                                <Clock size={16} className="mr-1.5" /> Working Hours
                            </label>
                            <input 
                                onChange={e => setWorkingHours(e.target.value)} 
                                value={workingHours} 
                                className='border rounded-md px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary' 
                                type="text" 
                                placeholder='e.g.  10AM-7PM' 
                            />
                        </div>

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

                {/* Dropdown Multi-Select */}
                <div ref={dropdownRef} className="mt-6 w-full relative">
                    <label className="text-sm font-medium text-gray-700 flex items-center mb-1">
                        <Scissors size={16} className="mr-1.5" />
                        Service Specialties
                        <span className="text-red-500 ml-1">*</span>
                    </label>

                    {/* Input */}
                    <div
                        onClick={() => setOpen(prev => !prev)}
                        className="w-full min-h-[46px] border rounded-md px-3 py-2
                                flex flex-wrap items-center gap-2 cursor-pointer
                                focus-within:ring-2 focus-within:ring-primary/50
                                bg-white"
                    >
                        {loadingCategories && (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                        )}
                        
                        {specialty.length === 0 && !loadingCategories && (
                            <span className="text-gray-400 text-sm">
                                Select service specialties
                            </span>
                        )}

                        {specialty.map(item => (
                            <span
                                key={item}
                                className="bg-primary/10 text-primary text-xs font-medium
                                        px-2 py-1 rounded-full flex items-center gap-1"
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

                    {/* Dropdown */}
                    {open && (
                        <div className="absolute z-30 mt-2 w-full bg-white border rounded-md shadow-lg max-h-56 overflow-y-auto">
                            {loadingCategories ? (
                                <div className="flex justify-center items-center py-4">
                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
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
                                            className={`px-4 py-2 cursor-pointer text-sm
                                            ${selected
                                                ? 'bg-primary/10 text-primary font-medium'
                                                : 'hover:bg-gray-100'}
                                            `}
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

                {/* About Section - Full Width */}
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

                <div className="mt-2 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-4">
                        <span className="text-red-500 mr-1">*</span> Required fields
                    </p>
                    <div className='flex justify-end'>
                        <button 
                            type='submit' 
                            disabled={isSubmitting}
                            className='bg-primary px-8 py-3 text-white rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed'
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Adding Stylist...</span>
                                </>
                            ) : (
                                <>Add Stylist</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default AddStylist;