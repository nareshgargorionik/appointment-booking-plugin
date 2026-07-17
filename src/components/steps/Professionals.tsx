import { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getUserName, calculateServiceTax, CurrencyIcon } from "@/utils";
import { setSelectedDate } from "@/slices/slotSlice";
import { nextStep } from "@/slices/breadcrumbSlice";
import { toggleProfessional, toggleAdditionalService } from "@/slices/serviceSlice";
import { setSidebarOpen } from "@/slices/themeSlice";
import MainLayout from "@/components/common/MainLayout";
import ProfessionalSidebar from "@/components/sidebar/ProfessionalSidebar";
import Breadcrumb from "@/components/common/Breadcrumb";
import ProfessionalSkeletonCard from "@/components/common/ProfessionalSkeletonCard";
import { useWindowSize } from "@/hooks/useWindowSize";
import { ChevronRight } from "lucide-react";
import { ServiceItem } from "@/types";

export default function Professionals() {
  const { width } = useWindowSize();
  const dispatch = useDispatch();
  const { staff, selectedServices, selectedProfessional, superCategories, loading } = useSelector(
    (state: any) => state.booking.service,
  );
  const [showEmpty, setShowEmpty] = useState<boolean>(false);
  const isMobile = width < 768;

  const selectedServiceIds = selectedServices.map((s: ServiceItem) => s.id);
  const hasServicesSelected = selectedServices.length > 0;

  // Filter professionals that perform all selected services (for initial empty state check only)
  const filteredStaff = useMemo(() => {
    if (!selectedServiceIds.length) return [];
    return staff.filter((member: any) =>
      selectedServiceIds.every((serviceId: any) =>
        member.assignments?.some((a: any) => String(a.id) === String(serviceId) && Boolean(a.assigned))
      )
    );
  }, [staff, selectedServiceIds]);

  useEffect(() => {
    if (!loading && hasServicesSelected && filteredStaff.length === 0) {
      const t = setTimeout(() => setShowEmpty(true), 300);
      return () => clearTimeout(t);
    } else {
      setShowEmpty(false);
    }
  }, [loading, hasServicesSelected, filteredStaff]);

  const getLeaveInfo = (professional: any) => {
    if (!professional?.futureLeaveDates?.length) {
      return {
        isOnLeave: false,
        availableFrom: null,
      };
    }
    const today = new Date();
    const activeLeave = professional.futureLeaveDates.find((leave: any) => {
      if (leave.status !== "APPROVED" || leave.leaveType !== "FULL_DAY")
        return false;
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      return today >= startDate && today <= endDate;
    });
    if (!activeLeave?.returnDate?.date) {
      return {
        isOnLeave: false,
        availableFrom: null,
      };
    }
    const formattedAvailableDate = new Date(
      activeLeave.returnDate.date,
    ).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return {
      isOnLeave: true,
      availableFrom: formattedAvailableDate,
    };
  };

  // Find all services in the outlet
  const allServices = useMemo(() => {
    return (
      superCategories?.flatMap((superCat: any) =>
        superCat?.categories?.flatMap((cat: any) => cat.services || []),
      ) || []
    );
  }, [superCategories]);

  // Find assigned services of the selected professional (addon services list)
  const remainingServices = useMemo(() => {
    if (!selectedProfessional) return [];
    const assignments = selectedProfessional.assignments ?? [];
    const activeAssignments = assignments.filter((a: any) => a.assigned);
    const assignedServiceIds = activeAssignments.map((a: any) => String(a.id));
    const primaryServiceId = String(selectedServices[0]?.id);

    return allServices
      .filter(
        (svc: any) =>
          assignedServiceIds.includes(String(svc.id)) &&
          String(svc.id) !== primaryServiceId
      )
      .map((svc: any) => {
        const assignment = activeAssignments.find((a: any) => String(a.id) === String(svc.id));
        return {
          ...svc,
          price: assignment?.price || svc.price || svc.min_price || 0,
          duration: assignment?.duration || svc.estimated_time || svc.min_time || 0,
        };
      });
  }, [allServices, selectedProfessional, selectedServices]);

  // Calculate selectedStaffServices, totalPrice and totalDuration for selectedProfessional to pass to sidebar
  const selectedStaffServices = useMemo(() => {
    if (!selectedProfessional?.id) return [];

    const staffMember = staff?.find((s: any) => s.id === selectedProfessional.id);
    if (!staffMember) return [];

    return selectedServices.map((svc: any) => {
      const assignment = staffMember.assignments?.find(
        (a: any) => a.id === svc.id
      );
      const updatedSvc = {
        ...svc,
        price: assignment?.price || svc.price || svc.min_price || 0,
        duration:
          assignment?.duration || svc.estimated_time || svc.min_time || 0,
        qty: svc.qty || 1,
      };
      return {
        ...updatedSvc,
        tax: calculateServiceTax(updatedSvc),
      };
    });
  }, [selectedProfessional, staff, selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedStaffServices.reduce(
      (sum: number, s: any) => sum + Number(s.price || s.min_price || 0) * s.qty,
      0
    );
  }, [selectedStaffServices]);

  const totalDuration = useMemo(() => {
    return selectedStaffServices.reduce(
      (sum: number, s: any) => sum + (s?.duration || 0) * s.qty,
      0
    );
  }, [selectedStaffServices]);

  // Check if a professional is disabled because they do not work on all selected services
  const isProfessionalDisabled = (p: any) => {
    if (!selectedServices || selectedServices.length === 0) return false;
    const assignments = p.assignments ?? [];
    return !selectedServices.every((svc: any) =>
      assignments.some(
        (a: any) => String(a.id) === String(svc.id) && Boolean(a.assigned)
      )
    );
  };

  return (
    <MainLayout
      sidebar={
        <ProfessionalSidebar
          pro={selectedProfessional}
          selectedStaffServices={selectedStaffServices}
          totalPrice={totalPrice}
          totalDuration={totalDuration}
          goToStep={() => dispatch(nextStep())}
        />
      }
      renderButton={
        isMobile && selectedProfessional ? (
          <button
            onClick={() => dispatch(nextStep())}
            disabled={!selectedServices.length}
            className="aaravpos-btn"
          >
            <span className="aaravpos-btn-content">
              Choose Time <ChevronRight size={16} />
            </span>
          </button>

          // <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4 z-50">
          //   <button
          //     onClick={() => dispatch(nextStep())}
          //     className="flex items-center justify-between bg-[var(--btn-bg)] text-white hover:bg-[var(--btn-bg-hover)] w-full max-w-[280px] p-3 px-6 rounded-full font-bold uppercase transition-all shadow-lg cursor-pointer text-xs tracking-wider border-none"
          //   >
          //     <span>{selectedServices.length} {selectedServices.length === 1 ? "Service" : "Services"} Selected</span>
          //     <span className="flex items-center gap-1 font-semibold ml-auto">
          //       Next
          //     </span>
          //   </button>
          // </div>
        ) : null
      }
    >
      <Breadcrumb />
      <div className="aaravpos-margin-top-20">
        <h1 className="aaravpos-page-title">
          Choose a Professional
        </h1>
        <p className="aaravpos-page-subtitle">
          Available based on selected services
        </p>

        {showEmpty && (
          <div className="aaravpos-empty-services">
            <h3 className="aaravpos-empty-services-title">
              No staff Found
            </h3>
            <p className="aaravpos-empty-services-text">
              No staff available for selected services
            </p>
          </div>
        )}

        <div className="aaravpos-staff-wrapper">
          <div className="aaravpos-staff-grid">
            {loading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <ProfessionalSkeletonCard key={`skeleton-${index}`} />
              ))
            ) : (
              staff?.map((p: any) => {
                const { isOnLeave, availableFrom } = getLeaveInfo(p);
                const isDisabled = isProfessionalDisabled(p);
                const isSelected = selectedProfessional?.id === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (isDisabled) return;
                      dispatch(toggleProfessional(p));
                      dispatch(setSelectedDate(null));
                      if (!isMobile) {
                        dispatch(setSidebarOpen(true));
                      }
                    }}
                    className={`booking-pro-card ${isDisabled ? "disabled" : isSelected ? "active" : ""}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                      {/* Avatar */}
                      <div className="relative shrink-0 flex items-center justify-center">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="booking-pro-avatar-img"
                          />
                        ) : (
                          <div
                            className="booking-pro-avatar-circle"
                            style={{ background: p.color || "#111", }}
                          >
                            {getUserName(p.name)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="booking-pro-info">
                        <p className="booking-pro-name">{p.name}</p>
                        <p className="booking-pro-role">{p.staff_type}</p>
                      </div>
                    </div>

                    {/* Leave Message */}
                    {isOnLeave && availableFrom && (
                      <div className="booking-pro-leave">
                        <span className="booking-pro-leave-dot" />
                        <p className="booking-pro-leave-text">
                          Available from {availableFrom}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add-on Services Section */}
          {selectedProfessional && remainingServices.length > 0 && (
            <div className="booking-addon-title-section">
              <h2 className="booking-addon-heading">
                Anything you wish to add?
              </h2>
              <p className="booking-addon-subheading">
                Add more services performed by <span>{selectedProfessional?.name || ""}</span>
              </p>
              <div className="booking-addon-grid">
                {remainingServices.map((svc: any) => {
                  const isSelected = selectedServices.some((s: any) => s.id === svc.id);
                  return (
                    <div
                      key={svc.id}
                      onClick={() => {
                        dispatch(toggleAdditionalService(svc));
                      }}
                      className={`booking-addon-card ${isSelected ? "active" : ""}`}
                    >

                      <div>
                        <p className="booking-addon-name">
                          {svc.name}
                        </p>
                        {svc.description && (
                          <p className="booking-addon-desc">
                            {svc.description}
                          </p>
                        )}
                      </div>
                      <div className="booking-addon-footer">
                        <span className="booking-addon-duration">
                          {svc.duration
                            ? `${svc.duration} min`
                            : svc.estimated_time
                              ? `${svc.estimated_time} min`
                              : svc.min_time
                                ? `${svc.min_time} min`
                                : ""}
                        </span>
                        <span className="booking-addon-price">
                          <CurrencyIcon size={12} />
                          {svc.price || svc.min_price || 0}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

