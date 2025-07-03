/*  src/pages/Player/sm/PlayMode_sm_record.tsx
 *  Smart-Mirror 촬영 모드 ― 90° CW + 좌우반전 (HD 30 fps, 업로드 직전 변환)
 *  2025-06-10 · PiP 제거 / 실시간 변환 제거 / VP9 HW 인코딩 우선
 */

import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PocketBase from "pocketbase";
import { QRCodeSVG } from "qrcode.react";

/* ───── PocketBase ───── */
const pb  = new PocketBase("https://ai-dam-smartmirror-pb-floral-lake-8577.fly.dev");
const API = "https://gpu.ai-dam.ai";
pb.autoCancellation(false);

/* ───── 타입 ───── */
interface VidRec { id: string; video_for_record_mirror: string }
type Stage =
  | "idle" | "precheck" | "countdown" | "recording" | "after"
  | "review" | "playback" | "confirm" | "uploading" | "completed" | "error";

const MAX_TAKE = 3;

/* ───── 유틸 : 실시간용 코덱 선택 ───── */
const pickRecOptions = () => {
  const vp9 = "video/webm;codecs=vp9";
  const vp8 = "video/webm;codecs=vp8";
  if (MediaRecorder.isTypeSupported(vp9))   return { mimeType: vp9, videoBitsPerSecond: 3_000_000 };
  if (MediaRecorder.isTypeSupported(vp8))   return { mimeType: vp8, videoBitsPerSecond: 3_000_000 };
  return { videoBitsPerSecond: 3_000_000 };           // Chrome이 알아서 고르도록
};

/* ───── 유틸 : 90° CW + 좌우반전 변환(H.264) ───── */
const rotateAndFlipBlob = (blob: Blob): Promise<Blob> =>
  new Promise((resolve) => {
    const v = document.createElement("video");
    v.src         = URL.createObjectURL(blob);
    v.muted       = true;
    v.playsInline = true;

    v.addEventListener("loadedmetadata", () => {
      const [wSrc, hSrc] = [v.videoWidth, v.videoHeight];   // 1920×1080
      const [wCan, hCan] = [hSrc, wSrc];                    // 1080×1920

      const canvas = document.createElement("canvas");
      canvas.width = wCan; canvas.height = hCan;
      const ctx    = canvas.getContext("2d")!;

      /* 캔버스 스트림 → 재인코딩(H.264) */
      const stream = canvas.captureStream(30);
      const rec    = new MediaRecorder(stream, {
        mimeType: "video/mp4;codecs=avc1",
        videoBitsPerSecond: 4_000_000,
      });
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop          = () => resolve(new Blob(chunks, { type: "video/mp4" }));

      let raf = 0;
      const draw = () => {
        ctx.save();
        ctx.translate(wCan / 2, hCan / 2);
        ctx.rotate(Math.PI / 2);
        ctx.scale(-1, 1);
        ctx.drawImage(v, -wSrc / 2, -hSrc / 2, wSrc, hSrc);
        ctx.restore();
        raf = requestAnimationFrame(draw);
      };

      v.addEventListener("play", () => { rec.start(); draw(); });
      v.addEventListener("ended", () => { cancelAnimationFrame(raf); rec.stop(); });
      v.play();
    });
  });

/* ───── 공통 UI 컴포넌트 ───── */
const GlowBtn: React.FC<{ active?: boolean; children: React.ReactNode }> = ({ active, children }) => (
  <div
    className={`px-10 py-4 rounded-2xl text-2xl font-bold select-none
                 backdrop-blur-lg bg-white/15 border border-white/25
                 shadow-[0_0_30px_6px_rgba(226,162,255,0.35)]
                 ${active ? "ring-4 ring-purple-400 scale-105" : "opacity-70"}`}
  >
    {children}
  </div>
);

const Modal: React.FC<{ extra?: string; children: React.ReactNode }> = ({ extra = "", children }) => (
  <div className={`absolute inset-0 flex flex-col items-center justify-center
                   bg-black/70 backdrop-blur-sm gap-10 p-10 ${extra}`}>{children}</div>
);

/* ───── 메인 ───── */
const PlayMode_sm_record: React.FC = () => {
  const { id } = useParams();
  const nav    = useNavigate();

  /* state */
  const [meta,       setMeta]       = useState<VidRec | null>(null);
  const [takes,      setTakes]      = useState<Blob[]>([]);
  const [stage,      setStage]      = useState<Stage>("idle");
  const [count,      setCount]      = useState(5);
  const [afterIdx,   setAfterIdx]   = useState(0);
  const [cursor,     setCursor]     = useState(0);
  const [playIdx,    setPlayIdx]    = useState<number | null>(null);
  const [confirmIdx, setConfirmIdx] = useState(0);
  const [errMsg,     setErrMsg]     = useState("");
  const [qrUrl,      setQrUrl]      = useState("");

  /* refs */
  const streamRef  = useRef<MediaStream | null>(null);
  const recRef     = useRef<MediaRecorder | null>(null);
  const cancelRef  = useRef(false);
  const overlayRef = useRef<HTMLVideoElement>(null);

  /* ─ ① overlay 메타 ─ */
  useEffect(() => {
    if (!id) return;
    (async () => {
      const r: any = await pb.collection("video_sections").getOne(id);
      setMeta({
        id: r.id,
        video_for_record_mirror: pb.files.getUrl(r, r.video_for_record_mirror),
      });
    })();
  }, [id]);

  /* ─ ② getUserMedia ─ */
  useEffect(() => {
    const abort  = new AbortController();
    let mounted  = true;

    (async () => {
      try {
        const constraints: MediaStreamConstraints & { signal: AbortSignal } = {
          video : { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30, max: 30 } },
          audio : false,
          signal: abort.signal,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!mounted || cancelRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;        // PiP 미사용
      } catch (err: any) {
        if (err.name !== "AbortError") {
          alert("웹캠을 열 수 없습니다");
          nav(-2);
        }
      }
    })();

    return () => {
      mounted = false;
      abort.abort();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [nav]);

  const stopTracks = () => streamRef.current?.getTracks().forEach((t) => t.stop());

  /* ─ cleanExit ─ */
  const cleanExit = () => {
    pb.collection("video_sections").unsubscribe(meta!.id);
    cancelRef.current = true;
    if (recRef.current?.state === "recording") {
      recRef.current.onstop = () => { stopTracks(); nav(-2); };
      recRef.current.stop();
    } else {
      stopTracks();
      nav(-2);
    }
  };

  /* ─ countdown ─ */
  useEffect(() => {
    if (stage !== "countdown") return;
    if (count === 0) { startRec(); return; }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, count]);

  /* ─ 녹화 시작 ─ */
  const startRec = () => {
    const src = streamRef.current;
    const ov  = overlayRef.current;
    if (!src || !ov) return;

    const rec = new MediaRecorder(src, pickRecOptions());
    recRef.current = rec;
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop          = () => {
      setTakes((prev) => {
        /* 메모리·GC 부담 최소화를 위해 MAX_TAKE 초과 시 가장 오래된 Blob 폐기 */
        if (prev.length >= MAX_TAKE) prev.shift();
        return [...prev, new Blob(chunks, { type: rec.mimeType || "video/webm" })];
      });
      setStage("after");
    };

    rec.start();
    ov.currentTime = 0;
    ov.play();
    setStage("recording");
    ov.addEventListener("ended", () => rec.stop(), { once: true });
  };

  /* ─ 키 매핑 ─ */
  useEffect(() => {
    const L  = ["ArrowLeft",  "e", "ㄷ"];
    const R  = ["ArrowRight", "f", "ㄹ"];
    const OK = ["g", "ㅎ", "Enter"];
    const BK = ["j", "ㅓ", "Escape"];
    const OUT= ["q", "Q"];

    const hd = (e: KeyboardEvent) => {
      if (stage === "uploading") return;        // 로딩 중 키 잠금
      if (OUT.includes(e.key)) return cleanExit();
      if (["recording", "countdown"].includes(stage)) return;

      /* idle → precheck */
      if (stage === "idle") {
        if (OK.includes(e.key)) setStage("precheck");
        else if (BK.includes(e.key)) cleanExit();
        return;
      }

      /* precheck */
      if (stage === "precheck") {
        if (OK.includes(e.key)) { setCount(5); setStage("countdown"); }
        else if (BK.includes(e.key)) cleanExit();
        return;
      }

      /* after */
      if (stage === "after") {
        const again = takes.length < MAX_TAKE;
        const arr   = again ? ["again", "select", "exit"] : ["select", "exit"];
        if (L.includes(e.key)) setAfterIdx((i) => (i - 1 + arr.length) % arr.length);
        else if (R.includes(e.key)) setAfterIdx((i) => (i + 1) % arr.length);
        else if (OK.includes(e.key)) {
          const c = arr[afterIdx];
          if (c === "again") { setCount(5); setStage("countdown"); }
          else if (c === "select") setStage("review");
          else cleanExit();
        }
        return;
      }

      /* review */
      if (stage === "review") {
        if (L.includes(e.key)) setCursor((i) => (i - 1 + takes.length) % takes.length);
        else if (R.includes(e.key)) setCursor((i) => (i + 1) % takes.length);
        else if (OK.includes(e.key)) { setPlayIdx(cursor); setStage("playback"); }
        else if (BK.includes(e.key)) setStage("after");
        return;
      }

      /* playback */
      if (stage === "playback" && playIdx !== null) {
        if (OK.includes(e.key)) {
          setConfirmIdx(0); setStage("confirm");
        } else if (BK.includes(e.key)) setStage("review");
        return;
      }

      /* confirm */
      if (stage === "confirm") {
        const arr = ["진행", "취소"];
        if (L.includes(e.key) || R.includes(e.key)) setConfirmIdx((i) => 1 - i);
        else if (OK.includes(e.key)) {
          if (confirmIdx === 0) {               // ─ 진행 ─
            setStage("uploading");
            (async () => {
              try {
                /* 1) 변환(H.264 + Rotate&Flip) */
                const raw  = takes[playIdx!];
                const blob = await rotateAndFlipBlob(raw);

                /* 2) 업로드 */
                const fd = new FormData();
                fd.append("user_video", blob, "user.mp4");
                await pb.collection("video_sections").update(meta!.id, fd);

                /* 3) 백엔드 합성 요청 */
                const res = await fetch(`${API}/api/mix?id=${meta!.id}`, { method: "POST" });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                /* 3-1) 이미 처리 완료? */
                const recNow: any = await pb.collection("video_sections").getOne(
                  meta!.id,
                  { query: { _: Date.now().toString() } }
                );
                if (recNow.status === "mixed" && recNow.mix_results) {
                  setQrUrl(pb.files.getUrl(recNow, recNow.mix_results) + "?download=1");
                  setStage("completed");
                  return;
                }

                /* 4) 실시간 상태 구독 */
                pb.collection("video_sections").subscribe(meta!.id, (e) => {
                  const rec = e.record as any;
                  if (rec.status === "mixed" && rec.mix_results) {
                    pb.collection("video_sections").unsubscribe(meta!.id);
                    setQrUrl(pb.files.getUrl(rec, rec.mix_results) + "?download=1");
                    setStage("completed");
                  }
                  if (rec.status === "error") {
                    pb.collection("video_sections").unsubscribe(meta!.id);
                    setErrMsg("서버 처리 실패");
                    setStage("error");
                  }
                });
              } catch (err: any) {
                setErrMsg(String(err));
                setStage("error");
              }
            })();
          } else {                               // ─ 취소 ─
            setStage("playback");
          }
        } else if (BK.includes(e.key)) setStage("playback");
        return;
      }

      /* completed / error */
      if (
        ["completed", "error"].includes(stage) &&
        (OK.includes(e.key) || BK.includes(e.key))
      )
        cleanExit();
    };

    window.addEventListener("keydown", hd);
    return () => window.removeEventListener("keydown", hd);
  }, [stage, afterIdx, cursor, takes, playIdx, meta, confirmIdx]);

  /* after 단계 진입 시 커서 리셋 */
  useEffect(() => { if (stage === "after") setAfterIdx(0); }, [stage]);

  if (!meta) return <Modal><span className="text-3xl">Loading…</span></Modal>;

  /* ─────────────────────── 렌더 ─ */
  return (
    <div className="relative w-full h-full bg-black text-white flex items-center justify-center select-none">

      {/* overlay (안무 가이드) */}
      <video
        ref={overlayRef}
        src={meta.video_for_record_mirror}
        style={{ width: "100%", height: "100%", objectFit: "contain",
                 opacity: stage === "recording" ? 1 : 0.4, pointerEvents: "none" }}
      />

      {/* ───────────────────────────── UI 단계별 ───────────────────────────── */}

      {/* idle */}
      {stage === "idle" && (
        <div className="flex flex-col items-center gap-3 text-purple-300 opacity-80 animate-pulse">
          <GlowBtn><span className="text-5xl">REC</span></GlowBtn>
          <span className="text-3xl">press&nbsp;A!</span>
        </div>
      )}

      {/* precheck */}
      {stage === "precheck" && (
        <Modal>
          <p className="text-3xl text-center leading-snug">
            영상 촬영이 준비되셨나요?<br /><br />
            <span className="text-purple-300">A : 촬영 시작</span><br />
            <span className="text-purple-300">B : 뒤로가기</span>
          </p>
        </Modal>
      )}

      {/* countdown */}
      {stage === "countdown" && (
        <Modal extra="bg-black/60"><span className="text-[11rem] font-extrabold">{count}</span></Modal>
      )}

      {/* after */}
      {stage === "after" && (() => {
        const again = takes.length < MAX_TAKE;
        const arr   = again ? ["다시 촬영", "선택 화면", "나가기"] : ["선택 화면", "나가기"];
        return (
          <Modal>
            <p className="text-3xl text-center">옵션 선택 (←/→ Enter)</p>
            <div className="flex gap-14">
              {arr.map((t, i) => <GlowBtn key={t} active={i === afterIdx}>{t}</GlowBtn>)}
            </div>
          </Modal>
        );
      })()}

      {/* review */}
      {stage === "review" && (
        <Modal extra="gap-10 p-10">
          <p className="text-3xl">← / → 선택 · Enter 재생</p>
          <div className="flex gap-10">
            {takes.map((b, i) => {
              const url    = URL.createObjectURL(b);
              const active = i === cursor;
              return (
                <div key={i} className="relative">
                  <video
                    src={url} muted playsInline controls={false}
                    controlsList="nodownload noplaybackrate nofullscreen"
                    disablePictureInPicture
                    style={{ pointerEvents: "none", transform: "rotate(90deg) scaleX(-1)" }}
                    className={`w-72 rounded-lg ${active ? "ring-4 ring-purple-400" : ""}`}
                    onLoadedData={() => URL.revokeObjectURL(url)}   // 메모리 즉시 해제
                  />
                  {active && (
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-4xl animate-bounce">
                      ⬇
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* playback */}
      {stage === "playback" && playIdx !== null && (
        <Modal extra="bg-black/90 gap-10">
          <video
            src={URL.createObjectURL(takes[playIdx])} controls autoPlay
            style={{ transform: "rotate(90deg) scaleX(-1)" }}
            className="max-w-4xl w-full rounded-xl"
            onLoadedData={(e) => URL.revokeObjectURL((e.target as HTMLVideoElement).src)}
          />
          <p className="text-2xl">Enter 업로드 · Esc 뒤로</p>
        </Modal>
      )}

      {/* confirm */}
      {stage === "confirm" && (
        <Modal>
          <p className="text-3xl text-center leading-snug">
            약 2분 정도 소요됩니다.<br />이 영상으로 진행하시겠습니까?
          </p>
          <div className="flex gap-14">
            {["진행", "취소"].map((t, i) => <GlowBtn key={t} active={i === confirmIdx}>{t}</GlowBtn>)}
          </div>
          <p className="text-xl opacity-70">←/→ 선택 · Enter 확정</p>
        </Modal>
      )}

      {/* uploading */}
      {stage === "uploading" && (
        <Modal extra="gap-6">
          <span className="text-4xl animate-pulse">업로드 및 합성 요청 중…</span>
          <span className="text-xl opacity-70">잠시만 기다려주세요</span>
        </Modal>
      )}

      {/* completed */}
      {stage === "completed" && (
        <Modal extra="gap-10">
          <p className="text-3xl text-center leading-snug text-purple-300">
            업로드 완료!<br />아래 QR 로 영상을 다운로드하세요
          </p>
          {qrUrl && <QRCodeSVG value={qrUrl} size={500} fgColor="#ffffff" bgColor="transparent" />}
          <p className="text-xl mt-4 opacity-70">QR 스캔 후&nbsp;A&nbsp;키를 눌러 종료합니다</p>
        </Modal>
      )}

      {/* error */}
      {stage === "error" && (
        <Modal>
          <p className="text-3xl text-center leading-snug text-red-400">업로드 실패</p>
          <p className="text-xl mt-2 max-w-lg text-center break-words">{errMsg}</p>
          <p className="text-xl mt-4">A 키를 눌러 종료합니다</p>
        </Modal>
      )}
    </div>
  );
};

export default PlayMode_sm_record;
