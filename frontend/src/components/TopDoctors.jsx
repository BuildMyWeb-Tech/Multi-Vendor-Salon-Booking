import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { Clock, Scissors, CalendarCheck, ArrowRight } from 'lucide-react'

const TopDoctors = () => {
  const navigate = useNavigate()
  const { doctors: stylists } = useContext(AppContext)

  return (
    <section className="w-full py-14 px-4 sm:px-6 md:px-8 bg-gray-50">
      <div className="container mx-auto">

        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
            Featured Stylists
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto mb-5"></div>
          <p className="text-gray-600 text-sm sm:text-base">
            Choose your favourite stylist and book at your convenient time.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {stylists.slice(0, 8).map((stylist, index) => (
            <div
              key={index}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
            >

              {/* IMAGE – FIXED PROPERLY */}
              <div className="relative w-full aspect-[4/5] bg-gray-100">
                <img
                  src={stylist.image}
                  alt={stylist.name}
                  className="
                    w-full h-full
                    object-contain
                    sm:object-contain
                    lg:object-cover
                  "
                />

                {/* Availability */}
                <span
                  className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                    stylist.available
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {stylist.available ? 'Available' : 'Not Available'}
                </span>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {stylist.name}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-primary font-medium">
                    <Scissors size={16} />
                    {stylist.specialty.join(' • ')}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={16} />
                    {stylist.experience || '1 Year'} Experience
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => {
                    navigate(`/appointment/${stylist._id}`)
                    window.scrollTo(0, 0)
                  }}
                  className="w-full py-2.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <CalendarCheck size={16} />
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* View All */}
        <div className="flex justify-center mt-10">
          <button
            onClick={() => {
              navigate('/stylists')
              window.scrollTo(0, 0)
            }}
            className="border-2 border-primary text-primary px-8 py-3 rounded-full font-medium hover:bg-primary hover:text-white transition-all flex items-center gap-2"
          >
            View All Stylists
            <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </section>
  )
}

export default TopDoctors
