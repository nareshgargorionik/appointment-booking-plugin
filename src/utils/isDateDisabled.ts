import { DateTime } from "luxon";

import type { Staff, DateItem } from "@/types";

interface IsDateDisabledProps {
  dateObj: DateItem;

  selectedProfessional?: Staff | null;

  outletTimeZone: string;
}

export const isDateDisabled = ({
  dateObj,
  selectedProfessional,
  outletTimeZone,
}: IsDateDisabledProps): boolean => {
  if (!selectedProfessional) return false;

  const dt = DateTime.fromObject(
    {
      year: dateObj.year,
      month: dateObj.month,
      day: dateObj.day,
    },
    {
      zone: outletTimeZone,
    },
  );

  const currentDate = dt.toISODate();

  const leaveDates = selectedProfessional?.futureLeaveDates || [];

  const isOnLeave = leaveDates.some((leave) => {
    if (leave.status !== "APPROVED" || leave.leaveType !== "FULL_DAY") {
      return false;
    }

    const leaveDate = leave?.leavePeriod?.date;

    if (!leaveDate) return false;

    return (
      DateTime.fromISO(leaveDate, { zone: "utc" }).toISODate() === currentDate
    );
  });

  if (isOnLeave) return true;

  const overrides = selectedProfessional?.dateOverrides || [];

  const matchingOverride = overrides.find((override) => {
    return (
      DateTime.fromISO(override.date, { zone: "utc" }).toISODate() ===
      currentDate
    );
  });

  if (matchingOverride?.type === "CLOSED") {
    return true;
  }

  if (matchingOverride?.type === "TIME") {
    return false;
  }

  const weeklyJson = selectedProfessional?.weeklyHours?.weeklyJson || {};

  const weekKeyMap: Record<number, string> = {
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
    7: "sun",
  };

  const weekdayKey = weekKeyMap[dt.weekday];

  const dayConfig = weeklyJson?.[weekdayKey];

  return !dayConfig || Boolean(dayConfig.isClosed);
};
