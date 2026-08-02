// Blocks common ways of sharing a phone number in chat text so vendor/customer
// can't move the conversation off-platform. Not bulletproof (nothing regex-based
// ever is) but catches the overwhelming majority of real-world attempts.
const PATTERNS: RegExp[] = [
  /(\+?92|0)[\s-]?3\d{2}[\s-]?\d{3}[\s-]?\d{4}/g, // 03xx-xxxxxxx / +923xxxxxxxxx
  /\b\d{4}[\s-]?\d{7}\b/g, // 11-digit landline-ish blocks
  /\b(\d[\s-]?){10,}\b/g, // any run of 10+ digits, spaced or not
  /\bwhat'?s\s?app\b/gi,
  /\bimo\b/gi,
];

export function containsContactInfo(text: string | undefined | null): boolean {
  if (!text) return false;
  return PATTERNS.some((p) => p.test(text));
}

export function redactContactInfo(text: string): string {
  let result = text;
  for (const p of PATTERNS) {
    result = result.replace(p, '[removed]');
  }
  return result;
}
