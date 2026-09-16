import React from 'react'
import { Phone, Mail, MapPin, Clock, CalendarRange } from 'lucide-react'

const Contact = () => {
  return (
    <div className="bg-gray-50 py-16">
      <div className="container mx-auto px-4">
        
        {/* Header Section */}
        <div className='text-center mb-12'>
          <h6 className="text-primary font-semibold tracking-wide uppercase">Get in Touch</h6>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-800 mt-2'>
            Contact <span className='text-primary'>Us</span>
          </h2>
          <div className="w-24 h-1 bg-primary mx-auto mt-4 rounded-full"></div>
          <p className="max-w-2xl mx-auto text-gray-600 mt-4 leading-relaxed">
            Whether you want to book an appointment or simply have a question, our team at <strong>Style Studio</strong> is here to help.  
            Reach out anytime — we’d love to hear from you!
          </p>
        </div>

        {/* Main Content */}
        <div className='flex flex-col lg:flex-row gap-12 mb-16'>
          
          {/* Contact Information */}
          <div className='lg:w-1/2'>
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-8 md:p-10">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Style Studio</h3>

                <div className="space-y-6">

                  {/* Address */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Our Location</h4>
                      <p className="text-gray-600 leading-relaxed">
                        69, Mettu Street, Srirangam, <br />
                        Trichy – 620006, Tamil Nadu
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Phone Number</h4>
                      <p className="text-gray-600 leading-relaxed">
                        <a href="tel:+919344095727" className="hover:text-primary font-medium">
                          +91 93440 95727
                        </a>
                        <br />
                        <a href="tel:+918610961158" className="hover:text-primary font-medium">
                          +91 86109 61158
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Email Address</h4>
                      <p className="text-gray-600">
                        <a href="mailto:info@stylestudio.com" className="hover:text-primary font-medium">
                          info@stylestudio.com
                        </a>
                      </p>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 text-primary">
                      <Clock className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Working Hours</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Monday – Saturday: 9:00 AM – 8:00 PM <br />
                        Sunday: 10:00 AM – 6:00 PM
                      </p>
                    </div>
                  </div>
                </div>

                {/* Appointment CTA */}
                <div className="mt-10 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-3">Book an Appointment</h4>
                  <p className="text-gray-600 mb-4">
                    Secure your preferred time slot with our expert stylists.
                  </p>

                  <a
                    href="/stylists"
                    className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg shadow-md hover:bg-primary-dark transition-all duration-300"
                  >
                    <CalendarRange className="w-5 h-5 mr-2" />
                    Book Now
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:w-1/2">
            <div className="rounded-xl overflow-hidden shadow-xl h-full border border-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5511202655507!2d78.68402671100183!3d10.851786457720954!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baaf5d6fa43d9f7%3A0x278a8e4b2467aa36!2sSrirangam%2C%20Tiruchirappalli%2C%20Tamil%20Nadu%20620006!5e0!3m2!1sen!2sin!4v1661326021342!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Style Studio Location"
                className="min-h-[450px] lg:min-h-[600px]"
              ></iframe>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default Contact
