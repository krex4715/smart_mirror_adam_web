// src/components/App.tsx
import React from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

/* ---------- 페이지 ---------- */
import Home  from "../pages/Home/Home";
import Main  from "../pages/Main/Main";

/* ---------- MODE 진입 ---------- */
import Mode_group     from "../pages/Mode/Mode_group";
import Mode_onoz_kpop from "../pages/Mode/Mode_onoz_kpop";
import Mode_ai_prac   from "../pages/Mode/Mode_ai_prac";
import Mode_sm        from "../pages/Mode/Mode_sm";

/* ---------- PLAYER ---------- */
import PlayMode_onoz_kpop  from "../pages/Player/PlayMode_onoz_kpop";
import PlayMode_ai_prac    from "../pages/Player/PlayMode_ai_prac";

/* 👉 스마트미러 : 셀렉터 ⇢ 트레이닝 / 촬영 */
import PlayMode_sm_selector  from "../pages/Player/PlayMode_sm_selector";
import PlayMode_sm_training  from "../pages/Player/sm/PlayMode_sm_training";
import PlayMode_sm_record    from "../pages/Player/sm/PlayMode_sm_record";

/* ---------- 기타 ---------- */
import Info    from "../pages/Info/Info";
import Loading from "../pages/Loading/Loading";

/* ---------- 전역 상태 / 라이브러리 ---------- */
import { pb }               from "../lib/pb";
import { SessionProvider }  from "../lib/SessionContext";

/* ---------- 공통 UI ---------- */
import MirrorStatusBar   from "./MirrorStatusBar";
import AutoHideCursor from "../components/AutoHideCursor";
import SupportQrs     from "../components/SupportQrs";
import JoystickGuide  from "../components/JoystickGuide";

/* ---------- 보호 라우트 래퍼 ---------- */
const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) =>
  pb.authStore.isValid ? children : <Navigate to="/" replace />;

/* ---------- 인증 이후 라우트 ---------- */
const ProtectedRoutes: React.FC = () => (
  <RequireAuth>
    <Routes>
      {/* 메인 대시보드 */}
      <Route path="/main" element={<Main />} />

      {/* ───── AI 연습 모드 ───── */}
      <Route path="/mode_ai_prac"            element={<Mode_ai_prac />} />
      <Route path="/player/mode_ai_prac/:id" element={<PlayMode_ai_prac />} />

      {/* ───── 스마트미러 모드 ───── */}
      <Route path="/mode_sm" element={<Mode_sm />} />

      {/* 선택 → 트레이닝 / 촬영 */}
      <Route path="/player/sm/:id"   element={<PlayMode_sm_selector />} />
      <Route path="/sm_training/:id" element={<PlayMode_sm_training />} />
      <Route path="/sm_record/:id"   element={<PlayMode_sm_record />} />

      {/* ───── ONOZ K-POP 모드 ───── */}
      <Route path="/mode_onoz_kpop"            element={<Mode_onoz_kpop />} />
      <Route path="/player/mode_onoz_kpop/:id" element={<PlayMode_onoz_kpop />} />

      {/* ───── 기타 ───── */}
      <Route path="/video/info/:id" element={<Info />} />
      <Route path="/loading/:id"    element={<Loading />} />
      <Route path="/mode_group"     element={<Mode_group />} />

      {/* 인증 상태에서 "/" → /main */}
      <Route path="/" element={<Navigate to="/main" replace />} />
    </Routes>
  </RequireAuth>
);

/* ========== 최상위 컴포넌트 ========== */
const App: React.FC = () => (
  <HashRouter>
    <SessionProvider>
      {/* ── 항상 표시되는 전역 HUD ── */}
      <MirrorStatusBar />
      <AutoHideCursor timeout={1500} />
      <SupportQrs />
      <JoystickGuide />

      {/* ── 라우팅 ── */}
      <Routes>
        {/* 로그인(비인증) */}
        <Route path="/" element={<Home />} />
        {/* 로그인 이후(보호 라우트) */}
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </SessionProvider>
  </HashRouter>
);

export default App;
