import React from 'react'
import { assets } from '../assets/assets'
import { Scissors, Award, Users, Star, Sparkles, Clock } from 'lucide-react'

const About = () => {
  return (
    <div className="bg-gray-50">


      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Our Story Section */}
        <div className="flex flex-col lg:flex-row gap-16 mb-20">
          <div className="lg:w-1/2 relative">
            <div className="relative z-10">
              <img 
                className="w-full h-auto rounded-lg shadow-xl" 
                src={assets.about_image} 
                alt="Salon interior" 
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-primary text-white p-6 rounded-lg shadow-lg z-20 hidden md:block">
              <p className="text-2xl font-bold mb-1">10+</p>
              <p className="uppercase text-sm font-medium">Years of Excellence</p>
            </div>
            <div className="hidden lg:block absolute -z-10 top-10 -left-10 w-full h-full bg-gray-200 rounded-lg"></div>
          </div>

          <div className="lg:w-1/2 flex flex-col justify-center">
            <h6 className="text-primary font-medium tracking-wide">OUR STORY</h6>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Passion for Beautiful Hair Since 2012</h2>
            
            <div className="space-y-6 text-gray-600 leading-relaxed">
              <p>
                Welcome to StyleStudio, where artistry meets expertise in creating the perfect look for every client. Founded with a vision to redefine hair styling, we've grown into a community of passionate professionals dedicated to helping you look and feel your absolute best.
              </p>
              
              <p>
                Our journey began with a simple belief: the right hairstyle can transform not just your appearance, but also how you feel about yourself. This philosophy has guided our approach to every client who walks through our doors.
              </p>
              
              <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary mt-8">
                <h3 className="text-xl font-bold text-gray-800 mb-3">Our Philosophy</h3>
                <p className="text-gray-600 italic">
                  "At StyleStudio, we believe that beautiful hair should be accessible to everyone. We take time to understand your lifestyle, preferences, and hair type to create personalized styles that enhance your natural beauty and reflect your unique personality."
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h6 className="text-primary font-medium tracking-wide">EXCELLENCE IN EVERY CUT</h6>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2">
              WHY <span className="text-primary">CHOOSE US</span>
            </h2>
            <div className="w-20 h-1 bg-primary mx-auto mt-4"></div>
            <p className="max-w-2xl mx-auto text-gray-600 mt-4">
              Our dedication to excellence and client satisfaction sets us apart in everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Scissors className="h-12 w-12 mb-4 text-primary" />,
                title: "EXPERT STYLISTS",
                description: "Our team receives continuous education to master the latest techniques and trends in hair styling and coloring."
              },
              {
                icon: <Star className="h-12 w-12 mb-4 text-primary" />,
                title: "PERSONALIZED APPROACH",
                description: "Detailed consultations ensure we create styles that complement your unique features, lifestyle, and personality."
              },
              {
                icon: <Sparkles className="h-12 w-12 mb-4 text-primary" />,
                title: "PREMIUM PRODUCTS",
                description: "We use only high-quality, professional products that protect and enhance your hair's natural beauty and health."
              },
              {
                icon: <Award className="h-12 w-12 mb-4 text-primary" />,
                title: "QUALITY GUARANTEED",
                description: "We stand behind our work with a satisfaction guarantee, ensuring you leave our salon feeling confident."
              },
              {
                icon: <Users className="h-12 w-12 mb-4 text-primary" />,
                title: "CLIENT-CENTERED SERVICE",
                description: "Your comfort and satisfaction are our priorities, with amenities and attentive care throughout your visit."
              },
              {
                icon: <Clock className="h-12 w-12 mb-4 text-primary" />,
                title: "CONVENIENT SCHEDULING",
                description: "Flexible appointment options and online booking make it easy to fit your styling needs into your busy schedule."
              }
            ].map((item, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl group"
              >
                <div className="p-8">
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-primary transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">
                    {item.description}
                  </p>
                </div>
                <div className="h-1 w-full bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section Preview */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Meet Our Talented Team</h2>
            <p className="text-gray-600 max-w-3xl mx-auto mb-6">
              Our stylists combine technical precision with creative vision to deliver exceptional results tailored to your needs.
            </p>
            <a 
              href="/stylists" 
              className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark transition-colors duration-300"
            >
              View Our Stylists
            </a>
          </div>
        </div>
      </div>

      {/* Testimonial Banner */}
      <div className="bg-primary py-16 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">What Our Clients Say</h2>
          <p className="text-xl italic max-w-4xl mx-auto">
            "I've never felt more confident about my hair! The stylist really listened to what I wanted and delivered beyond my expectations. StyleStudio has earned a client for life."
          </p>
          <p className="mt-4 font-bold">— Sarah Johnson</p>
        </div>
      </div>
    </div>
  )
}

export default About
