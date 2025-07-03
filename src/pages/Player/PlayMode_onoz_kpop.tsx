/* ──────────────────────────────
 *  src/pages/Player/PlayMode1.tsx
 *  - 단일 영상 재생 (video_url)
 *  - 좌우 반전(h/ㅗ), 속도·투명·볼륨·점프 컨트롤
 *  - 왼쪽 상단 상태 패널(아이콘·세로형)
 * ────────────────────────────── */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PocketBase from "pocketbase";
import spinner from "../../assets/images/spinner.gif";
import JoystickGuide from "../../components/JoystickGuide";

const BASE_URL = "https://ai-dam-smartmirror-pb-floral-lake-8577.fly.dev";
const pb = new PocketBase(BASE_URL);
pb.autoCancellation(false);                // dev 환경 자동취소 방지

const fmt = (t: number) =>
  `${Math.floor(t / 60)}:${`${Math.floor(t % 60)}`.padStart(2, "0")}`;

/* 상태 아이콘 */
const icons = { speed: "⏩️", opa: "🎞️", vol: "🔊", flip: "🔄" };

const PlayMode1: React.FC = () => {
  const nav = useNavigate();
  const { id } = useParams();

  /* refs & state */
  const vidRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [src, setSrc] = useState("");
  const [dur, setDur] = useState(0);
  const [cur, setCur] = useState(0);
  const [vw, setVW] = useState(0);
  const [rate, setRate] = useState(1.0);
  const [opa, setOpa] = useState(100);
  const [vol, setVol] = useState(50);
  const [flip, setFlip] = useState(false);
  const [jumpMsg, setJumpMsg] = useState("");

  /* 1. 메타데이터 */
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const d: any = await pb.collection("videos").getOne(id);
        setSrc(d.video_url);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* 2. 키보드 */
  useEffect(() => {
    const hd = (e: KeyboardEvent) => {
      const v = vidRef.current;
      if (!v) return;
      let msg = "";

      switch (e.key) {
        case " ": case "g": case "ㅎ": v.paused ? v.play() : v.pause(); break;
        case "ArrowLeft": case "e": case "ㄷ": setOpa(o => Math.max(0, o - 10)); break;
        case "ArrowRight": case "f": case "ㄹ": setOpa(o => Math.min(100, o + 10)); break;
        case "ArrowDown": case "d": case "ㅇ": setRate(r => Math.max(0.5, r - 0.1)); break;
        case "ArrowUp":   case "c": case "ㅊ": setRate(r => Math.min(2.0, r + 0.1)); break;
        case "k": case "ㅏ": v.currentTime -= 10; msg = "10초 ⏪️"; break;
        case "l": case "ㅣ": v.currentTime -= 5;  msg = "5초 ⏪️"; break;
        case "r": case "ㄱ": v.currentTime += 5;  msg = "5초 ⏩️"; break;
        case "m": case "ㅡ": v.currentTime += 10; msg = "10초 ⏩️"; break;
        case "n": case "ㅜ": setVol(t => Math.max(0, t - 5)); break;
        case "o": case "ㅐ": setVol(t => Math.min(100, t + 5)); break;
        case "h": case "ㅗ": setFlip(f => !f); break;
        case "Escape": case "j": case "ㅓ": nav(-2); break;
        case "`": nav(-2); break;
      }
      if (msg) { setJumpMsg(msg); setTimeout(() => setJumpMsg(""), 1000); }
    };
    window.addEventListener("keydown", hd);
    return () => window.removeEventListener("keydown", hd);
  }, [nav]);

  /* 3. 동기화 & 리사이즈 */
  useEffect(() => { if (vidRef.current) vidRef.current.playbackRate = rate; }, [rate]);
  useEffect(() => { if (vidRef.current) vidRef.current.volume = vol / 100; }, [vol]);
  useEffect(() => {
    const v = vidRef.current;
    if (!v) return;
    const t = () => setCur(v.currentTime);
    const m = () => setDur(v.duration);
    const r = () => setVW(v.clientWidth);
    window.addEventListener("resize", r); r();
    v.addEventListener("timeupdate", t);
    v.addEventListener("loadedmetadata", m);
    return () => {
      window.removeEventListener("resize", r);
      v.removeEventListener("timeupdate", t);
      v.removeEventListener("loadedmetadata", m);
    };
  }, [src]);

  if (loading) return <div className="text-white text-xl">로딩 중…</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="flex flex-col items-center relative w-full h-full">
        {!src && <div className="text-lg">영상이 없습니다</div>}
        {!src && <JoystickGuide />}

        {src && (
          <>
            {!vidRef.current?.readyState &&
              <img src={spinner} alt="loading"
                   className="absolute inset-0 w-20 h-20 m-auto" />}

            <video
              ref={vidRef}
              src={src}
              autoPlay
              loop
              style={{
                width: "100vw", height: "100vh", objectFit: "cover",
                opacity: opa / 100, transform: flip ? "scaleX(-1)" : "none",
                pointerEvents: "none", userSelect: "none",
              }}
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
            />

            {/* ─── 프로그레스 ─── */}
            <div className="absolute h-3 bg-[#b777df]/40 rounded-full"
                 style={{ top: "5vh", left: "50%", transform: "translateX(-50%)", width: vw }}>
              <div className="h-full bg-[#b777df] rounded-full"
                   style={{ width: `${dur ? (cur / dur) * 100 : 0}%` }} />
            </div>

            {/* 시간 */}
            <div className="absolute text-2xl"
                 style={{ top: "5.5vh", left: "50%", transform: "translateX(-50%)" }}>
              {fmt(cur)} / {fmt(dur)}
            </div>

            {/* 상태 패널 (왼쪽 상단) */}
            <div
              className="absolute bg-black/60 rounded-lg pointer-events-none text-xl space-y-4"
              style={{ top: "300px", left: "20px", padding: "12px 16px" }}
            >
              <div className="flex items-center space-x-2">
                <span>{icons.speed}</span><span>배속 {rate.toFixed(1)}x</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>{icons.opa}</span><span>투명 {opa}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>{icons.vol}</span><span>볼륨 {vol}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>{icons.flip}</span><span>반전 {flip ? "ON" : "OFF"}</span>
              </div>
            </div>

            {/* 조이스틱 가이드 & 점프 메시지 */}
            <JoystickGuide />
            {jumpMsg &&
              <div className="absolute text-xl bg-black/70 px-4 py-2 rounded-md"
                   style={{ top: "8vh", left: "50%", transform: "translateX(-50%)" }}>
                {jumpMsg}
              </div>}
          </>
        )}
      </div>
    </div>
  );
};

export default PlayMode1;
