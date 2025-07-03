import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PocketBase from "pocketbase";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = "https://ai-dam-smartmirror-pb-floral-lake-8577.fly.dev";
const pb = new PocketBase(BASE_URL);

/* ────────────────────────────────────────────────
 *  영상 목록 + 메타데이터
 * ──────────────────────────────────────────────── */
const fetchVideoData = async () => {
  try {
    const videos = await pb
      .collection("videos")
      .getFullList({ expand: "artist_name", sort: "-updated" });

    return videos
      .filter((v: any) => v.agency === "ONOZ") // ① ONOZ 전용
      .map((v: any) => ({                     // ② URL 가공
        ...v,
        thumbnailUrl: `${BASE_URL}/api/files/${v.collectionId}/${v.id}/${v.thumbnail}`,
        albumUrl:     `${BASE_URL}/api/files/${v.collectionId}/${v.id}/${v.album}`,
      }));
  } catch (err) {
    console.error("Error fetching videos", err);
    return [];
  }
};

/* ---------------------------------------------
 *  헬퍼: 선택 카드 → 화면 세로 중앙
 * --------------------------------------------- */
const centerVertically = (el: HTMLElement) => {
  const rect   = el.getBoundingClientRect();
  const offset = rect.top - (window.innerHeight - rect.height) / 2; // (+면 내려가고 -면 올라감)
  window.scrollBy({ top: offset, behavior: "smooth" });            // 세로 중앙
  el.scrollIntoView({ behavior: "smooth", inline: "center" });     // 가로 중앙
};

/* ────────────────────────────────────────────────
 *  컴포넌트
 * ──────────────────────────────────────────────── */
const Mode_onoz_kpop: React.FC = () => {
  const navigate = useNavigate();

  const [videos, setVideos]   = useState<any[]>([]);
  const [selectedIndex, setSelected] = useState(0);
  const [flash, setFlash]     = useState(false);
  const [back, setBack]       = useState(false);

  const numCols = 4;                             // 한 줄 4개
  const refs    = useRef<(HTMLDivElement|null)[]>([]);

  /* 초기 데이터 로드 */
  useEffect(() => {
    localStorage.setItem("lastVisitedPage", "mode_onoz_kpop");
    (async () => {
      const data = await fetchVideoData();
      setVideos(data);
      setFlash(true); setTimeout(() => setFlash(false), 600);
    })();
  }, []);

  /* 키보드 핸들러 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (back) return;

      // 페이지 스크롤 10 %
      if (e.key === "h" || e.key === "ㅗ") {
        window.scrollBy({ top: -window.innerHeight * 0.1, behavior: "smooth" });
        return;
      }
      if (e.key === "i" || e.key === "ㅑ") {
        window.scrollBy({ top:  window.innerHeight * 0.1, behavior: "smooth" });
        return;
      }

      switch (e.key) {
        case "ArrowRight": case "f": case "ㄹ":
          setSelected((p) => (p + 1) % (videos.length + 1)); break;
        case "ArrowLeft":  case "e": case "ㄷ":
          setSelected((p) => (p - 1 + videos.length + 1) % (videos.length + 1)); break;
        case "ArrowDown":  case "d": case "ㅇ":
          setSelected((p) => (p + numCols < videos.length ? p + numCols : p)); break;
        case "ArrowUp":    case "c": case "ㅊ":
          setSelected((p) => (p - numCols >= 0 ? p - numCols : p)); break;
        case "Enter": case "g": case "ㅎ":
          if (selectedIndex === videos.length) {
            setBack(true); setTimeout(() => navigate(-1), 300);
          } else {
            navigate(`/video/info/${videos[selectedIndex].id}`);
          }
          break;
        case "Escape": case "j": case "ㅓ":
          setBack(true); setTimeout(() => navigate(-1), 400); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [videos.length, selectedIndex, back, navigate]);

  /* 선택 카드 → 화면 중앙 (레이아웃 확정 뒤) */
  useLayoutEffect(() => {
    const el = refs.current[selectedIndex];
    if (!el) return;
    requestAnimationFrame(() => centerVertically(el));
  }, [selectedIndex]);

  /* ── UI ── */
  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-white px-12 md:px-20 select-none">

      {/* 헤더 */}
      <motion.h1 initial={{opacity:0,y:-25}} animate={{opacity:1,y:0}}
        className="text-[3rem] md:text-[3.5rem] font-extrabold mt-10
                   bg-gradient-to-r from-purple-100 via-purple-200 to-indigo-100
                   bg-clip-text text-transparent drop-shadow-lg">
        K&nbsp;POP Tutorial Mode
      </motion.h1>
      <p className="text-[1.4rem] my-6 text-center text-gray-300">
        ONOZ Crew 공식 튜토리얼 컬렉션
      </p>

      {/* 썸네일 그리드 */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={flash ? "flash-on" : "flash-off"}
          initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          {videos.map((v, idx) => {
            const active = selectedIndex === idx;
            return (
              <motion.div
                key={v.id}
                ref={(el)=>refs.current[idx]=el}
                initial={{opacity:0, scale:0.9}}
                animate={{opacity:1, scale: active?1.08:1}}
                transition={{delay: idx*0.02}}
                whileHover={{scale:1.05}}
                className={`relative p-3 rounded-xl cursor-pointer shadow-lg
                            ${active? "border-4 border-white ring-2 ring-purple-300 bg-[#b777df]/30"
                                     :"border border-white/20 bg-[#b777df]/20 hover:border-white/50"}`}
                onClick={()=>navigate(`/video/info/${v.id}`)}>

                <img src={v.thumbnailUrl} alt="thumb"
                     className="w-full aspect-[3/4] object-cover rounded-lg" />

                <div className="mt-3 text-center space-y-1">
                  <h3 className="text-lg md:text-xl font-semibold truncate">{v.song_name}</h3>
                  <p className="text-sm md:text-base text-gray-300 truncate">
                    {v.expand?.artist_name?.name}
                  </p>
                  <img src={v.albumUrl} alt="album"
                       className="w-14 h-14 object-cover rounded-md mx-auto mt-2" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* 돌아가기 */}
      <motion.button
        whileHover={{scale:1.05}} whileTap={{scale:0.95}}
        onClick={()=>navigate(-1)}
        className={`mt-12 px-8 py-4 rounded-full text-[1.2rem] font-semibold shadow-lg
                    ${selectedIndex===videos.length || back
                      ? "border-4 border-white bg-blue-700"
                      : "bg-blue-600/80 hover:bg-blue-600"}`}>
        돌아가기
      </motion.button>
    </div>
  );
};

export default Mode_onoz_kpop;
