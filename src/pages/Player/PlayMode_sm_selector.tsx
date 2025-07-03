/*  src/pages/Player/PlayMode_sm_selector.tsx
 *  ───────────────────────────────────────────────
 *  /player/:id  에서 진입하는 “트레이닝 ↔ 촬영” 선택 화면
 *   ⌨︎  ←→ : 포커스 이동
 *      Enter / g / ㅎ : 선택
 *      Esc   / j / ㅓ : 뒤로
 *  ------------------------------------------------
 *   트레이닝 → /sm_training/:id
 *   촬영     → /sm_record/:id
 *  ------------------------------------------------ */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const PlayMode_sm_selector: React.FC = () => {
  const { id }  = useParams();
  const nav     = useNavigate();
  const [hover, setHover] = useState<0 | 1>(0); // 0 = training, 1 = record

  /* ── 키보드 네비게이션 ───────────────────────── */
  useEffect(() => {
    const hd = (e: KeyboardEvent) => {
      switch (e.key) {
        /* 좌우 전환 */
        case "ArrowLeft":
        case "e":
        case "ㄷ":
        case "ArrowRight":
        case "f":
        case "ㄹ":
          setHover((h) => (h === 0 ? 1 : 0));
          break;

        /* 선택 */
        case "Enter":
        case "g":
        case "ㅎ":
          if (!id) return;
          nav(hover === 0 ? `/sm_training/${id}` : `/sm_record/${id}`);
          break;

        /* 뒤로가기 */
        case "Escape":
        case "j":
        case "ㅓ":
          nav(-1);
          break;
      }
    };
    window.addEventListener("keydown", hd);
    return () => window.removeEventListener("keydown", hd);
  }, [hover, nav, id]);

  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white text-2xl">
        잘못된 접근입니다
      </div>
    );
  }

  /* ── 렌더 ─────────────────────────────────────── */
  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white select-none">
      <div className="flex flex-row gap-12">
          {[
            { label: "트레이닝 모드", path: `/sm_training/${id}` },
            { label: "촬영 모드",     path: `/sm_record/${id}` },
          ].map((btn, i) => (
            <button
              key={btn.label}
              onMouseEnter={() => setHover(i as 0 | 1)}
              onClick={() => nav(btn.path)}
              className={
                `relative px-16 py-7 rounded-3xl text-3xl font-bold transition-all
                overflow-hidden backdrop-blur-xl
                ${hover === i
                  ? "bg-white/25 border border-white/40 shadow-[0_0_40px_6px_rgba(226,162,255,0.65)]"
                  : "bg-white/15 border border-white/25 shadow-[0_0_25px_4px_rgba(226,162,255,0.45)] hover:shadow-[0_0_35px_5px_rgba(226,162,255,0.55)]"}` +
                /* ─ neon-gradient edge ─ */
                ` before:content-[''] before:absolute before:inset-0 before:rounded-[inherit]
                  before:bg-gradient-to-br before:from-[#e2b0ffAA] before:to-[#9f7bffAA]
                  before:opacity-0 before:transition-opacity
                  ${hover === i ? "before:opacity-50" : "hover:before:opacity-35"}`
              }
            >
              {btn.label}
            </button>
          ))}
      </div>
    </div>
  );
};

export default PlayMode_sm_selector;
