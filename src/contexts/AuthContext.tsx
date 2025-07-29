import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Проверяем сохраненную сессию при загрузке
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const register = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[username]) {
      return { success: false, message: 'Пользователь с таким именем уже существует. Задайте другое имя.' };
    }
    
    users[username] = { password };
    localStorage.setItem('users', JSON.stringify(users));
    
    const newUser = { username };
    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    return { success: true };
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (!users[username]) {
      return { success: false, message: 'Пользователь не найден.' };
    }
    
    if (users[username].password !== password) {
      return { success: false, message: 'Неверный пароль.' };
    }
    
    const loggedUser = { username };
    setUser(loggedUser);
    localStorage.setItem('currentUser', JSON.stringify(loggedUser));
    
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
