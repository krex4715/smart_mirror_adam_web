// utils/parseNavItems.ts
export interface NavItem { label: string; sec: number; }

const strToSec = (s: string): number => {
  const [m, sec] = s.split(":").map(Number);
  return m * 60 + sec;
};

type FieldCfg = { key: string; prefix: string };

const fields: FieldCfg[] = [
  { key: "intro_nav_maps",  prefix: "Intro" },
  { key: "part1_nav_maps",  prefix: "PART 1" },
  { key: "part2_nav_maps",  prefix: "PART 2" },
  { key: "part3_nav_maps",  prefix: "PART 3" },
  { key: "part4_nav_maps",  prefix: "PART 4" },
  { key: "whole_nav_maps",  prefix: "전체구간" },
  { key: "outro_nav_maps",  prefix: "Outro" },
];

/** PocketBase 레코드 → [{label,sec}] */
export const parseNavItems = (rec: any): NavItem[] => {
  const out: NavItem[] = [];

  for (const { key, prefix } of fields) {
    const obj = rec[key] as Record<string, string> | undefined;
    if (!obj) continue;

    // 객체의 key 순서 그대로 push
    for (const [sub, t] of Object.entries(obj)) {
      out.push({ label: `${prefix} │ ${sub}`, sec: strToSec(t) });
    }
  }
  return out;
};
