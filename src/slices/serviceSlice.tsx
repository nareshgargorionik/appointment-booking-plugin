import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ServiceState, Category, Staff } from "@/types";

const initialState: ServiceState = {
  superCategories: [],
  staff: [],
  selectedCategory: null,
  selectedServices: [],
  selectedProfessional: null,
  loading: true,
};

const serviceSlice = createSlice({
  name: "service",
  initialState,
  reducers: {
    setServicePayload: (
      state,
      action: PayloadAction<{
        superCategories: Category[];
        staff: Staff[];
      }>
    ) => {
      state.superCategories = action.payload.superCategories;
      state.staff = action.payload.staff;
      state.loading = false;
    },
    setServiceLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCategory: (state, action: PayloadAction<Category | null>) => {
      state.selectedCategory = action.payload;
    },
    toggleService: (state, action) => {
      const isSelected = state.selectedServices.some(
        (s) => s.id === action.payload.id
      );

      if (isSelected) {
        state.selectedServices = [];
      } else {
        state.selectedServices = [
          {
            ...action.payload,
            qty: 1,
          },
        ];
      }
    },

    toggleAdditionalService: (state, action) => {
      const existingIndex = state.selectedServices.findIndex(
        (s) => s.id === action.payload.id
      );

      if (existingIndex > -1) {
        state.selectedServices.splice(existingIndex, 1);
      } else {
        state.selectedServices.push({
          ...action.payload,
          qty: 1,
        });
      }
    },
    toggleProfessional: (state, action) => {
      state.selectedProfessional = action.payload;
    },
    clearSelectedServices: (state) => {
      state.selectedServices = [];
    },
    clearSelectedProfessional: (state) => {
      state.selectedProfessional = null;
    },
  },
});

export const {
  setServicePayload,
  setServiceLoading,
  setCategory,
  toggleService,
  toggleAdditionalService,
  clearSelectedServices,
  clearSelectedProfessional,
  toggleProfessional,
} = serviceSlice.actions;

export default serviceSlice.reducer;