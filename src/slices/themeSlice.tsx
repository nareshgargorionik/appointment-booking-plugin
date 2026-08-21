import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ThemeSettings } from "@/types";

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
    isDarkMode: false
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
            }
        },
        setIsDarkMode: (state, action: PayloadAction<boolean>) => {
            state.isDarkMode = action.payload;
        },
        setSidebarOpen: (state, action) => {
            state.isOpenSidebar = action.payload;
        },
    },
});

export const { setTheme, setIsDarkMode, setSidebarOpen } = themeSlice.actions;

export default themeSlice.reducer;