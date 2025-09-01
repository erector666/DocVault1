import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NebulaBackground from './NebulaBackground';

const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [logoScale, setLogoScale] = useState(0);
  const [textOpacity, setTextOpacity] = useState(0);

  useEffect(() => {
    // Animate logo entrance
    setTimeout(() => setLogoScale(1), 200);
    
    // Animate text entrance
    setTimeout(() => setTextOpacity(1), 800);
    
    // Auto-navigate after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => navigate('/login'), 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <NebulaBackground />
      
      <div className="text-center relative z-10">
        {/* Logo with scale animation */}
        <div 
          className="mb-8 transition-transform duration-1000 ease-out"
          style={{ transform: `scale(${logoScale})` }}
        >
          <img 
            src="/logo2.png" 
            alt="DocVault Logo" 
            className="mx-auto h-32 w-auto rounded-full shadow-2xl"
          />
        </div>
        
        {/* App Title with fade-in animation */}
        <h1 
          className="text-6xl font-bold text-white mb-4 transition-opacity duration-1000 ease-out"
          style={{ opacity: textOpacity }}
        >
          DocVault
        </h1>
        
        {/* Subtitle with fade-in animation */}
        <p 
          className="text-xl text-blue-300 mb-8 transition-opacity duration-1000 ease-out delay-300"
          style={{ opacity: textOpacity }}
        >
          AI-Powered Document Management
        </p>
        
        {/* Loading indicator */}
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
        
        {/* Tagline */}
        <p 
          className="text-sm text-gray-400 mt-8 transition-opacity duration-1000 ease-out delay-500"
          style={{ opacity: textOpacity }}
        >
          Secure • Intelligent • Seamless
        </p>
      </div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SplashScreen;
