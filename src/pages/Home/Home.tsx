// src/pages/Home/Home.tsx
//-------------------------------------------------------------
// 스마트미러 홈 ― 키보드 없이 QR 로그인
//-------------------------------------------------------------
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { pb } from "../../lib/pb";
import logo from "../../assets/images/logo-adam.png";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";

const MIRROR_ID_KEY = "mirrorId";

/* ── mirrorId 확보 훅 ─────────────────────────────────────── */
function useMirrorId(): string {
  const [mid, setMid] = useState<string>(() => localStorage.getItem(MIRROR_ID_KEY) ?? "");

  // Strict-Mode(개발 모드)에서 effect 중복 실행 방지
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    (async () => {
      // 1) localStorage 값이 있으면 존재 확인
      if (mid) {
        try {
          await pb.collection("mirrorId").getOne(mid);
          return; // 그대로 사용
        } catch {
          console.warn("localStorage mirrorId 문서를 서버에서 찾지 못함");
        }
      }

      // 2) 없으면 새 레코드 create → id 자동 생성
      try {
        const rec = await pb.collection("mirrorId").create({});
        localStorage.setItem(MIRROR_ID_KEY, rec.id);
        setMid(rec.id);
        console.log("✅ mirrorId 새로 생성:", rec.id);
      } catch (e) {
        console.error("❌ mirrorId create 실패", e);
      }
    })();
  }, []); // mount 1회

  return mid; // "" 이면 아직 준비 중
}

/* ── 메인 컴포넌트 ───────────────────────────────────────── */
const Home: React.FC = () => {
  const nav = useNavigate();
  const mirrorId = useMirrorId();

  const LOGIN_URL = mirrorId ? `https://auth.ai-dam.ai/auth.html?mid=${mirrorId}` : ""; // 준비 전이면 빈 문자열

  /* ── 토큰 실시간 구독 ─────────────────────────────── */
  useEffect(() => {
    if (!mirrorId) return; // 아직 준비 안 됨
    let unsub: (() => void) | null = null;

    pb.collection("mirrorId")
      .subscribe(
        mirrorId,
        async ({ record }) => {
          console.log("📡 subscribe:", record);
          if (record.token && !record.busy) {
            console.log("📥 토큰 수신, 자동 로그인 진행");

            // 사용자 모델 확보
            let userModel: any = record.expand?.user;
            if (!userModel && record.user) {
              try {
                userModel = await pb.collection("users").getOne(record.user);
              } catch (e) {
                console.error("user fetch 실패", e);
              }
            }

            try {
              pb.authStore.save(record.token, userModel);
              await pb.collection("mirrorId").update(mirrorId, { busy: true });
              nav("/main");
            } catch (e) {
              console.error("자동 로그인 실패", e);
            }
          }
        },
        { expand: "user" }
      )
      .then((fn) => (unsub = fn))
      .catch((e) => console.error("subscribe 실패", e));

    return () => unsub?.();
  }, [mirrorId, nav]);

  /* ── UI 렌더 ─────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white relative overflow-hidden">
      {/* 로고 */}
      <img src={logo} alt="logo" className="h-[30vh] mb-6" />

      {/* 메인 타이틀 */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-[2rem] font-extrabold tracking-tight bg-gradient-to-r from-purple-300 via-purple-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-lg"
      >
        Ai  Dance  Assistance in  Mirror
      </motion.h1>

      {/* QR 코드 */}
      {mirrorId ? (
        <div className="flex flex-col items-center gap-3">
          <QRCodeSVG value={LOGIN_URL} size={450} bgColor="#000000" fgColor="#ffffff" level="H" includeMargin />
          <p className="text-2xl mt-4">📱 휴대폰 QR 로그인</p>
        </div>
      ) : (
        <p className="text-lg">로딩 중…</p>
      )}

      {/* ── 조이스틱 블루투스 안내 ────────────────────── */}
      <motion.p
        style={{ left: 16, bottom: 500 }} // ↔ 위치 픽셀 단위로 쉽게 조정
        className="absolute text-sky-400 text-3xl font-semibold drop-shadow-lg whitespace-pre-wrap"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {"로그인 하기전, \n먼저 조이스틱 블루투스 연결을 진행해주세요!!"}
      </motion.p>
    </div>
  );
};

export default Home;
