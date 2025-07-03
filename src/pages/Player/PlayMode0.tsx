/* ──────────────────────────────
 *  src/pages/Player/PlayMode1.tsx

튜토리얼, 안무영상 둘중하나 선택하는옵션 (좌우반전 기능은 빠져있음)

 * ────────────────────────────── */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PocketBase from "pocketbase";
import spinner from "../../assets/images/spinner.gif";
import JoystickGuide from "../../components/JoystickGuide";  // 추가

const BASE_URL = "https://ai-dam-smartmirror-pb-floral-lake-8577.fly.dev";
const pb = new PocketBase(BASE_URL);

/* ────────── 유틸 ────────── */
const fmt = (t: number) =>
  `${Math.floor(t / 60)}:${`${Math.floor(t % 60)}`.padStart(2, "0")}`;

/* ────────── 컴포넌트 ────────── */
const PlayMode1: React.FC = () => {
  const nav          = useNavigate();
  const { id }       = useParams();

  /* refs & states --------------------------------------------------- */
  const videoRef              = useRef<HTMLVideoElement>(null);
  const [video,       setVideo]       = useState<any>(null);

  const [loading,     setLoading]     = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoSrc,    setVideoSrc]    = useState("");

  const [duration,    setDuration]    = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoWidth,  setVideoWidth]  = useState(0);

  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [opacity,      setOpacity]      = useState(100);
  const [volume,       setVolume]       = useState(50);
  const [jumpMsg,      setJumpMsg]      = useState("");

  /* 메뉴: 0 = 튜토리얼, 1 = 안무 ------------------------------------ */
  const [isMenu,   setIsMenu]   = useState(false);
  const [hoverIdx, setHoverIdx] = useState<0 | 1>(0);

  /* ───────────────── 1. 메타데이터 로드 ───────────────── */
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const d = await pb.collection("videos").getOne(id, { expand: "artist_name" });
        setVideo({
          ...d,
          tutorialUrl: d.video_url,
          choreoUrl:   d.video_url_original,
        });
        // 두 URL 모두 있으면 메뉴, 아니면 바로 재생
        if (d.video_url && d.video_url_original) {
          setIsMenu(true);
        } else {
          setVideoSrc(d.video_url || d.video_url_original);
        }
      } catch (err) {
        console.error("Video fetch error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  /* ───────────────── 2. 키보드 핸들러 ───────────────── */
  useEffect(() => {
    const hd = (e: KeyboardEvent) => {
      /* ── 메뉴 상태 ───────────────── */
      if (isMenu) {
        if (["ArrowLeft", "e", "ㄷ", "ArrowRight", "f", "ㄹ"].includes(e.key))
          setHoverIdx((p) => (p === 0 ? 1 : 0));

        if (["Enter", "g", "ㅎ"].includes(e.key)) {
          setVideoSrc(hoverIdx === 0 ? video.tutorialUrl : video.choreoUrl);
          setIsMenu(false);
        } else if (["Escape", "j", "ㅓ"].includes(e.key)) {
          nav(-2);
        }
        return;
      }

      /* ── 재생 화면 ───────────────── */
      if (!videoRef.current) return;
      let msg = "";

      switch (e.key) {
        /* ▶/⏸ */
        case " ":
        case "g":
        case "ㅎ":
          videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
          break;

        /* 투명도 */
        case "ArrowLeft":
        case "e":
        case "ㄷ":
          setOpacity((o) => Math.max(0, o - 10));
          break;
        case "ArrowRight":
        case "f":
        case "ㄹ":
          setOpacity((o) => Math.min(100, o + 10));
          break;

        /* 배속 */
        case "ArrowDown":
        case "d":
        case "ㅇ":
          setPlaybackRate((r) => Math.max(0.5, r - 0.1));
          break;
        case "ArrowUp":
        case "c":
        case "ㅊ":
          setPlaybackRate((r) => Math.min(2.0, r + 0.1));
          break;

        /* 점프 */
        case "k":
        case "ㅏ":
          videoRef.current.currentTime -= 10;
          msg = "10초 ⏪️";
          break;
        case "l":
        case "ㅣ":
          videoRef.current.currentTime -= 5;
          msg = "5초 ⏪️";
          break;
        case "r":
        case "ㄱ":
          videoRef.current.currentTime += 5;
          msg = "5초 ⏩️";
          break;
        case "m":
        case "ㅡ":
          videoRef.current.currentTime += 10;
          msg = "10초 ⏩️";
          break;

        /* 볼륨 */
        case "n":
        case "ㅜ":
          setVolume((v) => Math.max(0, v - 5));
          break;
        case "o":
        case "ㅐ":
          setVolume((v) => Math.min(100, v + 5));
          break;

        /* 뒤로가기 */
        case "Escape":
        case "j":
        case "ㅓ":
          setVideoSrc("");
          setIsMenu(true);
          break;
        case "`":
          nav(-2);
          break;
      }

      if (msg) {
        setJumpMsg(msg);
        setTimeout(() => setJumpMsg(""), 1000);
      }
    };

    window.addEventListener("keydown", hd);
    return () => window.removeEventListener("keydown", hd);
  }, [isMenu, hoverIdx, video, nav]);

  /* ───────────────── 3. 비디오 속성 동기화 ───────────────── */
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    const onResize = () => setVideoWidth(v.clientWidth);

    window.addEventListener("resize", onResize);
    onResize();

    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);

    return () => {
      window.removeEventListener("resize", onResize);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [videoSrc]);

  /* ───────────────── 4. 렌더링 ───────────────── */
  if (loading || !video)
    return <div className="text-white text-xl">로딩 중...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      {/* ───── 메뉴 선택 UI ───── */}
      {isMenu && (
        <div className="flex gap-8">
          {["튜토리얼 영상", "안무 영상"].map((label, idx) => (
            <button
              key={idx}
              onMouseEnter={() => setHoverIdx(idx as 0 | 1)}
              onClick={() => {                    /* ← Click 시 바로 재생 */
                setVideoSrc(idx === 0 ? video.tutorialUrl : video.choreoUrl);
                setIsMenu(false);
              }}
              className={`py-2 px-5 text-[1.35rem] rounded-lg font-semibold transition-all
                          ${hoverIdx === idx
                            ? "bg-[#b777df]/40 border-4 border-white"
                            : "bg-gray-700 text-gray-300"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ───── 비디오 화면 ───── */}
      {!isMenu && (
        <div className="flex flex-col items-center relative w-full h-full">
          {!videoLoaded && (
            <img
              src={spinner}
              alt="loading"
              className="absolute inset-0 w-20 h-20 m-auto"
            />
          )}

          <video
            ref={videoRef}
            autoPlay
            loop
            style={{
              width: "100vw",
              height: "100vh",
              objectFit: "cover",
              opacity: opacity / 100,
              pointerEvents: "none",
              userSelect: "none",
            }}
            onLoadedData={() => setVideoLoaded(true)}
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>

          {/* 프로그레스 바 */}
          <div
            className="absolute h-3 bg-[#b777df]/40 rounded-full"
            style={{
              top: "4vh",
              left: "50%",
              transform: "translateX(-50%)",
              width: videoWidth,
            }}
          >
            <div
              className="h-full bg-[#b777df]/100 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>

          {/* 시간 표시 */}
          <div
            className="absolute text-sm"
            style={{
              top: "5.3vh",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {fmt(currentTime)} / {fmt(duration)}
          </div>

          {/* 상태바 */}
          <div
            className="absolute text-xl bg-black/60 px-4 pb-2 rounded-md"
            style={{
              top: "6.8vh",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            배속 {playbackRate.toFixed(1)}x | 투명 {opacity}% | 볼륨 {volume}%
          </div>

          {/* 조이스틱 사용 가이드 */}
          <JoystickGuide />


          {/* 점프 메시지 */}
          {jumpMsg && (
            <div
              className="absolute text-xl bg-black/70 px-4 py-2 rounded-md"
              style={{
                top: "8vh",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              {jumpMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayMode1;
