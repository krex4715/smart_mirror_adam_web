export interface NavItem { label: string; sec: number; }

export const strToSec = (s: string): number => {
  const [m, sec] = s.split(":").map(Number);
  return m * 60 + sec;
};

export const parseNavMaps = (raw: Record<string, string>): NavItem[] =>
  Object.entries(raw).map(([label, t]) => ({
    label,
    sec: strToSec(t),
  }));
