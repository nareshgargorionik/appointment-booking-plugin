import { createSlice } from "@reduxjs/toolkit";
import { Step, BreadcrumbState } from "@/types";

// "details",
const getStepsOrder = (isOrder: boolean): Step[] => {
    if (isOrder) {
        return ["services", "professionals", "time", "confirm", "success"];
    }
    return ["professionals", "services", "time", "confirm", "success",];
};

export const initialState: BreadcrumbState = {
    currentStep: "services",
    completedSteps: ["services"],
    isOrder: true,
};

const breadcrumbsSlice = createSlice({
    name: "breadcrumbs",
    initialState,
    reducers: {
        setIsOrder: (state, action) => {
            state.isOrder = action.payload;
        },
        goToStep: (state, action) => {
            const steps = getStepsOrder(state.isOrder);
            const nextStep = action.payload;
            const currentIndex = steps.indexOf(state.currentStep);
            const nextIndex = steps.indexOf(nextStep);
            if (nextIndex <= currentIndex) {
                state.currentStep = nextStep;
                return;
            }
            const prevStep = steps[nextIndex - 1];
            if (state.completedSteps.includes(prevStep)) {
                state.currentStep = nextStep;
            }
        },
        completeStep: (state, action) => {
            const step = action.payload;
            if (!state.completedSteps.includes(step)) {
                state.completedSteps.push(step);
            }
        },
        nextStep: (state) => {
            const steps = getStepsOrder(state.isOrder);
            const currentIndex = steps.indexOf(state.currentStep as Step);
            const next = steps[currentIndex + 1] as Step | undefined;
            if (next) {
                if (!state.completedSteps.includes(state.currentStep as Step)) {
                    state.completedSteps.push(state.currentStep as Step);
                }
                state.currentStep = next;
            }
        },
        prevStep: (state) => {
            const steps = getStepsOrder(state.isOrder);
            const currentIndex = steps.indexOf(state.currentStep as Step);
            const prev = steps[currentIndex - 1] as Step | undefined;
            if (prev) {
                state.currentStep = prev;
            }
        },
        clearSteps: (state) => {
            state.currentStep = "services";
            state.completedSteps = ["services"];
        },
        resetCompletedStepsFrom: (state, action) => {
            const targetStep = action.payload as Step;
            const steps = getStepsOrder(state.isOrder);
            const targetIndex = steps.indexOf(targetStep);
            state.completedSteps = state.completedSteps.filter((step: any) => {
                return (steps.indexOf(step) <= targetIndex);
            });
        },
    },
});

export const {
    setIsOrder,
    goToStep,
    completeStep,
    nextStep,
    prevStep,
    clearSteps,
    resetCompletedStepsFrom
} = breadcrumbsSlice.actions;


export default breadcrumbsSlice.reducer;