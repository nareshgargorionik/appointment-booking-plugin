import { JSX, useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DateTime } from "luxon";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { setSelectedDate } from "@/slices/slotSlice";
import type { OutletRootState, CalendarMonth } from "@/types";
import { isDateDisabled } from "@/utils/isDateDisabled";

const generateMonths = (outletTimeZone: string): CalendarMonth[] => {
  try {
    if (!outletTimeZone) {
      throw new Error("Missing timezone");
    }
    const today = DateTime.now().setZone(outletTimeZone);
    if (!today.isValid) {
      throw new Error("Invalid timezone");
    }
    return Array.from({ length: 4 }, (_, i) => {
      const d = today.plus({ months: i }).startOf("month");
      return {
        label: d.toFormat("LLLL yyyy"),
        monthIdx: d.month,
        year: d.year,
        startDow: d.startOf("month").weekday % 7,
        days: d.daysInMonth || 0,
      };
    });
  } catch (error) {
    console.error("generateMonths error:", error);
    return [];
  }
};

const WD: string[] = ["S", "M", "T", "W", "T", "F", "S"];

interface CalendarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalendarOverlay({
  isOpen,
  onClose,
}: CalendarOverlayProps): JSX.Element | null {
  const dispatch = useDispatch();

  const { selectedDate } = useSelector(
    (state: OutletRootState) => state.booking.slots,
  );

  const { selectedProfessional } = useSelector(
    (state: OutletRootState) => state.booking.service,
  );

  const { timeZone } = useSelector(
    (state: OutletRootState) => state.booking.outletDetails,
  );

  // const [months] = useState<CalendarMonth[]>(generateMonths(timeZone || ""));
  const months = useMemo<CalendarMonth[]>(() => {
    if (!timeZone) return [];
    return generateMonths(timeZone);
  }, [timeZone]);

  // open selected month directly
  const getInitialMonthIndex = (): number => {
    if (!selectedDate) return 0;

    const index = months.findIndex(
      (m) => m.monthIdx === selectedDate.month && m.year === selectedDate.year,
    );

    return index >= 0 ? index : 0;
  };

  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(
    getInitialMonthIndex(),
  );

  // sync selected month when modal opens
  useEffect(() => {
    if (!isOpen || !selectedDate || !months.length) return;

    const index = months.findIndex(
      (m) => m.monthIdx === selectedDate.month && m.year === selectedDate.year,
    );

    if (index >= 0) {
      setCurrentMonthIndex(index);
    }
  }, [isOpen, selectedDate, months]);

  const currentMonth = months[currentMonthIndex];

  if (!isOpen) return null;

  // normalize start date
  const startDate = DateTime.now()
    .setZone(timeZone ?? "UTC")
    .startOf("day");

  //allow only till next 3 months
  const endDate = startDate.plus({ months: 3 }).minus({ days: 1 });

  const handlePick = (monthIdx: number, day: number): void => {
    const selectedDt = DateTime.fromObject(
      {
        year: currentMonth.year,
        month: monthIdx,
        day,
      },
      {
        zone: timeZone || "UTC",
      },
    );

    const dateObj = {
      day,
      month: monthIdx,
      year: currentMonth.year,
      fullDate: selectedDt.toISODate() || "",
    };

    const normalizedDate = selectedDt.startOf("day");

    const isPastDate = normalizedDate < startDate;
    const isAfterLimit = normalizedDate > endDate;

    const disabled =
      isPastDate ||
      isAfterLimit ||
      isDateDisabled({
        dateObj,
        selectedProfessional,
        outletTimeZone: timeZone || "UTC",
      });

    if (disabled) return;

    dispatch(
      setSelectedDate({
        month: monthIdx,
        day,
        year: currentMonth.year,
      }),
    );

    onClose();
  };

  return (
    <div
      className="aaravpos-date-modal-overlay"
      onClick={(e: React.MouseEvent<HTMLDivElement>) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <div className="aaravpos-date-modal">
        <div className="aaravpos-date-modal-header">
          <h2 className="aaravpos-date-modal-title">Pick a Date</h2>

          <button onClick={onClose} className="aaravpos-date-close-btn">
            <X />
          </button>
        </div>

        <div className="aaravpos-date-modal-body">
          <div className="aaravpos-date-nav">
            <button
              disabled={currentMonthIndex === 0}
              onClick={() =>
                setCurrentMonthIndex((prev) => Math.max(prev - 1, 0))
              }
              className="aaravpos-date-nav-btn"
            >
              <ChevronLeft />
            </button>

            <div className="aaravpos-date-month-label">
              {currentMonth?.label}
            </div>

            <button
              disabled={currentMonthIndex === months.length - 1}
              onClick={() =>
                setCurrentMonthIndex((prev) =>
                  Math.min(prev + 1, months.length - 1),
                )
              }
              className="aaravpos-date-nav-btn"
            >
              <ChevronRight />
            </button>
          </div>

          <div className="aaravpos-calendar-grid">
            {WD.map((d, i) => (
              <div key={i} className="aaravpos-calendar-weekday">
                {d}
              </div>
            ))}

            {Array.from({
              length: currentMonth?.startDow || 0,
            }).map((_, i) => (
              <div key={`e${i}`} />
            ))}

            {Array.from(
              {
                length: currentMonth?.days || 0,
              },
              (_, i) => i + 1,
            ).map((day) => {
              const sel =
                selectedDate?.month === currentMonth?.monthIdx &&
                selectedDate?.day === day;

              const today =
                currentMonth?.monthIdx === startDate.month &&
                day === startDate.day;

              const dt = DateTime.fromObject(
                {
                  year: currentMonth.year,
                  month: currentMonth.monthIdx,
                  day,
                },
                {
                  zone: timeZone || "UTC",
                },
              );

              const dateObj = {
                day,
                month: currentMonth.monthIdx,
                year: currentMonth.year,
                fullDate: dt.toISODate() || "",
              };

              const normalizedDate = dt.startOf("day");

              const isPastDate = normalizedDate < startDate;

              const isAfterLimit = normalizedDate > endDate;

              const disabled =
                // isPastDate ||
                // isAfterLimit ||
                isDateDisabled({
                  dateObj,
                  selectedProfessional,
                  outletTimeZone: timeZone || "UTC",
                });

              return (
                <div
                  key={day}
                  onClick={() => {
                    if (!disabled) {
                      handlePick(currentMonth.monthIdx, day);
                    }
                  }}
                  className={[
                    "aaravpos-calendar-day",

                    !sel && !disabled && "aaravpos-calendar-day-active",

                    today && !sel && "aaravpos-calendar-day-today",

                    sel && "aaravpos-calendar-day-selected",

                    disabled && "aaravpos-calendar-day-disabled",

                    (isPastDate || isAfterLimit) &&
                    "aaravpos-calendar-day-disabled",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {/* Slash Line */}
                  {disabled && (
                    <div className="aaravpos-calendar-day-slash" />
                  )}

                  <span className="aaravpos-calendar-day-text">
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
