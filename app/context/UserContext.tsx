import React, { createContext, useContext } from 'react';

const UserContext = createContext<string | null>(null);

export const UserProvider: React.FC<{ userId: string | null; children: React.ReactNode }> = ({ userId, children }) => {
  return (
    <UserContext.Provider value={userId}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserId = () => {
  return useContext(UserContext);
};
