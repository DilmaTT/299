import { createRoot } from 'react-dom/client'
import { AuthProvider } from '@/contexts/AuthContext'
import { RangeProvider } from '@/contexts/RangeContext'
import App from './App.tsx'
import './index.css'
import React from 'react'; // Import React

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <RangeProvider>
        <App />
      </RangeProvider>
    </AuthProvider>
  </React.StrictMode>
);
