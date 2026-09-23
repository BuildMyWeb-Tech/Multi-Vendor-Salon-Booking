import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

import SuperAdminContextProvider from './context/SuperAdminContext.jsx'
import SalonAdminContextProvider from './context/SalonAdminContext.jsx'
import AdminContextProvider from './context/AdminContext.jsx'
import DoctorContextProvider from './context/DoctorContext.jsx'
import AppContextProvider from './context/AppContext.jsx'
import ShopContextProvider from './context/ShopContext.jsx'
import SlotManagementContextProvider from './context/SlotManagementContext.jsx'
import StylistContextProvider from './context/StylistContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SuperAdminContextProvider>
        <SalonAdminContextProvider>
          <AdminContextProvider>
            <DoctorContextProvider>
              <AppContextProvider>
                <ShopContextProvider>
                  <SlotManagementContextProvider>
                    <StylistContextProvider>
                      <App />
                    </StylistContextProvider>
                  </SlotManagementContextProvider>
                </ShopContextProvider>
              </AppContextProvider>
            </DoctorContextProvider>
          </AdminContextProvider>
        </SalonAdminContextProvider>
      </SuperAdminContextProvider>
    </BrowserRouter>
  </React.StrictMode>
)
