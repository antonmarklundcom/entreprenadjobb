const SWEDISH_CHAR_MAP: Record<string, string> = {
  å: "a",
  ä: "a",
  ö: "o",
  Å: "a",
  Ä: "a",
  Ö: "o",
};

export function slugify(input: string): string {
  const transliterated = input.replace(
    /[åäöÅÄÖ]/g,
    (char) => SWEDISH_CHAR_MAP[char] ?? char,
  );

  return transliterated
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugWithSuffix(base: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slugify(base)}-${suffix}`;
}
