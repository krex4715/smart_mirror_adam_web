// src/components/App.tsx
import React from "react";
import {
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

/* ---------- 페이지 ---------- */
import Home        from "../pages/Home/Home";
import Main        from "../pages/Main/Main";


import Mode_group       from "../pages/Mode/Mode_group";


import Mode_onoz_kpop       from "../pages/Mode/Mode_onoz_kpop";
import PlayMode_onoz_kpop   from "../pages/Player/PlayMode_onoz_kpop";

import Mode_ai_prac       from "../pages/Mode/Mode_ai_prac";
import PlayMode_ai_prac   from "../pages/Player/PlayMode_ai_prac"; 

import Mode_sm_training       from "../pages/Mode/Mode_sm_training";
import PlayMode_sm_training   from "../pages/Player/PlayMode_sm_trainig";


import Info        from "../pages/Info/Info";
import Loading     from "../pages/Loading/Loading";




/* ---------- 전역 상태 / 라이브러리 ---------- */
import { pb }               from "../lib/pb";
import { SessionProvider }  from "../lib/SessionContext";

/* ---------- 공통 UI ---------- */
import RemainClock     from "../components/RemainClock";  // ⏳ 남은 시간 + 블루투스 + 로그아웃
import AutoHideCursor  from "../components/AutoHideCursor"; // 🖱️ 커서 자동 숨김
import SupportQrs      from "../components/SupportQrs";   // 📌 문의·FAQ + 사용가이드 QR
import JoystickGuide   from "../components/JoystickGuide"; // 조이스틱 가이드



/* ---------- 보호 라우트 래퍼 ---------- */
const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) =>
  pb.authStore.isValid ? children : <Navigate to="/" replace />;

/* ---------- 인증 이후 라우트 묶음 ---------- */
const ProtectedRoutes: React.FC = () => (
  <RequireAuth>
    <Routes>
      <Route path="/main"             element={<Main />} />

      <Route path="/mode_ai_prac"            element={<Mode_ai_prac />} />
      <Route path="/player/mode_ai_prac/:id" element={<PlayMode_ai_prac />} />
      
      <Route path="/mode_sm_training"        element={<Mode_sm_training />} /> 
      <Route path="/player/mode_sm_training/:id" element={<PlayMode_sm_training />} />


      
      <Route path="/mode_onoz_kpop"            element={<Mode_onoz_kpop />} />
      <Route path="/player/mode_onoz_kpop/:id" element={<PlayMode_onoz_kpop />} />


      <Route path="/video/info/:id"   element={<Info />} />
      <Route path="/loading/:id"      element={<Loading />} />
      
      <Route path="/mode_group"           element={<Mode_group />} />

      {/* 그 외 모든 경로는 404 */}

      {/* 인증 상태에서 "/" 접근 시 자동으로 /main */}
      <Route path="/" element={<Navigate to="/main" replace />} />
    </Routes>
  </RequireAuth>
);

/* ========== 최상위 컴포넌트 ========== */
const App: React.FC = () => (
  <HashRouter>
    <SessionProvider>
      {/* ── 항상 표시되는 전역 HUD ─────────────────────── */}
      <RemainClock />                     {/* ⏳ 남은 시간 + 블루투스 + 로그아웃 */}
      <AutoHideCursor timeout={1500} />   {/* 🖱️ 1.5초 후 커서 자동 숨김 */}
      <SupportQrs />                      {/* 📄 문의·FAQ + 사용가이드 QR */}
      <JoystickGuide />                   {/* 조이스틱 가이드 */}

      {/* ── 라우팅 ───────────────────────────────────── */}
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
