import React, { useContext, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { AdminContext } from '../../context/AdminContext'
import { useNavigate, useParams } from 'react-router-dom'
import { LogOut, User, Menu, X, Scissors } from 'lucide-react'

const AdminNavbar = ({ shopSlug: shopSlugProp }) => {
  const { dToken, setDToken } = useContext(DoctorContext)
  const { aToken, setAToken } = useContext(AdminContext)
  const navigate = useNavigate()
  const params = useParams()
  const slug = shopSlugProp || params.shopSlug || ''

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const logout = () => {
    dToken && setDToken('')
    dToken && localStorage.removeItem('dToken')
    aToken && setAToken('')
    aToken && localStorage.removeItem('aToken')
    setMobileMenuOpen(false)
    navigate(slug ? `/${slug}/admin` : '/')
  }

  const shopDisplayName = slug
    ? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Admin'

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex justify-between items-center px-4 sm:px-8 py-3">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-500 hover:text-primary"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
              <Scissors size={16} className="text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-800 hidden sm:block text-sm leading-none">
                {shopDisplayName}
              </h1>
              <p className="text-xs text-gray-400">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-gray-200">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={18} className="text-primary" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-800">Salon Admin</p>
              <p className="text-xs text-gray-400">{aToken ? 'Administrator' : 'Stylist'}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="bg-primary hover:bg-primary/90 text-white text-sm px-4 sm:px-5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminNavbar
