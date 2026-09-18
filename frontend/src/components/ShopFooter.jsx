import React, { useEffect, useState, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
import { AppContext } from '../context/AppContext';
import {
  Phone, Mail, MapPin, Instagram, Facebook, Twitter,
  Scissors, ChevronRight, Lock, FileCheck, RotateCcw, HelpCircle,
  MessageCircle,
} from 'lucide-react';

const ShopFooter = () => {
  const { shopSlug } = useParams();
  const { currentShop } = useContext(ShopContext);
  const { backendUrl } = useContext(AppContext);
  const [services, setServices] = useState([]);
  const s = shopSlug || '';

  useEffect(() => {
    if (!s || !backendUrl) return;
    axios.get(`${backendUrl}/api/shop/${s}/services`)
      .then(res => {
        if (res.data.success) {
          setServices(res.data.services.filter(sv => sv.isActive).slice(0, 6));
        }
      })
      .catch(() => {});
  }, [s, backendUrl]);

  const shopName = currentShop?.shopName || (s ? s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Salon');

  return (
    <div className="px-4 sm:px-6 md:mx-10 pb-24 md:pb-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 my-10 mt-16 text-sm">

        {/* About */}
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent mb-4">
            {shopName}
          </h2>
          {currentShop?.tagline && (
            <p className="text-gray-500 text-sm mb-4">{currentShop.tagline}</p>
          )}
          <p className="text-gray-500 text-sm mb-5 leading-relaxed">
            Professional salon services tailored for you. Book your appointment today.
          </p>
          <div className="flex space-x-3">
            {[Instagram, Facebook, Twitter].map((Icon, i) => (
              <a key={i} href="#"
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white hover:scale-110 transition">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <p className="text-base font-semibold mb-5">QUICK LINKS</p>
          <ul className="flex flex-col gap-3 text-gray-600">
            {[
              { name: 'Home', href: `/${s}` },
              { name: 'Our Stylists', href: `/${s}/stylists` },
              { name: 'Services', href: `/${s}/services` },
              { name: 'Contact Us', href: `/${s}/contact` },
              { name: 'My Appointments', href: `/${s}/my-appointments` },
            ].map((link) => (
              <li key={link.name}>
                <Link to={link.href} className="flex items-center gap-2 hover:text-primary transition text-sm">
                  <ChevronRight size={14} className="text-primary" />
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <p className="text-base font-semibold mb-5">OUR SERVICES</p>
          <ul className="flex flex-col gap-3 text-gray-600">
            {services.length > 0 ? services.map((svc) => (
              <li key={svc._id}>
                <Link to={`/${s}/services`} className="flex items-center gap-2 hover:text-primary transition text-sm">
                  <Scissors size={14} className="text-primary" />
                  {svc.name}
                </Link>
              </li>
            )) : Array(4).fill(0).map((_, i) => (
              <li key={i} className="h-5 bg-gray-200 animate-pulse rounded w-3/4" />
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-base font-semibold mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-4 text-gray-600 text-sm">
            {currentShop?.phone && (
              <li>
                <a href={`tel:${currentShop.phone}`} className="flex items-center gap-3 hover:text-primary">
                  <Phone size={16} className="text-primary flex-shrink-0" />
                  {currentShop.phone}
                </a>
              </li>
            )}
            {currentShop?.whatsapp && (
              <li>
                <a href={`https://wa.me/${currentShop.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary">
                  <MessageCircle size={16} className="text-primary flex-shrink-0" />
                  WhatsApp
                </a>
              </li>
            )}
            {currentShop?.email && (
              <li>
                <a href={`mailto:${currentShop.email}`} className="flex items-center gap-3 hover:text-primary">
                  <Mail size={16} className="text-primary flex-shrink-0" />
                  {currentShop.email}
                </a>
              </li>
            )}
            {(currentShop?.address || currentShop?.city) && (
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
                <span>
                  {[currentShop.address, currentShop.city, currentShop.state, currentShop.pincode]
                    .filter(Boolean).join(', ')}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="py-5 border-t text-center sm:flex sm:justify-between sm:items-center">
        <p className="text-sm text-gray-500">© {new Date().getFullYear()} {shopName}. All Rights Reserved.</p>
        <p className="text-sm text-gray-500 mt-2 sm:mt-0">
          Design and Developed by{' '}
          <a href="https://buildmyweb.info/" target="_blank" rel="noopener noreferrer"
            className="text-primary font-medium hover:underline">
            BuildMyWeb
          </a>
        </p>
      </div>
    </div>
  );
};

export default ShopFooter;
