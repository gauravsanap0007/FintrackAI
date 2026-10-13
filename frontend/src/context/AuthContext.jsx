import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fintrack_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [tokens, setTokens] = useState(() => {
    const saved = localStorage.getItem('fintrack_tokens');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (tokens?.access) {
        try {
          const freshUser = await authApi.getProfile();
          setUser(freshUser);
          localStorage.setItem('fintrack_user', JSON.stringify(freshUser));
        } catch {
          // Token expired or invalid
          setUser(null);
          setTokens(null);
          localStorage.removeItem('fintrack_tokens');
          localStorage.removeItem('fintrack_user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setUser(data.user);
    setTokens(data.tokens);
    localStorage.setItem('fintrack_tokens', JSON.stringify(data.tokens));
    localStorage.setItem('fintrack_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (email, username, password, passwordConfirm) => {
    const data = await authApi.register(email, username, password, passwordConfirm);
    setUser(data.user);
    setTokens(data.tokens);
    localStorage.setItem('fintrack_tokens', JSON.stringify(data.tokens));
    localStorage.setItem('fintrack_user', JSON.stringify(data.user));
    return data.user;
  };

  const logout = async () => {
    if (tokens?.refresh) {
      await authApi.logout(tokens.refresh);
    } else {
      authApi.logout(null);
    }
    setUser(null);
    setTokens(null);
  };

  const updateProfile = async (profileData) => {
    const updated = await authApi.updateProfile(profileData);
    setUser(updated);
    localStorage.setItem('fintrack_user', JSON.stringify(updated));
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user && !!tokens?.access,
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
