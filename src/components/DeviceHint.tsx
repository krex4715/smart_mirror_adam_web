/*  src/components/DeviceHint.tsx
 *  화면 좌-하단 “조작 장치” 배지
 *  ┌────────────────────────────────────┐
 *  │  조작 장치                         │
 *  │  ●⌨️   ●🎮                         │
 *  └────────────────────────────────────┘
 *  검정(⌨️) - 파랑(🎮) 동그라미 안에 아이콘을 넣어
 *  각 기기의 색을 직관적으로 구분합니다.
 *  ------------------------------------------------------------------ */
import React from "react";
import { useLocation } from "react-router-dom";

/* ───────── 경로 → 사용 가능 기기 매핑 ───────── */
const pickDevices = (path: string): ("kbd" | "pad")[] => {
  if (path === "/")                       return ["kbd"]; // 로그인
  if (path.startsWith("/main"))           return ["kbd", "pad"];        // 메인 ☜ 수정
  if (path.startsWith("/mode"))           return ["kbd","pad"];        // 콘텐츠 목록
  if (path.startsWith("/player"))         return ["pad"];        // 플레이어
  return [];
};

/* ───────── 아이콘 컴포넌트 ───────── */
const Icon: React.FC<{ type: "kbd" | "pad" }> = ({ type }) => {
  /* 회색(키보드) · 파랑(조이스틱) */
  const cfg =
    type === "kbd"
      ? { bg: "bg-gray-700",  label: "키보드패드",   emoji: "⌨️" }
      : { bg: "bg-blue-600",  label: "미니조이스틱", emoji: "🎮" };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* 원형 배경 + 이모지 */}
      <div
        className={`w-20 h-20 lg:w-15 lg:h-15  rounded-full
                    flex items-center justify-center ${cfg.bg}`}
      >
        <span className="text-3xl lg:text-4xl">{cfg.emoji}</span>
      </div>

      {/* 라벨 */}
        <span className="text-base lg:text-lg text-white whitespace-nowrap">
        {cfg.label}
        </span>
    </div>
  );
};

/* ───────── 메인 컴포넌트 ───────── */
const DeviceHint: React.FC = () => {
  const { pathname } = useLocation();
  const devices = pickDevices(pathname);

  if (devices.length === 0) return null; // 필요 없으면 렌더 X

  return (
    <div
      className="fixed bottom-8 left-8 z-[60] flex flex-col gap-4
                 px-8 py-6 rounded-2xl bg-black/70 backdrop-blur-md
                 pointer-events-none select-none"
    >
      {/* 제목 */}
      <span className="text-white font-bold text-2xl lg:text-3xl tracking-wide">
        조작 장치
      </span>

      {/* 아이콘들 */}
      <div className="flex gap-10 self-center">
        {devices.map((d) => (
          <Icon key={d} type={d} />
        ))}
      </div>
    </div>
  );
};

export default DeviceHint;
