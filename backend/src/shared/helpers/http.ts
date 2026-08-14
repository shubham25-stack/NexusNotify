export const resolveRouteParam = (
  value: string | string[] | undefined,
): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};
