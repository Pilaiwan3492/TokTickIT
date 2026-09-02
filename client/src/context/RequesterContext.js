import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState } from "react";
const STORAGE_KEY = "toktickit_selected_requester";
const RequesterContext = createContext(undefined);
export const RequesterProvider = ({ children }) => {
    const [selectedRequester, setSelectedRequesterState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved)
            return null;
        try {
            return JSON.parse(saved);
        }
        catch {
            return null;
        }
    });
    const setSelectedRequester = (requester) => {
        setSelectedRequesterState(requester);
        if (requester) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(requester));
        }
        else {
            localStorage.removeItem(STORAGE_KEY);
        }
    };
    const clearRequester = () => {
        setSelectedRequester(null);
    };
    return (_jsx(RequesterContext.Provider, { value: { selectedRequester, setSelectedRequester, clearRequester }, children: children }));
};
export const useRequester = () => {
    const context = useContext(RequesterContext);
    if (!context) {
        throw new Error("useRequester must be used within a RequesterProvider");
    }
    return context;
};
