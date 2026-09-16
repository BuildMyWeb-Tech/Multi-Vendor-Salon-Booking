import React, { useState, useEffect } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Scissors,
  Palette,
  Sparkles,
  Clock,
  ArrowRight,
  Star,
  Award,
  Users,
  TrendingUp,
  Zap,
  CheckCircle2
} from 'lucide-react'

const Banner = () => {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(1)

  const services = [
    { name: 'Haircuts', icon: <Scissors size={16} /> },
    { name: 'Styling', icon: <Sparkles size={16} /> },
    { name: 'Coloring', icon: <Palette size={16} /> },
    { name: 'Treatments', icon: <Sparkles size={16} /> },
    { name: 'Extensions', icon: <Scissors size={16} /> }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev === 3 ? 1 : prev + 1))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const FastBookingCard = ({ className = '' }) => (
    <motion.div
      className={`bg-white rounded-2xl p-6 shadow-2xl w-[280px] border-2 border-purple-100 ${className}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.02, boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25)' }}
    >
      <div className='flex items-center gap-3 mb-5'>
        <motion.div 
          className='w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg'
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Zap size={22} fill="currentColor" />
        </motion.div>
        <div>
          <p className='font-bold text-gray-900 text-base'>Fast Booking</p>
          <p className='text-gray-600 text-sm flex items-center gap-1'>
            <CheckCircle2 size={14} className="text-green-500" />
            Book in seconds
          </p>
        </div>
      </div>

      <div className='flex justify-between items-start gap-3 text-center relative'>
        {/* Progress Line */}
        <div className='absolute top-5 left-5 right-5 h-0.5 bg-gray-200'>
          <motion.div
            className='h-full bg-gradient-to-r from-primary to-purple-600'
            initial={{ width: '0%' }}
            animate={{ 
              width: activeStep === 1 ? '0%' : activeStep === 2 ? '50%' : '100%' 
            }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {[1, 2, 3].map(step => (
          <div key={step} className='flex flex-col items-center relative z-10'>
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                activeStep === step
                  ? 'bg-gradient-to-br from-primary to-purple-600 text-white shadow-lg scale-110'
                  : activeStep > step
                  ? 'bg-gradient-to-br from-green-400 to-green-500 text-white'
                  : 'bg-white border-2 border-gray-300 text-gray-400'
              }`}
              animate={activeStep === step ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {activeStep > step ? <CheckCircle2 size={18} /> : step}
            </motion.div>
            <span className={`text-xs mt-2 whitespace-nowrap font-medium transition-colors ${
              activeStep >= step ? 'text-gray-900' : 'text-gray-500'
            }`}>
              {step === 1 && 'Choose Stylist'}
              {step === 2 && 'Pick Time'}
              {step === 3 && 'Confirm'}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )

  return (
    <section className='w-full bg-gradient-to-b from-purple-50 via-pink-50 to-white sm:py-12'>
      <div className='container mx-auto px-4'>
        <motion.div
          className='bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 rounded-3xl overflow-hidden shadow-2xl relative'
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Animated Background Pattern */}
          <div className='absolute inset-0 opacity-10'>
            <div className='absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl'></div>
            <div className='absolute bottom-0 right-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl'></div>
          </div>

          <div className='flex flex-col md:flex-row relative z-10'>

            {/* LEFT CONTENT */}
            <div className='w-full md:w-3/5 p-8 sm:p-10 lg:p-16'>
              <div className='max-w-xl'>

                <motion.div 
                  className='inline-flex items-center gap-2 mb-5 bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/30 shadow-lg'
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Star size={16} className="text-yellow-300" fill="currentColor" />
                  <span className='text-white text-sm font-semibold'>
                    Premium Salon Experience
                  </span>
                  <Award size={16} className="text-yellow-300" />
                </motion.div>

                <motion.h2 
                  className='text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white mb-5 leading-tight'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Elevate Your Look <br />
                  <span className='bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 text-transparent bg-clip-text'>
                    With Expert Salon Care
                  </span>
                </motion.h2>

                <motion.p 
                  className='text-white/95 text-sm sm:text-base lg:text-lg mb-7 leading-relaxed'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  From precision cuts to complete makeovers, our professional stylists
                  deliver personalized services designed to bring out your best self.
                </motion.p>

                {/* Stats */}
               

                <motion.div 
                  className='flex flex-wrap gap-2 mb-8'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {services.map((service, index) => (
                    <motion.span
                      key={index}
                      className='flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-md text-white text-sm rounded-full border border-white/20 font-medium hover:bg-white/25 transition-all cursor-pointer'
                      whileHover={{ scale: 1.05, y: -2 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                    >
                      {service.icon}
                      {service.name}
                    </motion.span>
                  ))}
                </motion.div>

                <motion.div 
                  className='flex flex-col sm:flex-row gap-4'
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <motion.button
                    onClick={() => navigate('/stylists')}
                    className='bg-white text-primary px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-2xl hover:shadow-3xl transition-all text-base group'
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Book Appointment
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>

                  <motion.button
                    onClick={() => navigate('/login')}
                    className='border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white hover:text-primary transition-all text-base backdrop-blur-sm'
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Account
                  </motion.button>
                </motion.div>

                {/* Trust Badge */}
                {/* <motion.div 
                  className='mt-8 flex items-center gap-3 text-white/90 text-sm'
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className='flex -space-x-2'>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className='w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold'>
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className='font-semibold'>Join 5000+ satisfied customers</p>
                    <p className='text-white/70 text-xs'>Trusted by beauty enthusiasts</p>
                  </div>
                </motion.div> */}
              </div>
            </div>

            {/* RIGHT IMAGE — ONLY TAB & LAP */}
            <div className='hidden md:block md:w-2/5 relative'>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className='h-full flex items-center justify-center p-8'
              >
                <div className='relative'>
                  {/* Glow Effect */}
                  <div className='absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-400 rounded-3xl blur-3xl opacity-30'></div>
                  
                  <img
                    src={assets.hair_styling || assets.hero_img}
                    alt='Salon'
                    className='relative w-full h-full object-contain drop-shadow-2xl'
                  />
                </div>
              </motion.div>

              {/* FAST BOOKING — DESKTOP */}
              <div className='absolute bottom-8 left-[-60px]'>
                <FastBookingCard />
              </div>
            </div>
          </div>

          {/* FAST BOOKING — MOBILE ONLY */}
          <div className='md:hidden py-8 flex justify-center'>
            <FastBookingCard />
          </div>

          {/* Decorative Elements */}
          <motion.div 
            className='absolute top-10 right-10 w-20 h-20 hidden lg:block'
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            < Scissors className="text-yellow-300 opacity-30" size={80} />
          </motion.div>

          <motion.div 
            className='absolute bottom-10 left-10 w-16 h-16 hidden lg:block'
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="text-pink-300 opacity-30" size={64} />
          </motion.div>

        </motion.div>

        
      </div>
    </section>
  )
}

export default Banner