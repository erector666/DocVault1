// DISABLED - Firebase AuthContext replaced with Supabase
// This file has been temporarily disabled during migration
// All auth functionality now uses SupabaseAuthContext

import React, { ReactNode } from 'react';

interface AuthContextType {
  currentUser: null;
  login: () => Promise<void>;
  register: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: () => Promise<void>;
  updateUserProfile: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  throw new Error('useAuth is disabled - use useSupabaseAuth instead');
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Disabled - just render children
  return <>{children}</>;
};
