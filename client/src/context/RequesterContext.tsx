import React, { createContext, useContext, useState } from "react";
import { Requester } from "../api";

interface RequesterContextType {
  selectedRequester: Requester | null;
  setSelectedRequester: (requester: Requester | null) => void;
  clearRequester: () => void;
}

const STORAGE_KEY = "toktickit_selected_requester";

const RequesterContext = createContext<RequesterContextType | undefined>(undefined);

export const RequesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRequester, setSelectedRequesterState] = useState<Requester | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null; 
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const setSelectedRequester = (requester: Requester | null) => {
    setSelectedRequesterState(requester);
    if (requester) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requester));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearRequester = () => {
    setSelectedRequester(null);
  };

  return (
    <RequesterContext.Provider value={{ selectedRequester, setSelectedRequester, clearRequester }}>
      {children}
    </RequesterContext.Provider>
  );
};

export const useRequester = () => {
  const context = useContext(RequesterContext);
  if (!context) {
    throw new Error("useRequester must be used within a RequesterProvider");
  }
  return context;
};