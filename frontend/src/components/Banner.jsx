import React from 'react'
import { assets } from '../assets/assets'
import { motion } from 'framer-motion'
import { Zap, SprayCan, Scissors } from "lucide-react";


const Header = () => {
  return (
    <section className="w-full bg-primary rounded-lg overflow-hidden">
      <div className="container mx-auto px-4 py-10 sm:px-6 ">
        <div className="flex flex-col lg:flex-row items-center gap-10">

          {/* ---------- LEFT CONTENT ---------- */}
          <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-white leading-tight">
              Your Style, Your Story,<br className="hidden sm:block" />
              Our Expertise
            </h1>

            <div className="flex flex-col sm:flex-row items-center gap-4 text-white">
              <img
                src={assets.group_profiles}
                alt="Stylists"
                className="w-28 sm:w-32"
              />
              <p className="text-sm sm:text-base opacity-90">
                Discover our talented team of creative stylists and schedule
                your perfect hair transformation today.
              </p>
            </div>

            <a
              href="/stylists"
              className="inline-flex items-center gap-3 bg-white text-primary font-medium px-8 py-3 rounded-full hover:bg-opacity-90 transition-all"
            >
              Book Now
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>

          {/* ---------- RIGHT IMAGE ---------- */}
          <div className="w-full lg:w-1/2 relative">

            {/* MOBILE → NO IMAGE */}
            <div className="block sm:hidden"></div>

            {/* TABLET & LAPTOP/DESKTOP → FULL UNCROPPED IMAGE */}
            <div className="hidden sm:block relative rounded-xl overflow-hidden">
              <img
                src={assets.banner_img}
                alt="Salon Banner"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

        </div>

        


      </div>
    </section>
  )
}

export default Header
