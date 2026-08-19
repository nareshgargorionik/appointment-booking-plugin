import { ComponentType, JSX, } from "react";
import { useSelector, } from "react-redux";
import { ToastContainer } from "react-toastify";
import ProfessionalServicePage from "@/components/steps/ProfessionalServicePage";
import Professionals from "@/components/steps/Professionals";
import ServiceProfessionalPage from "@/components/steps/ServiceProfessionalPage";
import ServicesPage from "@/components/steps/ServicesPage";
import TimePage from "@/components/steps/TimePage";
import ConfirmPage from "@/components/steps/ConfirmPage";
// import DetailsPage from "@/components/steps/DetailsPage";
import SuccessPage from "@/components/steps/SuccessPage";
import { RootState } from "@/store"; // adjust path as needed
import { StepKey, PageMap } from "@/types";

function AppContent(): JSX.Element {
  const { currentStep } = useSelector(
    (state: RootState) => state.booking.breadcrumbs
  );
  const { isService } = useSelector(
    (state: RootState) => state.booking.outletDetails
  );

  const PAGE_MAP: PageMap = {
    services: isService ? ServicesPage : ServiceProfessionalPage,
    professionals: isService ? Professionals : ProfessionalServicePage,
    time: TimePage,
    // details: DetailsPage,
    confirm: ConfirmPage,
    success: SuccessPage,
  };

  const PageComponent: ComponentType =
    PAGE_MAP[currentStep as StepKey];

  return (
    <div className="aaravpos-layout">
      <div className="aaravpos-layout-content">
        <div key={currentStep} className="aaravpos-layout-page">
          <PageComponent />
        </div>
      </div>
    </div>
  );
}

export default function DefaultAppointment(): JSX.Element {
  return (
    <>
      <AppContent />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}