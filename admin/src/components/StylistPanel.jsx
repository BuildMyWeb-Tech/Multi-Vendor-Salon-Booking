import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Scissors, Menu, X, Settings, LogOut, User, Calendar as CalendarIcon, BarChart, MessageSquare, Award } from 'lucide-react';

const StylistPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const demoAppointments = [
        {
          id: '1',
          clientName: 'Emma Watson',
          service: 'Hair Coloring & Styling',
          date: '2023-06-15',
          time: '10:00 AM',
          price: 1800,
          status: 'confirmed',
          image: 'https://randomuser.me/api/portraits/women/44.jpg'
        }
        
      ];
      
      setAppointmentsList(demoAppointments);
      setIsLoading(false);
    }, 1000);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent isLoading={isLoading} appointments={appointmentsList} />;
      case 'appointments':
        return <AppointmentsContent isLoading={isLoading} appointments={appointmentsList} />;
      case 'clients':
        return <ClientsContent />;
      case 'services':
        return <ServicesContent />;
      case 'profile':
        return <ProfileContent />;
      default:
        return <DashboardContent isLoading={isLoading} appointments={appointmentsList} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-md bg-white shadow-md text-gray-700"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 z-40 transition duration-200 ease-in-out lg:flex flex-col w-64 bg-white border-r border-gray-200`}>
        <div className="flex items-center justify-center h-16 border-b border-gray-200 px-6">
          <h1 className="text-xl font-bold text-primary flex items-center">
            <Scissors className="mr-2" /> StyleStudio
          </h1>
        </div>
        
        <div className="flex flex-col items-center p-4 border-b">
          <div className="w-20 h-20 rounded-full overflow-hidden mb-2">
            <img 
              src="https://randomuser.me/api/portraits/men/85.jpg" 
              alt="Stylist Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="font-semibold">James Rodriguez</h2>
          <p className="text-xs text-gray-500">Master Hair Stylist</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            <li>
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`w-full flex items-center p-2 rounded-lg text-sm font-medium ${activeTab === 'dashboard' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <BarChart className="mr-3 h-5 w-5" />
                Dashboard
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => setActiveTab('appointments')} 
                className={`w-full flex items-center p-2 rounded-lg text-sm font-medium ${activeTab === 'appointments' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <CalendarIcon className="mr-3 h-5 w-5" />
                Appointments
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => setActiveTab('clients')} 
                className={`w-full flex items-center p-2 rounded-lg text-sm font-medium ${activeTab === 'clients' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Users className="mr-3 h-5 w-5" />
                Clients
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => setActiveTab('services')} 
                className={`w-full flex items-center p-2 rounded-lg text-sm font-medium ${activeTab === 'services' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <Scissors className="mr-3 h-5 w-5" />
                Services & Pricing
              </button>
            </li>
            
            <li>
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`w-full flex items-center p-2 rounded-lg text-sm font-medium ${activeTab === 'profile' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                <User className="mr-3 h-5 w-5" />
                My Profile
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t">
          <button className="w-full flex items-center p-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50">
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const DashboardContent = ({ isLoading, appointments }) => {
  // Stats for dashboard
  const stats = [
    { title: "Today's Appointments", value: "5", icon: <CalendarIcon className="w-6 h-6 text-blue-500" /> },
    { title: "Weekly Clients", value: "32", icon: <Users className="w-6 h-6 text-green-500" /> },
    { title: "Revenue (Monthly)", value: "₹48,500", icon: <BarChart className="w-6 h-6 text-purple-500" /> },
    { title: "Rating", value: "4.9/5", icon: <Award className="w-6 h-6 text-yellow-500" /> },
  ];
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className="p-2 rounded-full bg-gray-50">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Today's Schedule */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold">Today's Schedule</h3>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.filter(app => app.date === '2023-06-15').map(appointment => (
                <div key={appointment.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <img src={appointment.image} alt={appointment.clientName} className="w-10 h-10 rounded-full mr-4" />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{appointment.clientName}</h4>
                    <p className="text-sm text-gray-500">{appointment.service}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{appointment.time}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100">
          <h3 className="font-semibold text-indigo-800 mb-2">Manage Working Hours</h3>
          <p className="text-sm text-indigo-600 mb-4">Set your availability for upcoming bookings.</p>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            Update Hours
          </button>
        </div>
        
        <div className="bg-rose-50 p-6 rounded-lg border border-rose-100">
          <h3 className="font-semibold text-rose-800 mb-2">Add New Service</h3>
          <p className="text-sm text-rose-600 mb-4">Create a new service offering for clients.</p>
          <button className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 transition-colors">
            Add Service
          </button>
        </div>
        
        <div className="bg-amber-50 p-6 rounded-lg border border-amber-100">
          <h3 className="font-semibold text-amber-800 mb-2">View Upcoming Leaves</h3>
          <p className="text-sm text-amber-600 mb-4">Check and manage your upcoming time off.</p>
          <button className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 transition-colors">
            Manage Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

// Appointments Component
const AppointmentsContent = ({ isLoading, appointments }) => {
  const [filter, setFilter] = useState('all');
  
  const filteredAppointments = filter === 'all' 
    ? appointments 
    : appointments.filter(app => app.status === filter);
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold">Appointments</h2>
        
        <div className="flex mt-4 sm:mt-0">
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm ${
                filter === 'all' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            
            <button 
              onClick={() => setFilter('confirmed')}
              className={`px-4 py-2 rounded-lg text-sm ${
                filter === 'confirmed' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Confirmed
            </button>
            
            <button 
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm ${
                filter === 'pending' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            
            <button 
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm ${
                filter === 'completed' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <img className="h-10 w-10 rounded-full" src={appointment.image} alt="" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{appointment.clientName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{appointment.service}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    <div className="text-sm text-gray-500">{appointment.time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{appointment.price}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                      appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-primary hover:text-primary-dark mr-3">View Details</button>
                    {appointment.status !== 'completed' && (
                      <button className="text-green-600 hover:text-green-800">Mark Completed</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Placeholder components for other tabs
const ClientsContent = () => <div className="text-center p-12 text-gray-500">Clients management section will go here</div>;
const ServicesContent = () => <div className="text-center p-12 text-gray-500">Services and pricing section will go here</div>;
const ProfileContent = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Profile</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Profile Image */}
          <div className="sm:w-1/3 md:w-1/4 flex flex-col items-center">
            <div className="w-32 h-32 relative rounded-full overflow-hidden mb-4">
              <img 
                src="https://randomuser.me/api/portraits/men/85.jpg" 
                alt="Stylist Avatar"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            
            <button className="px-4 py-2 text-sm text-primary border border-primary rounded-md hover:bg-primary-50 transition-colors w-full">
              Change Photo
            </button>
          </div>
          
          {/* Profile Details */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  defaultValue="James Rodriguez"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  defaultValue="james.rodriguez@stylestudio.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input 
                  type="tel" 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  defaultValue="+91 9876543210"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                  <option>Master Hair Stylist</option>
                  <option>Hair Coloring Specialist</option>
                  <option>Hair Treatment Specialist</option>
                  <option>Beard & Grooming Specialist</option>
                  <option>Bridal Hairstylist</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
              <textarea 
                rows="4" 
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                defaultValue="Professional hairstylist with over 8 years of experience specializing in modern cuts, color techniques, and styling. Passionate about helping clients find their perfect look while maintaining hair health."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  defaultValue="8 Years"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  defaultValue="English, Hindi, Tamil"
                />
              </div>
            </div>
            
            <h3 className="font-medium text-gray-900 mb-3 mt-6">Professional Certifications</h3>
            <div className="space-y-2 mb-6">
              <div className="flex items-center p-3 border rounded-md">
                <Award className="h-5 w-5 text-yellow-500 mr-3" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">Advanced Hair Coloring Certification</h4>
                  <p className="text-sm text-gray-500">L'Oreal Professional, 2020</p>
                </div>
                <button className="text-gray-400 hover:text-red-500">
                  <Trash size={18} />
                </button>
              </div>
              
              <div className="flex items-center p-3 border rounded-md">
                <Award className="h-5 w-5 text-yellow-500 mr-3" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">Master Stylist Certification</h4>
                  <p className="text-sm text-gray-500">Vidal Sassoon Academy, 2018</p>
                </div>
                <button className="text-gray-400 hover:text-red-500">
                  <Trash size={18} />
                </button>
              </div>
              
              <button className="w-full p-2 mt-2 text-sm border border-dashed border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors flex items-center justify-center">
                <Plus size={16} className="mr-2" /> Add Certification
              </button>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Working Hours */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="mr-2 h-5 w-5 text-primary" />
            Working Hours
          </h3>
          
          <div className="space-y-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-600">{day}</span>
                <div className="flex items-center">
                  <select className="border rounded-md text-sm p-1 mr-2">
                    <option>9:00 AM</option>
                    <option>10:00 AM</option>
                  </select>
                  <span className="text-gray-400 mx-1">to</span>
                  <select className="border rounded-md text-sm p-1">
                    <option>6:00 PM</option>
                    <option>7:00 PM</option>
                  </select>
                </div>
              </div>
            ))}
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Sunday</span>
              <div className="flex items-center">
                <span className="text-sm text-red-500">Closed</span>
              </div>
            </div>
          </div>
          
          <button className="w-full mt-4 p-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors">
            Update Working Hours
          </button>
        </div>
        
        {/* Account Settings */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center">
            <Settings className="mr-2 h-5 w-5 text-primary" />
            Account Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <h4 className="font-medium text-gray-800">Change Password</h4>
                <p className="text-sm text-gray-500">Update your password regularly for security</p>
              </div>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                Change
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <h4 className="font-medium text-gray-800">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <button className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-md">
                Enabled
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <h4 className="font-medium text-gray-800">Notification Settings</h4>
                <p className="text-sm text-gray-500">Manage email and app notifications</p>
              </div>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                Manage
              </button>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-red-100 rounded-md bg-red-50">
              <div>
                <h4 className="font-medium text-red-800">Delete Account</h4>
                <p className="text-sm text-red-600">Permanently delete your account</p>
              </div>
              <button className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-100">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Missing import references
const Camera = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const Plus = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const Trash = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

export default StylistPanel;
