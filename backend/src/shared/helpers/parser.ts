export const parseInteger = (
  value: string | undefined | null,
): number | null => {
  if (value == null || value.trim() === "") {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const parseFloatValue = (
  value: string | undefined | null,
): number | null => {
  if (value == null || value.trim() === "") {
    return null;
  }

  const parsedValue = Number.parseFloat(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

export const parseBooleanValue = (
  value: string | undefined | null,
): boolean | null => {
  if (value == null || value.trim() === "") {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();
  if (["1", "true", "yes", "y"].includes(normalizedValue)) {
    return true;
  }

  if (["0", "false", "no", "n"].includes(normalizedValue)) {
    return false;
  }

  return null;
};

export const parseDateValue = (
  value: string | undefined | null,
): Date | null => {
  if (value == null || value.trim() === "") {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

export const parseListValue = (value: string | undefined | null): string[] => {
  if (value == null || value.trim() === "") {
    return [];
  }

  return value
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};
