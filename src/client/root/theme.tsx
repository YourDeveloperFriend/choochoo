import React, { createContext, useState, useContext, ReactNode } from "react";

const ThemeContext = createContext<{
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}>({ isDarkMode: false, toggleDarkMode: () => {} });

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const prefersDarkMode =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const localStoragePreference = window.localStorage.getItem("mui-mode");

  let initialState: boolean;
  if (localStoragePreference) {
    initialState = localStoragePreference === "dark";
  } else {
    initialState = prefersDarkMode;
  }
  const [isDarkMode, setIsDarkMode] = useState(initialState);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    window.localStorage.setItem("mui-mode", !isDarkMode ? "dark" : "light");
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
