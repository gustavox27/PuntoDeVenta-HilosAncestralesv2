import React, { createContext, useContext, ReactNode } from 'react';
import { Usuario } from '../types';

interface UserContextType {
  currentUser: Usuario | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  currentUser: Usuario | null;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children, currentUser }) => {
  return (
    <UserContext.Provider value={{ currentUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
