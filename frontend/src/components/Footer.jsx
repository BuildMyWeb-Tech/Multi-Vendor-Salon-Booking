import React, { useEffect, useState, useContext } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { 
  Phone,
  Mail,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Sparkles,
  UserCircle,
  Palette,
  Droplets,
  Flower2,
  Users,
  Lock,
  FileCheck,
  RotateCcw,
  HelpCircle,
  ChevronRight,
  Scissors,
  Feather,
  Brush,
  Gem
} from "lucide-react";

// Map of service names to icons for common services
const serviceIconMap = {
  "Hair Styling": Sparkles,
  "Beard & Grooming": UserCircle,
  "Hair Coloring": Palette,
  "Hair Treatment": Droplets,
  "Bridal Hairstyling": Flower2,
  "Unisex Hairstyling": Users,
  "Hair Cut": Scissors,
  "Shaving": Feather,
  "Styling": Brush,
  "Coloring": Brush,
  "Spa": Droplets,
  "Facial": Gem,
  "Beard": Gem
  // Add more mappings as needed
};

// Fallback icon if no match is found
const getServiceIcon = (serviceName) => {
  // Try to find exact match
  if (serviceIconMap[serviceName]) {
    return serviceIconMap[serviceName];
  }
  
  // Try to find partial match
  for (const [key, icon] of Object.entries(serviceIconMap)) {
    if (serviceName.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  
  // Default fallback
  return Scissors;
};

const Footer = () => {
  const [services, setServices] = useState([]);
  const { backendUrl } = useContext(AppContext);
  
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/user/services`);
        if (response.data.success) {
          // Only show active services, limit to 6 for footer
          const activeServices = response.data.services
            .filter(service => service.isActive)
            .slice(0, 6);
          setServices(activeServices);
        }
      } catch (error) {
        console.error("Failed to fetch services:", error);
      }
    };
    
    fetchServices();
  }, [backendUrl]);

  return (
    <div className="px-4 sm:px-6 md:mx-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 my-10 mt-20 text-sm">

        {/* ABOUT */}
        <div>
          <img className="mb-5 w-40" src={assets.logo} alt="StyleStudio Logo" />
          <p className="text-gray-600 leading-relaxed mb-6">
            StyleStudio is a modern salon and grooming brand offering premium
            styling, beauty, and care services. We help you look confident,
            stylish, and sharp—every day.
          </p>

          <div className="flex space-x-4">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:scale-110 transition"
              >
                <Icon size={20} />
              </a>
            ))}
          </div>
        </div>

        {/* QUICK LINKS */}
        <div>
          <p className="text-lg font-semibold mb-6">QUICK LINKS</p>
          <ul className="flex flex-col gap-3 text-gray-600">
            {[
              { name: "Home", href: "/" },
              { name: "Our Stylists", href: "/stylists" },
              { name: "Services", href: "/services" },
              { name: "About Us", href: "/about" },
              { name: "Contact Us", href: "/contact" },
            ].map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="flex items-center gap-2 hover:text-primary transition"
                >
                  <ChevronRight size={16} className="text-primary" />
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* OUR SERVICES - Dynamically Generated */}
        <div>
          <p className="text-lg font-semibold mb-6">OUR SERVICES</p>
          <ul className="flex flex-col gap-3 text-gray-600">
            {services.length > 0 ? (
              services.map((service) => {
                const IconComponent = getServiceIcon(service.name);
                return (
                  <li key={service._id}>
                    <a
                      href="/services"
                      className="flex items-center gap-2 hover:text-primary transition"
                    >
                      <IconComponent size={16} className="text-primary" />
                      {service.name}
                    </a>
                  </li>
                );
              })
            ) : (
              // Fallback static content while loading
              Array(4).fill(0).map((_, index) => (
                <li key={index} className="h-6 bg-gray-200 animate-pulse rounded w-3/4"></li>
              ))
            )}
          </ul>
        </div>

        {/* LEGAL */}
        <div>
          <p className="text-lg font-semibold mb-6">LEGAL</p>
          <ul className="flex flex-col gap-3 text-gray-600">
            {[
              { name: "Privacy Policy", icon: Lock, href: "/privacy-policy" },
              { name: "Terms & Conditions", icon: FileCheck, href: "/terms" },
              { name: "Refund & Cancellation", icon: RotateCcw, href: "/refund-policy" },
              { name: "FAQs", icon: HelpCircle, href: "/faqs" },
            ].map((item) => (
              <li key={item.name}>
                <a
                  href={item.href}
                  className="flex items-center gap-2 hover:text-primary transition"
                >
                  <item.icon size={16} className="text-primary" />
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* CONTACT */}
        <div>
          <p className="text-lg font-semibold mb-6">GET IN TOUCH</p>
          <ul className="flex flex-col gap-4 text-gray-600">
            <li>
              <a href="tel:+919344095727" className="flex items-center gap-3 hover:text-primary">
                <Phone size={18} className="text-primary" />
                +91 93440 95727
              </a>
            </li>

            <li>
              <a href="tel:+918610961158" className="flex items-center gap-3 hover:text-primary">
                <Phone size={18} className="text-primary" />
                +91 86109 61158
              </a>
            </li>

            <li>
              <a href="mailto:info@stylestudio.com" className="flex items-center gap-3 hover:text-primary">
                <Mail size={18} className="text-primary" />
                info@stylestudio.com
              </a>
            </li>

            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-primary mt-1" />
              <span>
                69, Mettu Street,
                <br />
                Srirangam, Trichy – 620006
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="py-6 pb-24 sm:pb-6 border-t text-center sm:flex sm:justify-between sm:items-center">
        <p className="text-sm text-gray-600">
          © 2026 StyleStudio. All Rights Reserved.
        </p>

        <p className="text-sm text-gray-600 mt-3 sm:mt-0">
          Designed & Developed by{" "}
          <a
            href="https://buildmyweb.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium hover:underline"
          >
            BuildMyWeb
          </a>
        </p>
      </div>
    </div>
  );
};

export default Footer;
