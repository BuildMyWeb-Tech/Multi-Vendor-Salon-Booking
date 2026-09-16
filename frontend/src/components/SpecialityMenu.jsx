import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { specialityData } from '../assets/assets'; // Keep as fallback
import { Scissors, Star, Clock, ArrowRight, TrendingUp, Award, Sparkles } from 'lucide-react';

const SpecialityMenu = () => {
  const [serviceCategories, setServiceCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { backendUrl } = useContext(AppContext);
  const location = useLocation(); // Get current location
  
  // Determine if we're on the home page or services page
  const isHomePage = location.pathname === '/' || location.pathname === '/home';

  useEffect(() => {
    fetchServiceCategories();
  }, []);

  const fetchServiceCategories = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/user/services`);
      if (data.success && data.services.length > 0) {
        setServiceCategories(data.services);
      }
    } catch (error) {
      console.error('Error fetching service categories:', error);
      // Use fallback data if API fails
    } finally {
      setLoading(false);
    }
  };

  // Use real data if available, otherwise use fallback data
  const displayData = serviceCategories.length > 0 ? serviceCategories : specialityData;
  
  // Display all data on services page, but limit to 6 on home page
  const visibleServices = isHomePage ? displayData.slice(0, 6) : displayData;
  
  // Function to get random icon for variety
  const getServiceIcon = (index) => {
    const icons = [
      <Scissors size={18} />,
      <Star size={18} />,
      <TrendingUp size={18} />,
      <Award size={18} />,
      <Sparkles size={18} />
    ];
    return icons[index % icons.length];
  };

  return (
    <section
      id="speciality"
      className="w-full py-14 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="container mx-auto">
        {/* Heading with enhanced styling */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-block bg-primary/10 px-4 py-1 rounded-full mb-3">
            <span className="text-primary font-medium text-sm flex items-center justify-center gap-2">
              <Scissors size={16} />
              Professional Services
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4 leading-tight">
            Our Premium <span className="text-primary">Styling Services</span>
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-5 rounded-full"></div>
          <p className="text-gray-600 text-sm sm:text-base max-w-xl mx-auto">
            Explore professional hair services tailored to your look, lifestyle, and personality. 
            Our experts create styles that elevate your natural beauty.
          </p>
        </div>

        {/* Loading state with improved spinner */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="relative w-16 h-16">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/30 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
              <Scissors className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" size={20} />
            </div>
          </div>
        )}

        {/* Grid with enhanced card design */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleServices.map((item, index) => (
              <Link
                 key={item._id || index}
                 to={`/stylists?speciality=${encodeURIComponent(item.name || item.speciality)}`}
                  onClick={() => window.scrollTo(0, 0)}
                  className="group"
                     >
                <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full border border-gray-100 hover:border-primary/20 transform hover:-translate-y-1">
                  {/* Image Wrapper with enhanced hover effect */}
                  <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                    <img
                      src={item.imageUrl || item.image}
                      alt={item.name || item.speciality}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Badge */}
                    {index % 3 === 0 && (
                      <div className="absolute top-3 right-3 bg-primary text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm">
                        Popular
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Content with improved typography and spacing */}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center mb-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                        {getServiceIcon(index)}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 group-hover:text-primary transition-colors">
                        {item.name || item.speciality}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">
                      {item.description || 
                        'Book an appointment with our expert stylists specializing in this service.'}
                    </p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      {item.basePrice ? (
                        <div>
                          <p className="text-xs text-gray-500">Starting from</p>
                          <p className="text-lg font-bold text-primary">
                            ₹{item.basePrice}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Clock size={14} className="text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">30-60 min</span>
                        </div>
                      )}
                      
                      <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-primary text-gray-400 group-hover:text-white flex items-center justify-center transition-all duration-300">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {/* Call-to-action button - Only show on Home Page */}
        {!loading && isHomePage && (
          <div className="text-center mt-12">
            <Link 
              to="/services"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-medium transition-all duration-300 shadow-sm hover:shadow-md"
            >
              View All Services
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>
      
      {/* Add responsive styles without changing class names */}
      <style jsx>{`
        @media (max-width: 640px) {
          #speciality {
            padding-top: 3rem;
            padding-bottom: 3rem;
          }
          
          #speciality .container {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
        
        @media (min-width: 641px) and (max-width: 1024px) {
          #speciality .grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </section>
  );
};

export default SpecialityMenu;
