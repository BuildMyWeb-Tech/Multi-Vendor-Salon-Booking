// C:\Users\Siddharathan\Desktop\salon-booking-full-stack\admin\src\pages\Admin\ServicesCategory.jsx
import React, { useContext, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { AdminContext } from '../../context/AdminContext'
import { AppContext } from '../../context/AppContext'
import { 
  Pencil, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Scissors as ScissorsIcon, 
  AlertTriangle, 
  Check, 
  ImagePlus, 
  Search, 
  FileText, 
  IndianRupee, 
  Star,
  ChevronLeft,
  Loader,
  Coffee,
  CheckCircle2
} from 'lucide-react'

const ServiceCategory = () => {
    const [serviceCategories, setServiceCategories] = useState([])
    const [serviceImg, setServiceImg] = useState(false)
    const [serviceName, setServiceName] = useState('')
    const [serviceDescription, setServiceDescription] = useState('')
    const [basePrice, setBasePrice] = useState('')
    const [searchQuery, setSearchQuery] = useState('')

    const [isEditingService, setIsEditingService] = useState(false)
    const [editServiceId, setEditServiceId] = useState(null)
    const [showServiceForm, setShowServiceForm] = useState(false)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [serviceToDelete, setServiceToDelete] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const { backendUrl } = useContext(AppContext)
    const { aToken } = useContext(AdminContext)

    useEffect(() => {
        fetchServices()
    }, [])

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchServices = async () => {
        setLoading(true)
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/admin/services`,
                { headers: { aToken } }
            )
            if (data.success) {
                setServiceCategories(data.services)
            }
        } catch (error) {
            toast.error('Failed to fetch service categories')
        } finally {
            setLoading(false)
        }
    }

    const handleServiceSubmit = async (e) => {
        e.preventDefault();
        
        try {
            if (!serviceImg && !isEditingService) {
                return toast.error('Service Image Required');
            }

            setSubmitting(true);

            const formData = new FormData();
            if (serviceImg) {
                formData.append('image', serviceImg);
            }
            formData.append('name', serviceName);
            formData.append('description', serviceDescription);
            formData.append('basePrice', basePrice);

            let response;
            if (isEditingService) {
                response = await axios.put(
                    `${backendUrl}/api/admin/services/${editServiceId}`,
                    formData,
                    { headers: { aToken } }
                );
            } else {
                response = await axios.post(
                    `${backendUrl}/api/admin/services`,
                    formData,
                    { headers: { aToken } }
                );
            }

            const { data } = response;
            if (data.success) {
                setSuccessMessage(isEditingService ? 'Service updated successfully!' : 'New service created successfully!');
                resetServiceForm();
                await fetchServices();
                setShowServiceForm(false);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Something went wrong');
            console.log(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditService = (service) => {
        setServiceName(service.name);
        setServiceDescription(service.description || '');
        setBasePrice(service.basePrice || '');
        setEditServiceId(service._id);
        setIsEditingService(true);
        setShowServiceForm(true);
    };

    const confirmDeleteService = (service) => {
        setServiceToDelete(service);
        setShowDeleteModal(true);
    }

    const handleDeleteService = async () => {
        if (!serviceToDelete) return;

        setDeleteLoading(true);
        try {
            const { data } = await axios.delete(
                `${backendUrl}/api/admin/services/${serviceToDelete._id}`,
                { headers: { aToken } }
            )
            if (data.success) {
                toast.success('Service deleted successfully');
                setShowDeleteModal(false);
                setServiceToDelete(null);
                fetchServices();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Failed to delete service');
        } finally {
            setDeleteLoading(false);
        }
    }

    const resetServiceForm = () => {
        setServiceImg(false);
        setServiceName('');
        setServiceDescription('');
        setBasePrice('');
        setIsEditingService(false);
        setEditServiceId(null);
    };

    // Filter services by search query
    const filteredServices = serviceCategories.filter(
        service => service.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className='m-5 w-full max-w-7xl mx-auto'>
            {successMessage && (
                <div className="fixed top-5 right-5 z-50 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg animate-fadeIn">
                    <CheckCircle2 size={20} />
                    <span>{successMessage}</span>
                </div>
            )}
            
            {!showServiceForm && (
                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <div className="p-6 bg-gradient-to-r from-primary/10 to-transparent border-b">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <div>
                                <h2 className='text-2xl font-bold text-gray-800 flex items-center gap-2'>
                                    <ScissorsIcon size={24} className="text-primary" strokeWidth={2} />
                                    Service Categories
                                </h2>
                                <p className='text-gray-500 text-sm mt-1'>
                                    Manage styling services offered by your salon
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    resetServiceForm()
                                    setShowServiceForm(true)
                                }}
                                className="bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 whitespace-nowrap shadow-sm hover:shadow"
                            >
                                <Plus size={18} />
                                <span>Add Service Category</span>
                            </button>
                        </div>
                        
                        {/* Search Bar */}
                        <div className="relative max-w-md">
                            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search service categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col justify-center items-center h-64 py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                            <p className="text-gray-500">Loading services...</p>
                        </div>
                    ) : filteredServices.length ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredServices.map(service => (
                                        <tr key={service._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                                                    <img
                                                        src={service.imageUrl}
                                                        alt={service.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{service.name}</div>
                                            
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-gray-900 font-medium">
                                                    {/* <IndianRupee size={16} className="text-gray-400 mr-1" />  */}
                                                    {service.basePrice}
                                                </div>
                                                {/* <div className="text-xs text-gray-500 mt-1">Base price</div> */}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                                                <div className="line-clamp-2">{service.description || "No description available"}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={() => handleEditService(service)}
                                                        className="p-2 bg-blue-50 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
                                                        title="Edit service"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDeleteService(service)}
                                                        className="p-2 bg-red-50 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                                                        title="Delete service"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                                <ScissorsIcon size={40} className="text-gray-300" />
                            </div>
                            
                            {searchQuery ? (
                                <>
                                    <p className="text-gray-600 text-lg font-medium mb-2">No matching services found</p>
                                    <p className="text-gray-500 mb-4 text-center">
                                        No services matched your search "<span className="font-medium">{searchQuery}</span>"
                                    </p>
                                    <button 
                                        onClick={() => setSearchQuery('')} 
                                        className="text-primary hover:text-primary/80 font-medium"
                                    >
                                        Clear search
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-600 text-lg font-medium mb-2">No Service Categories Yet</p>
                                    <p className="text-gray-500 mb-6 text-center max-w-md">
                                        Add your first service category to start building your salon's service menu
                                    </p>
                                    <button
                                        onClick={() => setShowServiceForm(true)}
                                        className="bg-primary text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm"
                                    >
                                        <Plus size={18} />
                                        Add First Service
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {showServiceForm && (
                <div className="bg-white rounded-lg shadow-lg border overflow-hidden animate-fadeIn">
                    <div className="px-6 py-5 border-b flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setShowServiceForm(false)} 
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <ChevronLeft size={20} className="text-gray-500" />
                            </button>
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditingService ? 'Edit Service Category' : 'Add New Service Category'}
                            </h2>
                        </div>
                        <button 
                            onClick={() => setShowServiceForm(false)} 
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>

                    <form onSubmit={handleServiceSubmit} className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            {/* Image Upload */}
                            <div className="flex flex-col items-center justify-start">
                            <div className="relative w-full max-w-[240px]">

                                {/* Make whole thing clickable */}
                                <label 
                                htmlFor="service-image" 
                                className="block cursor-pointer"
                                >
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-primary/50 transition-colors">

                                    {serviceImg ? (
                                    <img
                                        src={URL.createObjectURL(serviceImg)}
                                        alt="Service preview"
                                        className="w-full h-full object-cover"
                                    />
                                    ) : isEditingService && serviceCategories.find(s => s._id === editServiceId)?.imageUrl ? (
                                    <img
                                        src={serviceCategories.find(s => s._id === editServiceId)?.imageUrl}
                                        alt="Service preview"
                                        className="w-full h-full object-cover"
                                    />
                                    ) : (
                                    <div className="text-center p-4 pointer-events-none">
                                        <ImagePlus size={40} className="text-gray-300 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Upload service image</p>
                                        <p className="text-xs text-gray-400 mt-1">Click to browse</p>
                                    </div>
                                    )}

                                </div>

                                {/* Pencil Button */}
                                <div className="absolute bottom-3 right-3 bg-white text-primary p-2 rounded-full shadow-md transition-colors pointer-events-none">
                                    <Pencil size={16} />
                                </div>

                                </label>

                                {/* Hidden Input */}
                                <input
                                type="file"
                                id="service-image"
                                accept="image/*"
                                onChange={(e) => setServiceImg(e.target.files[0])}
                                className="hidden"
                                />
                            </div>
                            </div>


                            {/* Form Fields */}
                            <div className="md:col-span-2 space-y-6">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Service Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={serviceName}
                                        onChange={e => setServiceName(e.target.value)}
                                        placeholder="e.g., Haircut, Coloring, Styling"
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none"
                                        required
                                    />
                                    
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Base Price <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="number"
                                            value={basePrice}
                                            onChange={e => setBasePrice(e.target.value)}
                                            placeholder="Starting price for this service"
                                            className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none"
                                            required
                                        />
                                    </div>
                                    
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={serviceDescription}
                                        onChange={e => setServiceDescription(e.target.value)}
                                        placeholder="Describe what this service includes and what clients can expect..."
                                        rows={4}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:outline-none"
                                        required
                                    />
                                    
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowServiceForm(false)}
                                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-5 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <Loader size={18} className="animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : isEditingService ? (
                                    <>
                                        <Check size={18} />
                                        <span>Update Service</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={18} />
                                        <span>Add Service</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl animate-slideIn">
                        <div className="text-center mb-6">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                <AlertTriangle size={30} className="text-red-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Service Category</h3>
                            <p className="text-gray-500">
                                Are you sure you want to delete "<span className="font-medium text-gray-700">{serviceToDelete?.name}</span>"? This action cannot be undone.
                            </p>
                        </div>
                        
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setServiceToDelete(null);
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteService}
                                disabled={deleteLoading}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                {deleteLoading ? (
                                    <>
                                        <Loader size={16} className="animate-spin" />
                                        <span>Deleting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        <span>Delete Service</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideIn {
                    from { 
                        opacity: 0;
                        transform: translateY(-20px); 
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0); 
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>
        </div>
    )
}

export default ServiceCategory
