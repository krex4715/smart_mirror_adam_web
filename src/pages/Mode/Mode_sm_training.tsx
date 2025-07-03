import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PocketBase from "pocketbase";
import { motion, AnimatePresence } from "framer-motion";

/* ───────── PocketBase ───────── */
const BASE_URL = "https://ai-dam-smartmirror-pb-floral-lake-8577.fly.dev";
const pb       = new PocketBase(BASE_URL);

/* 섹션 목록 불러오기 */
const fetchSections = async () => {
  try {
    const recs = await pb
      .collection("video_sections")
      .getFullList({ sort: "-updated" });

    return recs.map((r: any) => ({
      id: r.id,
      title:
        r.title ??
        Object.keys(r.nav_maps ?? r.nav_map ?? {})[0] ??
        "Untitled",
      thumbnail: r.thumbnail
        ? pb.files.getUrl(r, r.thumbnail)
        : "https://placehold.co/300x400?text=No+Thumbnail",
    }));
  } catch (err) {
    console.error("Error fetching sections:", err);
    return [];
  }
};

/* 선택 카드 → 화면 세로 중앙 */
const centerVertically = (el: HTMLElement) => {
  const rect   = el.getBoundingClientRect();
  const offset = rect.top - (window.innerHeight - rect.height) / 2;
  window.scrollBy({ top: offset, behavior: "smooth" });          // Y축
  el.scrollIntoView({ behavior: "smooth", inline: "center" });   // X축
};

/* ───────── 컴포넌트 ───────── */
const Mode_sm_training: React.FC = () => {
  const navigate = useNavigate();

  const [sections, setSections] = useState<any[]>([]);
  const [idx, setIdx]           = useState(0);
  const [back, setBack]         = useState(false);
  const [flash, setFlash]       = useState(false);

  const numCols = 4;
  const refs    = useRef<(HTMLDivElement | null)[]>([]);

  /* 초기 로드 */
  useEffect(() => {
    localStorage.setItem("lastVisitedPage", "mode_sm_training");
    (async () => {
      const data = await fetchSections();
      setSections(data);
      setFlash(true);
      setTimeout(() => setFlash(false), 600);
    })();
  }, []);

  /* 키보드 핸들러 */
  useEffect(() => {
    const hd = (e: KeyboardEvent) => {
      if (back) return;

      /* 페이지 스크롤 10 % */
      if (e.key === "h" || e.key === "ㅗ") {
        window.scrollBy({ top: -window.innerHeight * 0.1, behavior: "smooth" });
        return;
      }
      if (e.key === "i" || e.key === "ㅑ") {
        window.scrollBy({ top: window.innerHeight * 0.1, behavior: "smooth" });
        return;
      }

      const max = sections.length;
      const nextIdx = (v: number) =>
        setIdx((p) => (p + v + max + 1) % (max + 1));

      switch (e.key) {
        case "ArrowRight":
        case "f":
        case "ㄹ":
          nextIdx(1);
          break;
        case "ArrowLeft":
        case "e":
        case "ㄷ":
          nextIdx(-1);
          break;
        case "ArrowDown":
        case "d":
        case "ㅇ":
          if (idx + numCols < max) nextIdx(numCols);
          break;
        case "ArrowUp":
        case "c":
        case "ㅊ":
          if (idx - numCols >= 0) nextIdx(-numCols);
          break;
        case "Enter":
        case "g":
        case "ㅎ":
          if (idx === max) {
            setBack(true);
            setTimeout(() => navigate(-1), 300);
          } else {
            navigate(`/player/mode_sm_training/${sections[idx].id}`);
          }
          break;
        case "Escape":
        case "j":
        case "ㅓ":
          setBack(true);
          setTimeout(() => navigate(-1), 400);
          break;
      }
    };

    window.addEventListener("keydown", hd);
    return () => window.removeEventListener("keydown", hd);
  }, [idx, back, sections.length, navigate]);

  /* 선택 카드 중앙 맞춤 */
  useLayoutEffect(() => {
    const el = refs.current[idx];
    if (el) requestAnimationFrame(() => centerVertically(el));
  }, [idx]);

  /* ───────── 렌더 ───────── */
  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-white px-12 md:px-24 select-none">

      {/* 헤더 */}
      <motion.h1
        initial={{ opacity: 0, y: -25 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[3rem] md:text-[3.25rem] font-extrabold mt-10
                   bg-gradient-to-r from-purple-100 via-purple-200 to-indigo-100
                   bg-clip-text text-transparent drop-shadow-lg"
      >
        Smart&nbsp;Mirror Training Mode
      </motion.h1>

      {/* 카드 그리드 */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={flash ? "flash-on" : "flash-off"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 w-full mt-10 transition"
        >
          {sections.map((s, i) => (
            <motion.div
              key={s.id}
              ref={(el) => (refs.current[i] = el)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: idx === i ? 1.08 : 1 }}
              transition={{ delay: i * 0.02 }}
              whileHover={{ scale: 1.05 }}
              className={`relative p-3 rounded-xl cursor-pointer overflow-hidden shadow-lg transition-colors duration-300
                          ${
                            idx === i
                              ? "bg-[#b777df]/30 border-4 border-purple-300 ring-2 ring-purple-300 shadow-[0_0_25px_8px_rgba(183,119,223,0.45)]"
                              : "bg-[#b777df]/25 border border-transparent hover:border-white/60"
                          }`}
              onClick={() => navigate(`/player/mode_sm_training/${s.id}`)}
            >
              <img
                src={s.thumbnail}
                alt="thumb"
                className="w-full aspect-[3/4] object-cover rounded-lg"
              />
              <h3 className="mt-3 text-center text-lg md:text-xl font-semibold truncate">
                {s.title}
              </h3>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* 돌아가기 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate(-1)}
        className={`mt-12 px-8 py-4 rounded-full text-[1.2rem] font-semibold shadow-lg
                    ${
                      idx === sections.length || back
                        ? "border-4 border-white bg-blue-700"
                        : "bg-blue-600/80 hover:bg-blue-600"
                    }`}
      >
        돌아가기
      </motion.button>
    </div>
  );
};

export default Mode_sm_training;
