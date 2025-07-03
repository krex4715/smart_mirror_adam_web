/* ──────────────────────────────
 *  src/components/JoystickGuide.tsx
 *  - 현재 URL 경로에 따라 다른 가이드 이미지를 표시
 *    Home            → joystickguide_login.png
 *    Main/Mode1/…    → joystickguide_normal.png
 *    Mode3           → joystickguide_searching.png
 *    PlayMode*       → joystickguide_play.png
 * ────────────────────────────── */
import React from "react";
import { useLocation } from "react-router-dom";

/* 이미지 리소스 */
import imgLogin     from "../assets/images/joystick/joystickguide_login.png";
import imgNormal    from "../assets/images/joystick/joystickguide_normal.png";
import imgSearching from "../assets/images/joystick/joystickguide_searching.png";
import imgSearching_with_plus from "../assets/images/joystick/joystickguide_searching_with+.png";
import imgPlay      from "../assets/images/joystick/joystickguide_play.png";

const JoystickGuide: React.FC = () => {
  const { pathname } = useLocation();

  /* 경로 매핑 */
  const selectImage = (): string => {
    if (pathname === "/") return imgLogin;

    if (pathname.startsWith("/player/")) return imgPlay;

    if (pathname.startsWith("/mode_ai_prac")) return imgSearching_with_plus;
    if (pathname.startsWith("/mode_sm_training")) return imgSearching;
    if (pathname.startsWith("/mode_onoz_kpop")) return imgSearching;

    // 메인 / 모드1·2·4 / 로딩 / 인포 등
    return imgNormal;
  };

  return (
    <div
      className="fixed bottom-6 left-6 z-[55]
                 px-1 py-1 rounded-xl bg-sky-200/40 backdrop-blur-sm
                 pointer-events-none select-none"
    >
      <img
        src={selectImage()}
        alt="조이스틱 사용 가이드"
        className="w-[600px] max-w-[90vw] h-[350px]"
      />
    </div>
  );
};

export default JoystickGuide;
