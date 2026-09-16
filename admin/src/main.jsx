import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import AdminContextProvider from './context/AdminContext.jsx'
import DoctorContextProvider from './context/DoctorContext.jsx'
import AppContextProvider from './context/AppContext.jsx'
import SlotManagementContextProvider from './context/SlotManagementContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
 <BrowserRouter>
  <AdminContextProvider>
    <DoctorContextProvider>
      <AppContextProvider>
        <SlotManagementContextProvider>
          <App />
        </SlotManagementContextProvider>
      </AppContextProvider>
    </DoctorContextProvider>
  </AdminContextProvider>
</BrowserRouter>,
)
