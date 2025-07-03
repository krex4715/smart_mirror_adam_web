// src/components/RemainClock.tsx
import React from "react";
import {
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/solid";
import { useSession } from "../lib/SessionContext";

const RemainClock: React.FC = () => {
  const { remaining, handleLogout, userName } = useSession();
  if (remaining <= 0) return null;

  /* 🔽 소수점 오차 제거 (반올림이나 버림 아무 쪽이나 OK) */
  const sec = Math.floor(remaining);          // ← 핵심
  const mm  = Math.floor(sec / 60);
  const ss  = String(sec % 60).padStart(2, "0");

  return (
    <div className="fixed top-4 left-0 right-0 z-50 px-6 flex justify-between items-center pointer-events-none">
      {/* ── 왼쪽 인삿말 ── */}
      <span className="pointer-events-auto font-medium text-white text-3xl whitespace-nowrap">
        {userName && `${userName} 님 반갑습니다!`}
      </span>

      {/* ── 오른쪽 HUD ── */}
      <div className="pointer-events-auto flex items-center gap-6
                      px-6 py-1 rounded-full backdrop-blur-sm bg-black/70">
        <span className="font-semibold text-white text-4xl">
          ⏳ {mm}:{ss}
        </span>

        {/* 블루투스 */}
        <button
          onClick={() => window.electronAPI?.openBluetoothSettings?.()}
          className="flex flex-col items-center text-white hover:text-blue-300"
          title="블루투스 설정 열기"
        >
          <Cog6ToothIcon className="w-12 h-12" />
          <span className="-mt-1 text-[0.65rem]">블루투스</span>
        </button>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center text-white hover:text-yellow-300"
          title="로그아웃"
        >
          <ArrowRightOnRectangleIcon className="w-12 h-12" />
          <span className="-mt-1 text-[0.65rem]">로그아웃</span>
        </button>
      </div>
    </div>
  );
};

export default RemainClock;
