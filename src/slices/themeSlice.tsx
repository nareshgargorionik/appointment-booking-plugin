import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ThemeSettings } from "@/types";

const getInitialDarkMode = (): boolean => {
    try {
        const saved = localStorage.getItem("isDarkMode");
        if (saved !== null) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error("Error reading isDarkMode from localStorage:", e);
    }
    return false;
};

const initialState: ThemeSettings = {
    button: {
        bg: '#d7263d',
        text: '#ffffff',
        bgHover: '#1f2937',
        textHover: '#ffffff',
    },
    colors: {
        bg: '#fafaf8',
        link: '#385b5a',
        text: '#e09898',
        bgHover: '#4c6f6e',
        textHover: '#ffffff',
    },
    isOpenSidebar: false,
    isDarkMode: getInitialDarkMode()
};

const themeSlice = createSlice({
    name: "theme",
    initialState,
    reducers: {
        setTheme: (state, action) => {
            if (action.payload?.button) state.button = action.payload.button;
            if (action.payload?.colors) state.colors = action.payload.colors;
            if (action.payload?.isDarkMode !== undefined) {
                state.isDarkMode = action.payload.isDarkMode;
                try {
                    localStorage.setItem("isDarkMode", JSON.stringify(action.payload.isDarkMode));
                } catch (e) {
                    console.error("Error writing isDarkMode to localStorage:", e);
                }
            }
        },
        setIsDarkMode: (state, action: PayloadAction<boolean>) => {
            state.isDarkMode = action.payload;
            try {
                localStorage.setItem("isDarkMode", JSON.stringify(action.payload));
            } catch (e) {
                console.error("Error writing isDarkMode to localStorage:", e);
            }
        },
        setSidebarOpen: (state, action) => {
            state.isOpenSidebar = action.payload;
        },
    },
});

export const { setTheme, setIsDarkMode, setSidebarOpen } = themeSlice.actions;

export default themeSlice.reducer;