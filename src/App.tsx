import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';
import SplashScreen from './components/common/SplashScreen';

// Contexts
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { SupabaseAuthProvider } from './context/SupabaseAuthContext';
import { UploadModalProvider } from './context/UploadModalContext';

// Routes
import AppRoutes from './routes';

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after 3.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <SupabaseAuthProvider>
            <UploadModalProvider>
              <Router>
                <div className="App">
                  {showSplash ? <SplashScreen /> : <AppRoutes />}
                </div>
              </Router>
            </UploadModalProvider>
          </SupabaseAuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
