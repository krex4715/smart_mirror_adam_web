/*  src/pages/Main/Main.tsx
 *  메인 대시보드 – 플레이 모드 선택
 *  (AI 연습 / 스마트미러)
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/* ───── 썸네일 이미지 ───── */
import smart_mirror_img  from "../../assets/images/smart_thumbnail.png";
import sm_training_img   from "../../assets/images/sm_training.png";
import mode_onozkpop_img from "../../assets/images/onoz.jpg";

/* ───────── 타입 & 데이터 ───────── */
interface PlayMode {
  id: string;            // ← nav 경로: `/${id}`
  title: string;
  description: string;
  gif: string;
}

const playModes: PlayMode[] = [
  {
    id: "mode_ai_prac",
    title: "🪄 AI 연습 모드",
    description: "영상을 직접 업로드하여,\nAI를 통해 편하게 댄스를 연습해보세요 🪄",
    gif: smart_mirror_img,
  },
  {
    id: "mode_sm",
    title: "스마트미러 트레이닝 모드",
    description: "스마트미러에 최적화된\n댄스 트레이닝 컨텐츠를 즐겨보세요 🎥",
    gif: sm_training_img,
  },
  {
    id: "mode_onoz_kpop",
    title: "K-POP 튜토리얼 모드🕺",
    description: "ONOZ crew와 함께하는 K-POP 댄스 튜토리얼 🎶",
    gif: mode_onozkpop_img,
  },
];

/* ───────── 알약 인디케이터 ───────── */
const Pills: React.FC<{ total: number; idx: number }> = ({ total, idx }) => (
  <div className="flex gap-3 mt-8">
    {Array.from({ length: total }).map((_, i) => (
      <motion.span
        key={i}
        layout
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`h-2 rounded-full ${
          i === idx ? "bg-purple-400 w-10" : "bg-purple-800/40 w-6"
        }`}
      />
    ))}
  </div>
);

/* ───────── 메인 컴포넌트 ───────── */
const Main: React.FC = () => {
  /* ── state ── */
  const savedIdx = Math.max(
    0,
    Math.min(playModes.length - 1, parseInt(localStorage.getItem("main_idx") || "0"))
  );
  const [idx, setIdx] = useState<number>(savedIdx);
  const [show, setShow] = useState(false);    // 확인 모달
  const [hover, setHover] = useState(true);   // 모달 Yes / No 포커스
  const [anim, setAnim] = useState(false);    // 모달 애니메이션
  const [touchX, setTouch] = useState<number | null>(null);

  const nav = useNavigate();

  /* idx 저장 */
  useEffect(() => {
    localStorage.setItem("main_idx", String(idx));
  }, [idx]);

  /* ── 키보드 ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (show) {
        /* 모달 내 */
        switch (e.key) {
          case "ArrowLeft":
          case "e":
          case "ㄷ":
          case "ArrowRight":
          case "f":
          case "ㄹ":
            setHover((h) => !h);
            break;
          case "Enter":
          case "g":
          case "ㅎ":
            nav(`/${playModes[idx].id}`);
            break;
          case "Escape":
          case "`":
            close();
            break;
        }
        return;
      }
      /* 카드 네비게이션 */
      switch (e.key) {
        case "ArrowLeft":
        case "e":
        case "ㄷ":
          swipe("right");
          break;
        case "ArrowRight":
        case "f":
        case "ㄹ":
          swipe("left");
          break;
        case "Enter":
        case "g":
        case "ㅎ":
          nav(`/${playModes[idx].id}`);
          break;
        case "Escape":
        case "`":
          nav("/main");
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, show, nav]);

  /* ── helpers ── */
  /** 순환하지 않고, 첫 / 마지막에서 멈춤 */
  const swipe = (dir: "left" | "right") =>
    setIdx((p) => {
      if (dir === "left") {
        return p < playModes.length - 1 ? p + 1 : p;   // 마지막이면 그대로
      } else {
        return p > 0 ? p - 1 : p;                      // 첫 번째면 그대로
      }
    });

  const open = () => {
    setAnim(true);
    setTimeout(() => setShow(true), 400);
  };
  const close = () => {
    setShow(false);
    setAnim(false);
    setHover(true);
  };

  /* touch swipe */
  const onTS = (e: React.TouchEvent) => setTouch(e.touches[0].clientX);
  const onTE = (e: React.TouchEvent) => {
    if (touchX == null) return;
    const diff = touchX - e.changedTouches[0].clientX;
    if (diff > 50) swipe("left");
    else if (diff < -50) swipe("right");
    setTouch(null);
  };

  /* ── 현재/이전/다음 카드 계산 ── */
  const cur  = playModes[idx];
  const prev = playModes[(idx - 1 + playModes.length) % playModes.length];
  const next = playModes[(idx + 1) % playModes.length];

  /* 첫/끝 모드일 때 희미 카드 & 화살표 표시 여부 */
  const showPrev = idx > 0;
  const showNext = idx < playModes.length - 1;

  /* ── 렌더 ── */
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white select-none">
      <div className="flex flex-col items-center" onTouchStart={onTS} onTouchEnd={onTE}>
        {/* 헤더 */}
        <motion.h2
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[3.5rem] font-extrabold mb-12 tracking-tight
                     bg-gradient-to-r from-purple-100 via-purple-200 to-indigo-100
                     bg-clip-text text-transparent"
        >
          플레이 모드 선택
        </motion.h2>

        {/* --- 카드 스택 (prev / current / next) --- */}
        <div className="relative w-[60rem] h-[60rem] flex items-center justify-center">
          {/* 좌측 희미한 카드 */}
          {showPrev && (
            <motion.img
              key={`prev-${prev.id}`}
              src={prev.gif}
              alt=""
              initial={{ opacity: 0, scale: 0.8, x: -600 }}
              animate={{ opacity: 0.25, scale: 0.8, x: -600 }}
              transition={{ duration: 0.5 }}
              className="absolute top-0 h-full w-full object-cover rounded-3xl pointer-events-none"
            />
          )}

          {/* 우측 희미한 카드 */}
          {showNext && (
            <motion.img
              key={`next-${next.id}`}
              src={next.gif}
              alt=""
              initial={{ opacity: 0, scale: 0.8, x: 600 }}
              animate={{ opacity: 0.25, scale: 0.8, x: 600 }}
              transition={{ duration: 0.5 }}
              className="absolute top-0 h-full w-full object-cover rounded-3xl pointer-events-none"
            />
          )}

          {/* 현재 카드 */}
          <AnimatePresence mode="wait">
            <motion.div
              key={cur.id}
              initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: 10 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative bg-white/10 border border-white/10 backdrop-blur-lg p-8
                         rounded-3xl w-full h-full flex flex-col justify-center items-center
                         text-center gap-6 shadow-[0_0_40px_10px_rgba(183,119,223,0.2)]"
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-3xl
                               bg-gradient-to-br from-purple-600/10 via-indigo-500/5 to-transparent"
              />
              <motion.img
                src={cur.gif}
                alt="mode"
                className="w-full h-[80%] object-cover rounded-lg shadow-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              />
              <motion.p
                className="text-[1.35rem] font-semibold whitespace-pre-line leading-snug"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {cur.description}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 인디케이터 */}
        <Pills total={playModes.length} idx={idx} />

        {/* 네비 & 타이틀 */}
        <div className="flex items-center gap-8 mt-12 text-[2rem]">
          <button
            onClick={() => swipe("right")}
            disabled={idx === 0}
            className={`transition-transform ${
              idx === 0
                ? "text-gray-600 cursor-default"
                : "text-[#b777df]/60 hover:text-purple-300 hover:-translate-x-2"
            }`}
          >
            ◀
          </button>

          <motion.div
            layout
            onClick={open}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className={`${
              anim ? "bg-[#b777df]/90 border-white border-4" : "bg-[#b777df]/50"
            } backdrop-blur-lg py-6 px-10 rounded-2xl text-center cursor-pointer shadow-md`}
          >
            <h3 className="text-[1.75rem] font-bold whitespace-pre-line text-white drop-shadow">
              {cur.title}
            </h3>
          </motion.div>

          <button
            onClick={() => swipe("left")}
            disabled={idx === playModes.length - 1}
            className={`transition-transform ${
              idx === playModes.length - 1
                ? "text-gray-600 cursor-default"
                : "text-[#b777df]/60 hover:text-purple-300 hover:translate-x-2"
            }`}
          >
            ▶
          </button>
        </div>
      </div>

      {/* 확인 모달 */}
      {show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4 bg-gray-900/95 text-white p-10 rounded-3xl shadow-xl w-[32rem]"
          >
            <p className="text-[1.5rem] text-center leading-snug">
              <span className="font-bold text-green-400 drop-shadow-md">{cur.title}</span>
              {" "}을(를) 선택하시겠습니까?
            </p>
            <div className="flex justify-around mt-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className={`py-3 px-8 text-[1.25rem] rounded-full font-semibold shadow-lg
                            ${hover ? "bg-green-600 border-4 border-white" : "bg-green-500 hover:bg-green-600"}`}
                onClick={() => nav(`/${cur.id}`)}
              >
                확인
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className={`py-3 px-8 text-[1.25rem] rounded-full font-semibold shadow-lg
                            ${!hover ? "bg-red-600 border-4 border-white" : "bg-red-500 hover:bg-red-600"}`}
                onClick={close}
              >
                취소
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Main;
