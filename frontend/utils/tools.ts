export function truncateMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const keep = Math.floor((maxLength - 3) / 2);
  return str.slice(0, keep) + "..." + str.slice(str.length - keep);
}
