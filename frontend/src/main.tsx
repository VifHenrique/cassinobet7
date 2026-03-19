import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a26',
            color: '#e2e8f0',
            border: '1px solid #2a2a3e',
            borderRadius: '12px',
            fontFamily: 'DM Sans, sans-serif',
          },
          success: { iconTheme: { primary: '#00c853', secondary: '#1a1a26' } },
          error: { iconTheme: { primary: '#ff1744', secondary: '#1a1a26' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
