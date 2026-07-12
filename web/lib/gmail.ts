export function extractCompany(subject: string): string | null {
  const patterns = [
    /applying to ([^!,\.]+)/i,
    /application to ([^!,\.]+)/i,
    /applying at ([^!,\.]+)/i,
    /applied at ([^!,\.]+)/i,
    /sent to ([^!,\.]+)/i,
    /viewed by ([^!,\.]+)/i,
    /^([^–\-]+)\s*[–\-]/,
  ];
  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}
