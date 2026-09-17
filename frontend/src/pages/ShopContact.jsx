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
      href: null,
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

        {/* Map / Working Hours placeholder */}
        <div className="flex flex-col gap-6">
          {/* Working Hours */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary" /> Working Hours
            </h2>
            <div className="space-y-2 text-sm text-gray-600">
              {currentShop?.workingHours ? (
                Object.entries(currentShop.workingHours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="font-medium capitalize">{day}</span>
                    <span>{hours || 'Closed'}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">Contact us for working hours.</p>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-6 text-white text-center">
            <Scissors size={28} className="mx-auto mb-3 opacity-80" />
            <h3 className="font-bold text-lg mb-2">Ready to Book?</h3>
            <p className="text-white/70 text-sm mb-4">Browse our stylists and book your appointment online.</p>
            <a
              href={`/${shopSlug}/stylists`}
              className="inline-block bg-white text-primary font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-white/90 transition"
            >
              Book Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopContact;
