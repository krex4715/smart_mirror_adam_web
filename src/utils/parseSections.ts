// utils/parseSections.ts
import { strToSec } from "./parseNavMaps";   // 이미 만들어 둔 함수

export interface SectionPoint { label: string; sec: number; }

// 레코드 → [ {label:"Intro", sec:0}, {label:"Part1", sec:10}, … ]
export const parseSections = (d: any): SectionPoint[] => {
  const out: SectionPoint[] = [];

  const pickFirst = (obj?: Record<string,string>) =>
    obj && Object.values(obj).length ? strToSec(Object.values(obj)[0]) : null;

  const push = (label: string, obj?: Record<string,string>) => {
    const s = pickFirst(obj);
    if (s !== null) out.push({ label, sec: s });
  };

  push("Intro",  d.intro_nav_maps);
  push("PART1",  d.part1_nav_maps);
  push("PART2",  d.part2_nav_maps);
  push("PART3",  d.part3_nav_maps);
  push("PART4",  d.part4_nav_maps);
  push("전체구간",    d.whole_nav_maps);
  push("OUTRO",  d.outro_nav_maps);

  return out.sort((a,b)=>a.sec-b.sec);   // 보정용
};
