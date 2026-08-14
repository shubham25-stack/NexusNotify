export const getDateOnly = (
  value: Date | string | null | undefined,
): string => {
  if (value == null) {
    return "";
  }

  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toISOString().slice(0, 10);
};

export const getMinutesFromTime = (timeValue: string): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(timeValue.trim());
  if (!match) {
    return null;
  }

  const hours = Number.parseInt(match[1] ?? "0", 10);
  const minutes = Number.parseInt(match[2] ?? "0", 10);
  return hours * 60 + minutes;
};

export const isWithinQuietHours = (
  currentTime: string,
  quietWindow: string | null | undefined,
): boolean => {
  if (!quietWindow || quietWindow.trim() === "") {
    return false;
  }

  const [startTime, endTime] = quietWindow.split("-");
  const currentMinutes = getMinutesFromTime(currentTime);
  const startMinutes = getMinutesFromTime(startTime ?? "");
  const endMinutes = getMinutesFromTime(endTime ?? "");

  if (currentMinutes == null || startMinutes == null || endMinutes == null) {
    return false;
  }

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
};

export const minutesBetween = (
  leftValue: Date | string,
  rightValue: Date | string,
): number => {
  const leftDate = leftValue instanceof Date ? leftValue : new Date(leftValue);
  const rightDate =
    rightValue instanceof Date ? rightValue : new Date(rightValue);
  return Math.abs(leftDate.getTime() - rightDate.getTime()) / 60000;
};

export const getTimeOfDay = (value: Date | string): string => {
  const parsedDate = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "00:00";
  }

  const hours = String(parsedDate.getHours()).padStart(2, "0");
  const minutes = String(parsedDate.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};
