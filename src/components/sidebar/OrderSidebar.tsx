import { useMemo, useRef, useState, useEffect, ReactNode, JSX } from "react";
import { useSelector } from "react-redux";
import { DateTime } from "luxon";
import { X, MoveRight, Clock3 } from "lucide-react";
import { CurrencyIcon, getUserName } from "@/utils";
import { calculateServiceTax } from "@/utils/taxHelper";
import type { OutletRootState, ServiceItem, StaffMember, Slot } from "@/types";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface ExtendedServiceItem extends ServiceItem {
  tax: number;
  unitTax: number;
}

interface OrderSidebarProps {
  buttonText?: string;
  onButtonClick: () => void;
  showTaxesOnlyIfTime?: boolean;
  showTip?: boolean;
  tipPct?: number;
  onTipChange?: (tip: number) => void;
  consentRequired?: boolean;
  consentCompleted?: number;
  totalConsents?: number;
  checkingConsent?: boolean;
  loading?: boolean;
  isBookingDisabled?: boolean;
  handleSidebarOpen?: () => void;
}

export default function OrderSidebar({
  buttonText,
  onButtonClick,
  showTaxesOnlyIfTime = false,
  showTip = false,
  tipPct = 0,
  onTipChange,
  consentRequired = false,
  consentCompleted = 0,
  totalConsents = 0,
  checkingConsent = false,
  loading = false,
  isBookingDisabled = false,
  handleSidebarOpen,
}: OrderSidebarProps): JSX.Element {

  const { selectedSlotIndexes, slots, selectedDate } = useSelector(
    (state: OutletRootState) => state.booking.slots,
  );

  const { staff, selectedServices, selectedProfessional } = useSelector(
    (state: OutletRootState) => state.booking.service,
  );
  const { timeZone } = useSelector(
    (state: OutletRootState) => state.booking.outletDetails,
  );
  const startDate = DateTime.now().setZone(timeZone ?? "UTC");
  const [customTip, setCustomTip] = useState<string>("");
  const [isCustomTip, setIsCustomTip] = useState<boolean>(false);
  const firstRef = useRef<HTMLDivElement | null>(null);
  const thirdRef = useRef<HTMLDivElement | null>(null);
  const [secondHeight, setSecondHeight] = useState<number>(0);
  const TIP_OPTIONS: number[] = [0, 5, 10, 15, 20];
  const allSlots = useMemo<Slot[]>(() => {
    return [
      ...(slots?.morning || []),
      ...(slots?.afternoon || []),
      ...(slots?.evening || []),
    ];
  }, [slots]);
  const SLOT_INTERVAL = 15;

  const selectedStaffServices = useMemo<ExtendedServiceItem[]>(() => {
    if (!selectedProfessional?.id) return [];
    const staffMember = staff?.find(
      (s: StaffMember) => s.id === selectedProfessional.id,
    );
    if (!staffMember) return [];
    return selectedServices.map((svc: any) => {
      const assignment = staffMember.assignments?.find((a) => a.id === svc.id);
      const updatedSvc = {
        ...svc,
        price: assignment?.price || svc.price || svc.min_price || 0,
        duration:
          assignment?.duration || svc.estimated_time || svc.min_time || 0,
      };
      return {
        ...updatedSvc,
        tax: calculateServiceTax(updatedSvc),
        unitTax: calculateServiceTax(updatedSvc, {
          perUnit: true,
        }),
      };
    });
  }, [selectedProfessional, staff, selectedServices]);
  const totalBasePrice = selectedStaffServices.reduce(
    (sum, s) => sum + Number(s.price || s.min_price) * (s.qty || 1),
    0,
  );
  const totalDuration = selectedStaffServices.reduce(
    (sum, s) => sum + Number(s.duration) * (s.qty || 1),
    0,
  );
  const requiredSlots = Math.ceil(totalDuration / SLOT_INTERVAL);
  const formatTimeRange = (startIndex: number): string => {
    if (!allSlots.length) return "";
    const start = allSlots[startIndex]?.start_time_12h;
    const endSlot = allSlots[startIndex + requiredSlots - 1];
    if (!start || !endSlot) return "";
    const end = endSlot.end_time_12h ?? endSlot.start_time_12h;
    return `${start} - ${end}`;
  };

  const safeDate = selectedDate || {
    day: startDate.day,
    month: startDate.month,
    year: startDate.year,
  };
  const selectedStartIndex = selectedSlotIndexes?.[0];
  const timeRange =
    selectedStartIndex !== undefined
      ? formatTimeRange(selectedStartIndex)
      : null;
  const monthIndex = safeDate.month ?? 0;
  const dateStr = timeRange
    ? `${MONTH_NAMES[monthIndex - 1]} ${safeDate.day} at ${timeRange}`
    : null;
  const taxAmt = selectedStaffServices.reduce((sum, s) => sum + s.tax, 0);
  const safeTipPct = Number(tipPct) || 0;
  const tipAmt = showTip ? (totalBasePrice * safeTipPct) / 100 : 0;
  const total = totalBasePrice + taxAmt + tipAmt;

  useEffect(() => {
    if (showTip && (tipPct === null || tipPct === undefined)) {
      onTipChange?.(0);
    }
  }, [showTip, tipPct, onTipChange]);

  const finalButtonText = useMemo<ReactNode>(() => {
    if (loading) return "Processing...";

    if (checkingConsent) return "Checking consents...";

    if (consentRequired && consentCompleted < totalConsents) {
      return `Sign Consents (${consentCompleted}/${totalConsents})`;
    }
    return (
      <>
        {buttonText || "Book Appointment"}
        <MoveRight />
      </>
    );
  }, [
    loading,
    checkingConsent,
    consentRequired,
    consentCompleted,
    totalConsents,
    buttonText,
  ]);

  const isButtonDisabled = isBookingDisabled || loading || checkingConsent || !timeRange;

  useEffect(() => {
    const calculateHeight = (): void => {
      const firstHeight = firstRef.current?.offsetHeight || 0;
      const thirdHeight = thirdRef.current?.offsetHeight || 0;
      const totalOffset =
        (firstHeight +
          (isCustomTip
            ? window.innerWidth <= 991
              ? 190
              : 205
            : showTip
              ? window.innerWidth <= 991
                ? 190
                : 205
              : window.innerWidth <= 991
                ? 190
                : 205) || 0) + thirdHeight;

      setSecondHeight(window.innerHeight - totalOffset);
    };
    calculateHeight();
    const resizeObserver = new ResizeObserver(() => {
      calculateHeight();
    });
    if (thirdRef.current) {
      resizeObserver.observe(thirdRef.current);
    }
    if (firstRef.current) {
      resizeObserver.observe(firstRef.current);
    }
    window.addEventListener("resize", calculateHeight);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculateHeight);
    };
  }, [
    selectedStaffServices,
    showTip,
    consentCompleted,
    totalConsents,
    isCustomTip,
  ]);

  return (
    <div className="aaravpos-order-sidebar">
      <div className="aaravpos-order-header">
        <p className="aaravpos-order-title">
          Your Order
          {handleSidebarOpen && (
            <button
              className="aaravpos-sidebar-close-btn"
              onClick={() => handleSidebarOpen()}
            >
              <X />
            </button>
          )}
        </p>
        {selectedProfessional?.id && (
          <div className="aaravpos-pro-card aaravpos-display-flex aaravpos-mb-10 aaravpos-tp-10">
            {selectedProfessional.imageUrl ? (
              <img
                src={selectedProfessional.imageUrl}
                alt={selectedProfessional.name}
                className="aaravpos-pro-image"
              />
            ) : (
              <div
                className="aaravpos-pro-avatar"
                style={{ background: selectedProfessional.color || "#111" }}
              >
                {getUserName(selectedProfessional.name)}
              </div>
            )}
            <div className="aaravpos-pro-info">
              <p className="aaravpos-pro-name">{selectedProfessional.name}</p>
              <p className="aaravpos-pro-type">
                {selectedProfessional.staff_type}
              </p>
            </div>
          </div>
        )}
        <div className="aaravpos-date-time">
          <span className="aaravpos-date-time-label">Date & Time:</span>
          {dateStr ? (
            <span className="aaravpos-date-time-value">{dateStr}</span>
          ) : (
            <span className="aaravpos-date-time-empty">No time selected</span>
          )}
        </div>
      </div>
      <ul
        className="aaravpos-order-list"
        style={{ height: `${secondHeight}px` }}
      >
        {selectedStaffServices?.length > 0 &&
          selectedStaffServices.map((svc) => (
            <li key={svc.id} className="aaravpos-order-item">
              <div className="aaravpos-main-text">
                <p className="aaravpos-order-service-name">{svc.name}</p>
              </div>
              <div className="aaravpos-order-details">
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
      </ul>
      <div className="third" ref={thirdRef}>
        {showTip && (
          <>
            <p className="aaravpos-tip-title">Add Tip</p>
            <div className="aaravpos-tip-options">
              {[...TIP_OPTIONS, "custom"].map((item, index) => {
                const isCustom = item === "custom";

                const isActive = isCustom ? isCustomTip : safeTipPct === item;

                const isFirst = index === 0;

                const isLast = index === [...TIP_OPTIONS, "custom"].length - 1;
                return (
                  <button
                    key={item}
                    onClick={() => {
                      if (isCustom) {
                        setIsCustomTip(true);

                        onTipChange?.(Number(customTip) || 0);
                      } else {
                        setIsCustomTip(false);

                        setCustomTip("");

                        onTipChange?.(Number(item));
                      }
                    }}
                    className={`aaravpos-tip-btn  
                        ${isFirst || isLast
                        ? "aaravpos-tip-btn-fixed"
                        : "aaravpos-tip-btn-flex"
                      } ${isActive ? "aaravpos-tip-btn-active" : ""}`}
                  >
                    {isCustom ? "Custom" : item === 0 ? "No tip" : `${item}%`}
                  </button>
                );
              })}
            </div>
            {isCustomTip && (
              <div className="aaravpos-tip-input-wrapper">
                <input
                  id="number"
                  name="number"
                  type="number"
                  placeholder="Enter %"
                  value={customTip}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (
                      value === "" ||
                      (Number(value) >= 0 && Number(value) <= 100)
                    ) {
                      setCustomTip(value);
                      onTipChange?.(Number(value) || 0);
                    }
                  }}
                  className="aaravpos-tip-input"
                />
              </div>
            )}
          </>
        )}
        {consentRequired && consentCompleted < totalConsents && (
          <div className="aaravpos-consent-box">
            <p className="aaravpos-consent-text">
              Consent Required: {consentCompleted}/{totalConsents} completed
            </p>
            <div className="aaravpos-consent-progress">
              <div
                className="aaravpos-consent-progress-bar"
                style={{
                  width: `${(consentCompleted / totalConsents) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
        <div className="aaravpos-mt-auto">
          <PriceRow
            label="Service"
            value={
              <>
                <CurrencyIcon size={14} />
                {totalBasePrice.toFixed(2)}
              </>
            }
          />
          {totalDuration > 0 && (
            <PriceRow
              label="Total Duration"
              value={`${totalDuration} min`}
            />
          )}
          {showTip && (
            <PriceRow
              label={`Tip (${safeTipPct}%)`}
              value={
                <>
                  <CurrencyIcon size={14} />
                  {tipAmt.toFixed(2)}
                </>
              }
            />
          )}
          {(!showTaxesOnlyIfTime || timeRange) && (
            <PriceRow
              label="Taxes"
              value={
                <>
                  <CurrencyIcon size={14} />
                  {taxAmt.toFixed(2)}
                </>
              }
            />
          )}
          <div className="aaravpos-divider" />
          <div className="aaravpos-order-subtotal">
            <span className="aaravpos-order-subtotal-label">Total</span>
            <span className="aaravpos-order-subtotal-price">
              <CurrencyIcon size={16} />
              {total.toFixed(2)}
            </span>
          </div>
          <button
            onClick={onButtonClick}
            disabled={isButtonDisabled}
            className="aaravpos-common-btn aaravpos-padding-btn"
            style={{ height: 42 }}
          >
            <span className="aaravpos-common-btn-content">
              {finalButtonText}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface PriceRowProps {
  label: string;
  value: ReactNode;
}

function PriceRow({ label, value }: PriceRowProps): JSX.Element {
  return (
    <div className="aaravpos-summary-row">
      <span className="aaravpos-summary-label">{label}</span>
      <span className="aaravpos-summary-value">{value}</span>
    </div>
  );
}
