import { useState, useEffect, useMemo, JSX } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DateTime } from "luxon";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar1,
  Sun,
  Moon,
  Sunrise,
} from "lucide-react";
import { getStaffSlots } from "@/slices/slotSlice";
import {
  setSelectedSlots,
  setSelectedDate,
  setSelectedTime,
} from "@/slices/slotSlice";
import { getUserName } from "@/utils";
import { nextStep } from "@/slices/breadcrumbSlice";
import { OutletRootState, SlotItem, DateItem, Slot } from "@/types";
import OrderSidebar from "@/components/sidebar/OrderSidebar";
import MainLayout from "@/components/common/MainLayout";
import Breadcrumb from "@/components/common/Breadcrumb";
import CalendarOverlay from "@/components/common/CalendarOverlay";
// import { useWindowSize } from "@/hooks/useWindowSize";
import type { AppDispatch } from "@/store";
import { isDateDisabled } from "@/utils/isDateDisabled";

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
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SLOT_INTERVAL = 15;

export default function TimePage(): JSX.Element {
  const dispatch = useDispatch<AppDispatch>();
  const [visibleCount, setVisibleCount] = useState<number>(11);
  const { staff, selectedServices, selectedProfessional } = useSelector(
    (state: OutletRootState) => state.booking.service,
  );

  const { tenantId, timeZone } = useSelector(
    (state: OutletRootState) => state.booking?.outletDetails,
  );

  const { selectedSlotIndexes, selectedDate, selectedTime, slots, loading } =
    useSelector((state: OutletRootState) => state.booking.slots);
  const [calOpen, setCalOpen] = useState<boolean>(false);
  const [stripStart, setStripStart] = useState<number>(0);
  const allSlots = useMemo(() => {
    return [slots.morning, slots.afternoon, slots.evening].flat();
  }, [slots]);
  const startDate = useMemo(() => DateTime.now().setZone(timeZone), [timeZone]);

  const generateDates = (sdate: DateTime): DateItem[] => {
    try {
      const totalDays = 180;
      if (!sdate.isValid) {
        throw new Error("Invalid timezone or start date");
      }
      return Array.from({ length: totalDays }, (_, i) => {
        const d = sdate.plus({ days: i });
        if (!d.isValid) return null;
        return {
          day: d.day,
          month: d.month,
          year: d.year,
          fullDate: d.toISODate(),
        };
      }).filter(Boolean) as DateItem[];
    } catch (error) {
      console.error("generateDates error:", error);
      return [];
    }
  };

  const dates = useMemo<DateItem[]>(() => {
    return generateDates(startDate);
  }, [startDate]);

  const selectedStaffServices = useMemo(() => {
    if (!selectedProfessional?.id) return [];
    const staffMember = staff?.find((s) => s.id === selectedProfessional.id);
    if (!staffMember) return [];
    return selectedServices.map((svc) => {
      const assignment = staffMember.assignments?.find((a) => a.id === svc.id);
      return {
        ...svc,
        price: assignment?.price || svc.price || svc.min_price || 0,
        duration:
          assignment?.duration || svc.estimated_time || svc.min_time || 0,
        qty: assignment?.qty || 1,
      };
    });
  }, [selectedProfessional, staff, selectedServices]);

  const totalDuration = selectedStaffServices.reduce(
    (sum, s) => sum + Number(s.duration) * (s.qty || 1),
    0,
  );
  const durationMins = totalDuration;
  const requiredSlots = Math.ceil(durationMins / SLOT_INTERVAL);
  const formattedDate = selectedDate
    ? DateTime.fromObject(selectedDate).toFormat("yyyy-MM-dd")
    : null;

  useEffect(() => {
    if (!selectedProfessional?.id || !formattedDate) return;
    dispatch(
      getStaffSlots({
        tenantId,
        staffId: selectedProfessional.id,
        date: formattedDate,
      }),
    );
  }, [selectedProfessional?.id, formattedDate, dispatch, tenantId]);

  const handleShift = (dir: number): void => {
    setStripStart((prev) =>
      Math.max(0, Math.min(dates.length - 11, prev + dir * 4)),
    );
  };

  useEffect(() => {
    if (!selectedDate) {
      dispatch(
        setSelectedDate({
          day: startDate.day,
          month: startDate.month,
          year: startDate.year,
        }),
      );
    }
  }, []);

  useEffect(() => {
    if (!selectedDate || !dates.length) return;
    const selectedIndex = dates.findIndex(
      (d) =>
        d.day === selectedDate.day &&
        d.month === selectedDate.month &&
        d.year === selectedDate.year,
    );
    if (selectedIndex === -1) return;
    const newStart = Math.max(
      0,
      Math.min(
        dates.length - visibleCount,
        selectedIndex - Math.floor(visibleCount / 2),
      ),
    );
    setStripStart(newStart);
  }, [selectedDate, dates, visibleCount]);

  const handlePickDate = (d: DateItem): void => {
    const isDisabled = isDateDisabled({
      dateObj: d,
      selectedProfessional,
      outletTimeZone: timeZone || "UTC",
    });
    if (isDisabled) {
      toast.warning("Staff is unavailable on this date");
      return;
    }
    const selected = {
      day: d.day,
      month: d.month,
      year: d.year,
    };
    dispatch(setSelectedDate(selected));
    dispatch(setSelectedTime(null));
  };

  const handleSlotSelect = (selectedIndex: number): void => {
    if (!allSlots.length) return;
    const selectedGroup = allSlots.slice(
      selectedIndex,
      selectedIndex + requiredSlots,
    );
    if (selectedGroup.length < requiredSlots) {
      toast.warning("You don't have sufficient time for selected service");
      return;
    }
    const hasBlocked = selectedGroup.some(
      (s) => s.isBooked || s.status !== "AVAILABLE" || s.disabled,
    );
    if (hasBlocked) {
      toast.warning("Selected time range is not fully available");
      return;
    }
    dispatch(setSelectedTime(allSlots[selectedIndex].start_time));
    const indexes = Array.from(
      { length: requiredSlots },
      (_, i) => selectedIndex + i,
    );
    const ids = indexes.map((i) => allSlots[i]?.id);
    dispatch(setSelectedSlots({ indexes, ids }));
    setTimeout(() => {
      dispatch(nextStep());
    }, 200);
  };

  useEffect(() => {
    if (!selectedTime || !allSlots.length) return;
    const startIndex = allSlots.findIndex(
      (slot) => slot.start_time === selectedTime,
    );
    if (startIndex === -1) return;
    const restoredIndexes = Array.from(
      { length: requiredSlots },
      (_, i) => startIndex + i,
    );
    const isSame =
      restoredIndexes.length === selectedSlotIndexes.length &&
      restoredIndexes.every((val, i) => val === selectedSlotIndexes[i]);
    if (!isSame) {
      const ids = restoredIndexes.map((i) => allSlots[i]?.id);
      dispatch(setSelectedSlots({ indexes: restoredIndexes, ids }));
    }
  }, [selectedTime, allSlots, requiredSlots, selectedSlotIndexes]);

  useEffect(() => {
    const updateCount = (): void => {
      const width = window.innerWidth;
      if (width < 411) {
        setVisibleCount(5);
      } else if (width < 480) {
        setVisibleCount(6);
      } else if (width < 1024) {
        setVisibleCount(5);
      } else if (width < 1280) {
        setVisibleCount(7);
      } else {
        setVisibleCount(11);
      }
    };
    updateCount();
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, []);

  const amSlots = slots?.morning || [];
  const pmSlots = slots?.afternoon || [];
  const evSlots = slots?.evening || [];

  const hasAvailable = (slotsArr: Slot[]): boolean =>
    slotsArr.some(
      (s) => !s.isBooked && s.status === "AVAILABLE" && !s.disabled,
    );

  const getDefaultOpenSection = (): string | null => {
    if (hasAvailable(amSlots)) return "morning";
    if (hasAvailable(pmSlots)) return "afternoon";
    if (hasAvailable(evSlots)) return "evening";
    return null;
  };

  const [openSection, setOpenSection] = useState<string | null>(
    getDefaultOpenSection(),
  );

  const setNextSlotDate = (): void => {
    let nextAvailableDate: DateTime | null = null;
    for (let i = 1; i < dates.length; i++) {
      const nextDate = startDate.plus({ days: i });
      const dateObj = {
        day: nextDate.day,
        month: nextDate.month,
        year: nextDate.year,
        fullDate: nextDate.toISODate(),
      };
      if (
        !isDateDisabled({
          dateObj,
          selectedProfessional,
          outletTimeZone: timeZone || "UTC",
        })
      ) {
        nextAvailableDate = nextDate;
        break;
      }
    }
    if (!nextAvailableDate) return;
    dispatch(
      setSelectedDate({
        day: nextAvailableDate.day,
        month: nextAvailableDate.month,
        year: nextAvailableDate.year,
      }),
    );
  };

  useEffect(() => {
    const firstSelectedIndex = selectedSlotIndexes[0];
    const selectedSlot = allSlots[firstSelectedIndex];
    if (!selectedSlot) return;
    if (amSlots.some((s) => s.id === selectedSlot.id)) {
      setOpenSection("morning");
    } else if (pmSlots.some((s) => s.id === selectedSlot.id)) {
      setOpenSection("afternoon");
    } else if (evSlots.some((s) => s.id === selectedSlot.id)) {
      setOpenSection("evening");
    }
  }, [selectedSlotIndexes, allSlots, amSlots, pmSlots, evSlots]);

  useEffect(() => {
    const hasAvailable = (slotsArr: Slot[]): boolean =>
      slotsArr.some(
        (s) => !s.isBooked && s.status === "AVAILABLE" && !s.disabled,
      );
    const noSlotsAvailable =
      !hasAvailable(amSlots) &&
      !hasAvailable(pmSlots) &&
      !hasAvailable(evSlots);
    if (!loading && noSlotsAvailable) {
      setNextSlotDate();
    }
  }, [amSlots, pmSlots, evSlots]);

  return (
    <MainLayout
      sidebar={
        <div className="aaravpos-aside">
          <OrderSidebar
            buttonText="Fill Details"
            onButtonClick={() => {
              if (!selectedTime || !selectedSlotIndexes.length) {
                toast.warning("Please select a time slot");
                return;
              }
              dispatch(nextStep());
            }}
            showTaxesOnlyIfTime={true}
          />
        </div>
      }
      renderButton={null}
    >
      <Breadcrumb />
      <div style={{ marginTop: 15 }}>
        <h1 className="aaravpos-page-title" style={{ marginBottom: 10 }}>
          Choose a Time
        </h1>
      </div>
      <div className="arravpos-date-wrapper">
        <div className="arravpos-date-strip">
          <DateNavBtn onClick={() => handleShift(-1)}>
            <ChevronLeft size={20} />
          </DateNavBtn>
          {dates.slice(stripStart, stripStart + visibleCount).map((d) => {
            const dt = DateTime.fromISO(d.fullDate || "");
            const dow = dt.weekday % 7;
            const today = DateTime.now().setZone(timeZone).startOf("day");
            const isToday = dt.hasSame(today, "day");
            const isSelected =
              selectedDate?.day === d.day &&
              selectedDate?.month === d.month &&
              selectedDate?.year === d.year;
            const isDisabled = isDateDisabled({
              dateObj: d,
              selectedProfessional,
              outletTimeZone: timeZone || "UTC",
            });
            return (
              <div
                key={`${d.day}-${d.month}-${d.year}`}
                onClick={() => {
                  if (!isDisabled) {
                    handlePickDate(d);
                  }
                }}
                className={[
                  "arravpos-date-card",
                  isDisabled
                    ? "arravpos-date-card-disabled"
                    : isSelected
                      ? "arravpos-date-card-active"
                      : "arravpos-date-card-default",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {isDisabled && <div className="arravpos-date-disabled-slash" />}
                <span className="arravpos-date-week">{WEEK_DAYS[dow]}</span>
                <span className="arravpos-date-day">{d.day}</span>
                {isToday && !isSelected && !isDisabled && (
                  <span className="arravpos-date-today">TODAY</span>
                )}
                {isDisabled && (
                  <span className="arravpos-date-unavailable">UNAVAILABLE</span>
                )}
              </div>
            );
          })}
          <DateNavBtn onClick={() => handleShift(1)}>
            <ChevronRight size={20} />
          </DateNavBtn>
        </div>
        <button
          onClick={() => setCalOpen(true)}
          className="arravpos-calendar-btn"
        >
          <Calendar1 size={16} />

          {selectedDate?.month != null
            ? `${MONTH_NAMES[selectedDate.month - 1]} ${selectedDate.year}`
            : `${MONTH_NAMES[startDate.month - 1]} ${startDate.year}`}
        </button>
      </div>
      <div className="arravpos-selected-professional">
        {selectedProfessional?.imageUrl ? (
          <img
            src={selectedProfessional.imageUrl}
            alt={selectedProfessional.name}
            className="arravpos-selected-professional-image"
          />
        ) : (
          <div
            className="arravpos-selected-professional-avatar"
            style={{ background: selectedProfessional?.color || "#111" }}
          >
            {getUserName(selectedProfessional?.name)}
          </div>
        )}
        <div className="arravpos-selected-professional-content">
          <p className="arravpos-selected-professional-name">
            {selectedProfessional?.name}
          </p>
          <p className="arravpos-selected-professional-services">
            {selectedStaffServices.map((s: any) => s.name).join(", ")} ·{" "}
            {totalDuration} mins
          </p>
        </div>
      </div>
      <div
        className="arravpos-scroll-area"
        style={loading ? { height: 300 } : {}}
      >
        {loading ? (
          <div className="arravpos-loader-wrapper">
            <div className="arravpos-loader" />
          </div>
        ) : (
          <>
            <SlotSection
              label="Morning"
              icon={<Sunrise size={18} className="arravpos-slot-icon" />}
              slots={amSlots}
              allSlots={allSlots}
              selectedSlotIndexes={selectedSlotIndexes}
              handleSlotSelect={handleSlotSelect}
              isOpen={openSection === "morning"}
              onToggle={() =>
                setOpenSection(openSection === "morning" ? null : "morning")
              }
            />
            <SlotSection
              label="Afternoon"
              icon={<Sun size={18} className="arravpos-slot-icon" />}
              slots={pmSlots}
              allSlots={allSlots}
              selectedSlotIndexes={selectedSlotIndexes}
              handleSlotSelect={handleSlotSelect}
              isOpen={openSection === "afternoon"}
              onToggle={() =>
                setOpenSection(openSection === "afternoon" ? null : "afternoon")
              }
            />
            <SlotSection
              label="Evening"
              icon={<Moon size={18} className="arravpos-slot-icon" />}
              slots={evSlots}
              allSlots={allSlots}
              selectedSlotIndexes={selectedSlotIndexes}
              handleSlotSelect={handleSlotSelect}
              isOpen={openSection === "evening"}
              onToggle={() =>
                setOpenSection(openSection === "evening" ? null : "evening")
              }
            />
          </>
        )}
        <CalendarOverlay isOpen={calOpen} onClose={() => setCalOpen(false)} />
      </div>
    </MainLayout>
  );
}

interface DateNavBtnProps {
  onClick: () => void;
  children: React.ReactNode;
}

function DateNavBtn({ onClick, children }: DateNavBtnProps): JSX.Element {
  return (
    <button onClick={onClick} className="arravpos-date-nav-btn">
      {children}
    </button>
  );
}

interface SlotSectionProps {
  icon: React.ReactNode;
  label: string;
  slots: SlotItem[];
  allSlots: SlotItem[];
  selectedSlotIndexes: number[];
  handleSlotSelect: (index: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

function SlotSection({
  icon,
  label,
  slots,
  allSlots,
  selectedSlotIndexes,
  handleSlotSelect,
  isOpen,
  onToggle,
}: SlotSectionProps): JSX.Element | null {
  if (!slots || slots?.length === 0) return null;
  // const dispatch = useDispatch<AppDispatch>();
  return (
    <div className="arravpos-slot-section">
      <div onClick={onToggle} className="arravpos-slot-section-header">
        <div className="arravpos-slot-section-title">
          <span>{icon}</span> {label}
        </div>
        <span
          className={`arravpos-slot-section-arrow ${isOpen ? "arravpos-slot-section-arrow-open" : ""}`}
        >
          <ChevronDown />
        </span>
      </div>
      {isOpen && (
        <div className="arravpos-slot-section-content">
          <div className="arravpos-slot-grid">
            {slots.map((slot: SlotItem) => {
              const globalIndex = allSlots.findIndex(
                (s: SlotItem) => s.id === slot.id,
              );
              const isSelected = selectedSlotIndexes.includes(globalIndex);
              const isOnBreak = slot.disabled;

              const isDisabled =
                slot.isBooked || slot.status !== "AVAILABLE" || isOnBreak;
              return (
                <div
                  key={slot.id}
                  onClick={() => {
                    if (!isDisabled) {
                      handleSlotSelect(globalIndex);
                    }
                  }}
                  className={`arravpos-slot-card ${
                    isDisabled
                      ? "arravpos-slot-card-disabled"
                      : isSelected
                        ? "arravpos-slot-card-selected"
                        : "arravpos-slot-card-default"
                  }`}
                >
                  <span className="arravpos-slot-time">{slot.start_time}</span>
                  
                  <span className="arravpos-slot-status">
                    {slot.disabled
                      ? ""
                      : slot.isBooked
                        ? "Booked"
                        : "Available"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
