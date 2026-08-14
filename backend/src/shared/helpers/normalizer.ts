export const normalizeText = (value: string | undefined | null): string => {
  if (!value) {
    return "";
  }

  return value
    .toLowerCase()
    .replace(/[^a-z0-9@./\s-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const tokenizeText = (value: string | undefined | null): string[] => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) {
    return [];
  }

  return normalizedValue.split(" ").filter(Boolean);
};

export const uniqueValues = <T>(values: T[]): T[] => {
  return [...new Set(values)];
};

export const clampNumber = (
  value: number,
  minValue: number,
  maxValue: number,
): number => {
  return Math.min(Math.max(value, minValue), maxValue);
};

export const averageNumbers = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return (
    values.reduce((sum, currentValue) => sum + currentValue, 0) / values.length
  );
};

export const containsAnyToken = (text: string, keywords: string[]): boolean => {
  const normalizedText = normalizeText(text);
  return keywords.some((keyword) =>
    normalizedText.includes(normalizeText(keyword)),
  );
};

export const countKeywordHits = (text: string, keywords: string[]): number => {
  const normalizedText = normalizeText(text);
  return keywords.reduce((hits, keyword) => {
    return hits + (normalizedText.includes(normalizeText(keyword)) ? 1 : 0);
  }, 0);
};

export const similarityScore = (
  leftValue: string,
  rightValue: string,
): number => {
  const leftTokens = new Set(tokenizeText(leftValue));
  const rightTokens = new Set(tokenizeText(rightValue));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let intersectionCount = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      intersectionCount += 1;
    }
  }

  const unionCount = new Set([...leftTokens, ...rightTokens]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
};
