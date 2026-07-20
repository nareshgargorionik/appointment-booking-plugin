import { useDispatch, useSelector } from "react-redux";
import {
  CircleCheck,
  ChevronLeft,
  Scissors,
  User,
  Clock3,
  CheckCircle2,
  ShoppingCart,
  Info
} from "lucide-react";
import { goToStep, resetCompletedStepsFrom } from "@/slices/breadcrumbSlice";
import { persistor } from "@/store";
import { useWindowSize } from "@/hooks/useWindowSize";
import { StepItem } from "@/types";
import type { RootState, AppDispatch } from "@/store";
import { clearBooking } from "@/slices/outletSlice";
import { clearSlots } from "@/slices/slotSlice";
import { clearSelectedServices, clearSelectedProfessional } from "@/slices/serviceSlice";
import { resetAppointment } from "@/slices/appointmentSlice";
import { setSidebarOpen } from "@/slices/themeSlice";

type StepPage =
  | "services"
  | "professionals"
  | "time"
  | "details"
  | "confirm";

const SERVICE_RESET_MAP = {
  services: [clearSelectedProfessional, clearSlots, resetAppointment],
  professionals: [clearSelectedProfessional, clearSlots, resetAppointment],
  time: [clearSlots, resetAppointment],
  details: [],
  confirm: [],
};

const NORMAL_RESET_MAP = {
  professionals: [clearSlots, clearSelectedServices, resetAppointment],
  services: [clearSelectedServices, clearSlots, resetAppointment],
  time: [clearSlots, resetAppointment],
  details: [],
  confirm: [],
};

const SERVICE_STEPS: StepItem[] = [
  {
    label: "Services",
    page: "services",
    icon: <Scissors size={16} />,
  },
  {
    label: "Professional",
    page: "professionals",
    icon: <User size={16} />,
  },
  {
    label: "Time Slot",
    page: "time",
    icon: <Clock3 size={16} />,
  },
  {
    label: "Details",
    page: "details",
    icon: <Info size={16} />,
  },
  {
    label: "Confirmation",
    page: "confirm",
    icon: <CheckCircle2 size={16} />,
  },
];
const STEPS: StepItem[] = [
  {
    label: "Professional",
    page: "professionals",
    icon: <User size={16} />,
  },
  {
    label: "Service",
    page: "services",
    icon: <Scissors size={16} />,
  },
  {
    label: "Time",
    page: "time",
    icon: <Clock3 size={16} />,
  },
  // {
  //   label: "Details",
  //   page: "details",
  //   icon: <Info size={16} />,
  // },
  {
    label: (
      <span className="flex items-center gap-1">
        Done <CircleCheck size={13} />
      </span>
    ),
    page: "confirm",
    icon: <CheckCircle2 size={16} />,
  },
];

export default function Breadcrumb() {
  const dispatch = useDispatch<AppDispatch>();
  const { width } = useWindowSize();
  const { isOpenSidebar } = useSelector((state: any) => state.booking.theme);
  const { isService } = useSelector((state: RootState) => state.booking.outletDetails);
  const { selectedServices } = useSelector((state: any) => state.booking.service);
  const outlets = useSelector((state: RootState) => state.booking.outletList.outlets);
  const { currentStep, completedSteps } = useSelector(
    (state: RootState) => state.booking.breadcrumbs,
  );
  const resetMap = isService ? SERVICE_RESET_MAP : NORMAL_RESET_MAP;
  const steps = isService ? SERVICE_STEPS : STEPS;
  const currentIndex = steps.findIndex((s) => s.page === currentStep);

  const clearAllData = () => {
    persistor.purge();
    dispatch({ type: "RESET_ALL" });
  };

  const handlePrevNavigation = (): void => {
    if (currentIndex === 0 && outlets.length > 1) {
      clearAllData();
      dispatch(clearBooking());
      return;
    }

    if (currentIndex <= 0) return;

    const prevStep = steps[currentIndex - 1];
    const targetStep = prevStep.page as StepPage;

    resetMap[targetStep]?.forEach((action) => {
      dispatch(action());
    });

    dispatch(resetCompletedStepsFrom(targetStep));
    dispatch(goToStep(targetStep));
  };

  const goToPrev = handlePrevNavigation;
  const goToOutletsPrev = handlePrevNavigation;

  const currentStepData = steps[currentIndex];

  const isMobile = width < 991;

  const totalQty = selectedServices?.length || 0;
  const hasMultipleOutlets = Array.isArray(outlets) && outlets.length > 1;

  return (
    <>
      {isMobile ? (
        <div className="aaravpos-mobile-stepper">
          <button
            onClick={goToPrev}
            className="aaravpos-mobile-back-btn"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="aaravpos-mobile-step-label">
            {currentStepData?.label}
          </span>
        </div>
      ) : (
        <div className="aaravpos-desktop-stepper">
          <button onClick={hasMultipleOutlets ? goToOutletsPrev : goToPrev} className="aaravpos-desktop-back-btn">
            <ChevronLeft size={20} />
          </button>
          <nav className="aaravpos-step-nav">
            {steps.map((step: any, i: number) => {
              const isActive = currentStep === step.page;
              const isCompleted = completedSteps?.includes(step.page);
              const isClickable = isCompleted || i <= currentIndex;
              return (
                <button
                  key={step.page}
                  onClick={() => {
                    if (!isClickable) return;
                    const targetStep = step.page as StepPage;
                    const targetIndex = steps.findIndex((s) => s.page === targetStep);
                    if (targetIndex < currentIndex) {
                      resetMap[targetStep]?.forEach((action) => { dispatch(action()) });
                      dispatch(resetCompletedStepsFrom(targetStep));
                    }
                    dispatch(
                      goToStep(targetStep)
                    );
                  }}
                  className={`aaravpos-step-btn ${isClickable ? "clickable" : "disabled"} ${isActive ? "active" : "inactive"}`}
                >
                  <span className={`aaravpos-step-icon ${isActive ? "active" : "inactive"}`}>
                    {step.icon}
                  </span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </nav>
          {!isOpenSidebar && (
            <button
              className="aaravpos-cart-btn"
              onClick={() => dispatch(setSidebarOpen(true))}
            >
              <span className="aaravpos-count">
                {totalQty}
              </span>
              <ShoppingCart size={18} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
