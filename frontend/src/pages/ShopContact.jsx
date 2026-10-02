import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { Phone, Mail, MapPin, MessageCircle, Clock, Scissors } from 'lucide-react';

const ShopContact = () => {
  const { shopSlug } = useParams();
  const { currentShop } = useContext(ShopContext);

  const shopName = currentShop?.shopName || (shopSlug ? shopSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Salon');

  const contactItems = [
    currentShop?.phone && {
      icon: Phone,
      label: 'Phone',
      value: currentShop.phone,
      href: `tel:${currentShop.phone}`,
    },
    currentShop?.whatsapp && {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: currentShop.whatsapp,
      href: `https://wa.me/${currentShop.whatsapp}`,
    },
    currentShop?.email && {
      icon: Mail,
      label: 'Email',
      value: currentShop.email,
      href: `mailto:${currentShop.email}`,
    },
    (currentShop?.address || currentShop?.city) && {
      icon: MapPin,
      label: 'Address',
      value: [currentShop.address, currentShop.city, currentShop.state, currentShop.pincode].filter(Boolean).join(', '),
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([currentShop.address, currentShop.city, currentShop.state, currentShop.pincode].filter(Boolean).join(', '))}`,
      target: '_blank',
    },
  ].filter(Boolean);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          {currentShop?.logo
            ? <img src={currentShop.logo} alt={shopName} className="w-12 h-12 rounded-xl object-cover" />
            : <Scissors size={28} className="text-primary" />}
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Contact Us</h1>
        <p className="text-gray-500 mt-2">{shopName} — We'd love to hear from you</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Get In Touch</h2>
          <div className="space-y-5">
            {contactItems.length > 0 ? contactItems.map((item, i) => {
              const Icon = item.icon;
              const content = (
                <div key={i} className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm text-gray-700 font-medium mt-0.5">{item.value}</p>
                  </div>
                </div>
              );
              return item.href
                ? <a key={i} href={item.href} target={item.href.startsWith('http') ? '_blank' : '_self'} rel="noopener noreferrer">{content}</a>
                : content;
            }) : (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">No contact information available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Google Map */}
          {(currentShop?.address || currentShop?.city) && (() => {
            const addr = [currentShop.address, currentShop.city, currentShop.state, currentShop.pincode].filter(Boolean).join(', ');
            const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&output=embed`;
            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                  <MapPin size={15} className="text-primary" />
                  <span className="text-sm font-semibold text-gray-700">Our Location</span>
                </div>
                <iframe
                  title={`${shopName} location`}
                  src={mapSrc}
                  width="100%"
                  height="220"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="px-5 py-3">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <MapPin size={11} /> Open in Google Maps
                  </a>
                </div>
              </div>
            );
          })()}



          
        </div>
      </div>
    </div>
  );
};

export default ShopContact;
