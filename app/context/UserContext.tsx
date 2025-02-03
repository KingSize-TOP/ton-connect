import React, { createContext, useContext } from 'react';

const UserContext = createContext<{userId: string | null, action: string | null, amount: number | null, dest: string | null}>({userId: null, action: null, amount: null, dest: null});

export const UserProvider: React.FC<{ userId: string | null, action: string | null, amount: number | null, dest: string | null, children: React.ReactNode }> = ({ userId, action, amount, dest, children }) => {
  return (
    <UserContext.Provider value={{userId, action, amount, dest}}>
      {children}
    </UserContext.Provider>
  );
};

export const useWalletInfo = () => {
  return useContext(UserContext);
};
