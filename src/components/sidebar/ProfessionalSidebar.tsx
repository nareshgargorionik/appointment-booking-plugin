import { useDispatch, useSelector } from "react-redux";
import { ChevronRight, Clock3, X } from "lucide-react";
import { CurrencyIcon, getUserName } from "@/utils";
import { Staff, Step, Service, OutletRootState } from "@/types";
import type { AppDispatch } from "@/store";
import { setSidebarOpen } from "@/slices/themeSlice";


interface SelectedStaffService extends Service {
  qty: number;
  duration?: number;
  tax?: number;
}

interface ProfessionalSidebarProps {
  pro: Staff | null;
  selectedStaffServices?: SelectedStaffService[];
  totalPrice?: number;
  totalDuration?: number;
  goToStep: (step: Step) => void;
}

const ProfessionalSidebar = ({
  pro,
  selectedStaffServices = [],
  totalPrice = 0,
  totalDuration = 0,
  goToStep,
}: ProfessionalSidebarProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const { outletName, isService } = useSelector(
    (state: OutletRootState) => state.booking.outletDetails,
  );
  const { selectedServices } = useSelector(
    (state: OutletRootState) => state.booking.service,
  );

  return (
    <div className="aaravpos-order-sidebar">
      <div className="aaravpos-order-header">
        <p className="aaravpos-order-title">
          Your Order
        </p>
        <p className="aaravpos-order-subtitle">
          {outletName || "-"} Outlet
        </p>
        <button className="aaravpos-sidebar-close-btn" onClick={() => dispatch(setSidebarOpen(false))}>
          <X size={18} />
        </button>
      </div>
      <div className="aaravpos-order-sidebar">
        <div className="aaravpos-order-body">
          {pro?.id && (
            <>
              <p className="aaravpos-order-section-title" style={{ marginBottom: 8 }}>
                Selected Professional
              </p>
              <div className="aaravpos-pro-card aaravpos-display-flex aaravpos-mb-10 aaravpos-tp-10">
                {pro.imageUrl ? (
                  <img
                    src={pro.imageUrl}
                    alt={pro.name}
                    className="aaravpos-pro-image"
                  />
                ) : (
                  <div
                    className="aaravpos-pro-avatar"
                    style={{
                      background: pro.color || "#111",
                    }}
                  >
                    {getUserName(pro.name)}
                  </div>
                )}
                <div className="aaravpos-pro-info">
                  <p className="aaravpos-pro-name">
                    {pro.name}
                  </p>
                  <p className="aaravpos-pro-type">
                    {pro.staff_type}
                  </p>
                </div>
              </div>
            </>
          )}
          <p className="aaravpos-order-section-title">
            Selected Services
          </p>
          <ul className={!isService ? "aaravpos-pro-order-list-pro" : isService && pro?.id ? "aaravpos-pro-order-list" : "aaravpos-pro-order-list-single"}>
            {selectedStaffServices?.length > 0 ?
              <>
                {selectedStaffServices.map((svc) => (
                  <li
                    key={svc.id}
                    className="aaravpos-order-item"
                  >
                    <div className="aaravpos-main-text">
                      <p className="aaravpos-order-service-name">
                        {svc.name}
                      </p>
                    </div>
                    <div className="aaravpos-order-details">
                      <div className="aaravpos-order-detail">
                      </div>
                      {/* Duration */}
                      <div className="aaravpos-order-detail center">
                        <Clock3 size={13} />
                        <span>{svc.min_time || svc.estimated_time} min</span>
                      </div>
                      <p className="aaravpos-order-detail right">
                        <CurrencyIcon size={12} />
                        {svc.price || svc.min_price}
                      </p>
                    </div>
                  </li>
                ))}
              </> :
              <>
                {selectedServices?.length > 0 && selectedServices?.map((svc) => (
                  <li
                    key={svc.id}
                    className="aaravpos-order-item"
                  >
                    <div className="aaravpos-main-text">
                      <p className="aaravpos-order-service-name">
                        {svc.name}
                      </p>
                    </div>
                    <div className="aaravpos-order-details">
                      <div className="aaravpos-order-detail">
                      </div>
                      <div className="aaravpos-order-detail center">
                        <Clock3 size={13} />
                        <span>{svc.min_time || svc.estimated_time} min</span>
                      </div>
                      <p className="aaravpos-order-detail right">
                        <CurrencyIcon size={12} />
                        {svc.price || svc.min_price}
                      </p>
                    </div>
                  </li>
                ))}
              </>}
          </ul>
        </div>
        {<>
          <div className="aaravpos-divider" />
          <div className="aaravpos-order-footer">
            {isService && pro?.id && <>
              <div className="aaravpos-order-subtotal">
                <span className="aaravpos-order-subtotal-label">
                  Subtotal
                </span>
                <span className="aaravpos-order-subtotal-price">
                  <CurrencyIcon size={16} />
                  {totalPrice}
                </span>
              </div>
              <div className="aaravpos-order-subtotal">
                <span className="aaravpos-order-subtotal-label">
                  Duration
                </span>
                <span className="aaravpos-order-subtotal-price">
                  {totalDuration} min
                </span>
              </div>
            </>}
            <button
              disabled={isService ? !selectedStaffServices.length : !pro}
              onClick={() => goToStep("time")}
              className="aaravpos-common-btn"
            >
              <span className="aaravpos-common-btn-content">
                {isService ? "Choose Time" : "Choose Services"}
                <ChevronRight size={16} />
              </span>
            </button>
          </div>
        </>}
      </div>
    </div >
  );
};

export default ProfessionalSidebar;
