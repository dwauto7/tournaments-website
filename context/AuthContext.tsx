
import React, { createContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { login as apiLogin, logout as apiLogout, getLoggedInUser } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getLoggedInUser();
        setUser(currentUser);
      } catch (error) {
        console.error("No user logged in");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async () => {
    setLoading(true);
    try {
      const loggedInUser = await apiLogin();
      setUser(loggedInUser);
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
