import React, {createContext, useState, useContext, ReactNode} from 'react';
import {useMediaQuery} from "@mui/material";

const ThemeContext = createContext<{isDarkMode: boolean, toggleDarkMode: () => void}>(
    {isDarkMode: false, toggleDarkMode: () => {}}
);

export const ThemeProvider = ({ children }: {children: ReactNode}) => {
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const [isDarkMode, setIsDarkMode] = useState(prefersDarkMode);

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
