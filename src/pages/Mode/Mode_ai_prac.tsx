import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PocketBase from "pocketbase";
import { motion, AnimatePresence } from "framer-motion";

const BASE = "https://ai-dam-smartmirror-pb-floral-lake-8577.fly.dev";
const pb   = new PocketBase(BASE);
pb.autoCancellation(false);

const NUM_COLS   = 4;
const UPLOAD_URL = "https://auth.ai-dam.ai/upload.html";
const QR_SRC     = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(UPLOAD_URL)}`;

/* ─── jobs 로드 ─── */
async function loadJobs() {
  const rows = await pb.collection("jobs").getFullList({
    sort: "-created",
    filter: "status = 'done' || status = 'processing'",
  });
  return rows.map((r: any) => ({
    ...r,
    thumb: `${BASE}/api/files/${r.collectionId}/${r.id}/${r.firstFrame}`,
    src  : `${BASE}/api/files/${r.collectionId}/${r.id}/${r.video}`,
    ai   : `${BASE}/api/files/${r.collectionId}/${r.id}/${r.result}`,
  }));
}

const Mode_ai_prac: React.FC = () => {
  const nav = useNavigate();

  const [jobs, setJobs] = useState<any[]>([]);
  const [idx,  setIdx ] = useState(0);
  const [back, setBack] = useState(false);
  const [flash, setFlash] = useState(false);

  const refs = useRef<(HTMLDivElement|null)[]>([]);

  /* 첫 로딩 & 새로고침 */
  const reload = async () => {
    setJobs(await loadJobs());
    setIdx(0);
    setFlash(true); setTimeout(()=>setFlash(false), 600);
  };
  useEffect(()=>localStorage.setItem("lastVisitedPage","mode_ai_prac"), []);
  useEffect(()=>{ reload(); }, []);

  /* ── 키보드 ── */
  useEffect(() => {
    const hd = (e: KeyboardEvent) => {
      if (back) return;
      const max = jobs.length;

      /* 새로고침: o / ㅐ */
      if (e.key === "o" || e.key === "ㅐ") { reload(); return; }

      const next = (v:number)=> setIdx(p => (p+v+max+1)%(max+1));
      switch (e.key) {
        case "ArrowRight": case "f": case "ㄹ": next(1);  break;
        case "ArrowLeft" : case "e": case "ㄷ": next(-1); break;
        case "ArrowDown" : case "d": case "ㅇ": if (idx+NUM_COLS < max) next(NUM_COLS); break;
        case "ArrowUp"   : case "c": case "ㅊ": if (idx-NUM_COLS >= 0)  next(-NUM_COLS); break;
        case "Enter": case "g": case "ㅎ":
          if (idx === max) { setBack(true); setTimeout(()=>nav(-1),300); }
          else             { nav(`/player/mode_ai_prac/${jobs[idx].id}`); }
          break;
        case "Escape": case "j": case "ㅓ":
          setBack(true); setTimeout(()=>nav(-1),400); break;
      }
    };
    window.addEventListener("keydown", hd);
    return () => window.removeEventListener("keydown", hd);
  }, [idx, back, jobs.length, nav]);

  /* 선택 카드 가로 스크롤 */
  useEffect(() => {
    refs.current[idx]?.scrollIntoView({ behavior:"smooth", block:"nearest", inline:"center" });
  }, [idx]);

  /* ─── UI ─── */
  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-white px-12 md:px-24 select-none">

      {/* 헤더 */}
      <motion.h1 initial={{opacity:0, y:-20}} animate={{opacity:1, y:0}}
        className="text-[2.75rem] md:text-[3.25rem] font-extrabold mt-12 mb-8
                   bg-gradient-to-r from-purple-100 via-purple-200 to-indigo-100
                   bg-clip-text text-transparent drop-shadow-lg">
        🪄 AI 영상 모드
      </motion.h1>

      {/* QR 안내 카드 */}
      <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} transition={{delay:0.3}}
        className="relative flex flex-col items-center bg-white/10 border border-white/10 backdrop-blur-lg
                   p-6 md:p-8 rounded-3xl shadow-[0_0_30px_6px_rgba(183,119,223,0.25)]">
        <span className="pointer-events-none absolute inset-0 rounded-3xl
                         bg-gradient-to-br from-purple-600/10 via-indigo-500/5 to-transparent"/>
        <img src={QR_SRC} alt="QR" className="w-[180px] md:w-[220px] h-auto rounded-md shadow-lg z-10"/>
        <p className="mt-4 text-lg md:text-xl text-center leading-snug z-10">
          휴대폰 카메라로 QR을 스캔하여<br/>영상(100MB 이하)을 업로드해 주세요!
        </p>
        <p className="mt-3 text-[1.25rem] text-[#c5c5c5] font-medium z-10">
          새로고침{" "}
          <kbd className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-white/60">
            +
          </kbd>
        </p>
      </motion.div>

      {/* 썸네일 그리드 */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={flash ? "flash-on" : "flash-off"}
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full mt-10 transition">  {/* ★ ring 제거 */}
          {jobs.map((j,i)=>(
            <motion.div key={j.id} ref={el=>refs.current[i]=el}
              initial={{opacity:0, scale:0.9}}
              animate={{opacity:1, scale: idx===i?1.08:1}}
              transition={{delay:i*0.03}}
              whileHover={{scale:1.04}}
              className={`relative p-2 rounded-xl cursor-pointer overflow-hidden shadow-lg transition-colors duration-300
                          ${idx===i
                            ? "bg-[#b777df]/30 border-4 border-purple-300 ring-2 ring-purple-300 \
                               shadow-[0_0_25px_8px_rgba(183,119,223,0.45)]"   // ★ 밝기 + 글로우
                            : "bg-[#b777df]/25 border border-transparent hover:border-white/60"}`}  /* ★ 외곽선 투명 */
              onClick={()=>nav(`/player/mode_ai_prac/${j.id}`)}>

              <img src={j.thumb} alt="thumb" className="w-full aspect-[3/4] object-cover rounded-md"/>

              {j.status === "processing" && (
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded
                                text-xs font-semibold animate-pulse z-20">
                  AI 처리중
                </div>
              )}

              <p className="mt-2 text-center text-base md:text-lg font-medium truncate z-10">
                {j.name || j.fileName || `JOB #${j.id}`}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* 돌아가기 */}
      <motion.button
        whileHover={{scale:1.05}} whileTap={{scale:0.95}}
        onClick={()=>nav(-1)}
        className={`mt-12 px-8 py-4 rounded-full text-[1.2rem] font-semibold shadow-lg
                    ${idx===jobs.length || back
                      ? "border-4 border-white bg-blue-700"
                      : "bg-blue-600/80 hover:bg-blue-600"}`}>
        돌아가기
      </motion.button>
    </div>
  );
};

export default Mode_ai_prac;
