/*****************************************************************
 *  로그인 · 타이머 · 세션 기록 + busy 플래그 관리 (S/‘ㄴ’ 키 즉시 로그아웃)
 *****************************************************************/
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { pb } from "./pb";
import type { UnsubscribeFunc } from "pocketbase";

/* ========= 타입 ========= */
interface SessionCtx {
  remaining: number;          // 잔여 시간(초)
  tickets: number;            // 잔여 티켓 수
  handleLogout: () => void;   // 로그아웃
  userName: string;           // 닉네임
}
const SessionContext = createContext<SessionCtx>({
  remaining: 0,
  tickets: 0,
  handleLogout: () => {},
  userName: "",
});

/* ========= 유틸 ========= */
const now   = () => Date.now();
const diffS = (a: number, b: number) => Math.max(1, Math.round((b - a) / 1000));
const toKstISO = (d: number | Date) =>
  new Date(typeof d === "number" ? d + 9 * 3600000 : d.getTime() + 9 * 3600000)
    .toISOString()
    .replace("Z", "+09:00");

/* ========= Provider ========= */
export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const nav = useNavigate();

  /* refs ----------------------------------------------------- */
  const loginAtRef   = useRef(0);
  const sessionIdRef = useRef<string>("");
  const userUnsubRef = useRef<UnsubscribeFunc | null>(null);
  const finalizedRef = useRef(false);               // ⭐ 중복 finalize 가드

  /* local states -------------------------------------------- */
  const [remaining, setRemaining] = useState(0);
  const [tickets,   setTickets]   = useState(0);
  const [userName,  setUserName]  = useState("");

  const mirrorId = localStorage.getItem("mirrorId") || "";

  /* ---------- authStore 변화 (로그인 / 로그아웃) ------------ */
  useEffect(() => {
    const unsub = pb.authStore.onChange(async () => {
      if (!pb.authStore.isValid) {
        // 로그아웃
        clearBusy();
        setRemaining(0); setTickets(0); setUserName("");
        sessionIdRef.current = ""; localStorage.removeItem("sid");
        userUnsubRef.current?.();
        userUnsubRef.current = null;
        finalizedRef.current = false;
        return;
      }

      /* ── 로그인 직후 ── */
      const user: any = pb.authStore.model;
      loginAtRef.current     = now();
      finalizedRef.current   = false;

      setRemaining(Math.round((user.remainingMinutes ?? 0) * 60));
      setTickets(user.remainingContentTickets ?? 0);
      setUserName(user.name ?? user.username ?? "");

      /* sessions 레코드 생성 */
      try {
        const rec: any = await pb.collection("sessions").create({
          users: user.id,
          startedAt: toKstISO(loginAtRef.current),
          endedAt: null,
          spentSec: 0,
          spentMin: 0,
        });
        sessionIdRef.current = rec.id;
        localStorage.setItem("sid", rec.id);
      } catch (e) {
        console.error("⛔️ 세션 레코드 생성 실패:", e);
      }
    });
    return () => unsub();
  }, []);

  /* ---------- 1초 카운트다운 ------------------------------- */
  useEffect(() => {
    if (!pb.authStore.isValid) return;
    const t = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [pb.authStore.isValid]);

  /* ---------- users 레코드 실시간 구독 ---------------------- */
  useEffect(() => {
    if (!pb.authStore.isValid) return;
    const uid = pb.authStore.model?.id;
    if (!uid) return;

    (async () => {
      userUnsubRef.current = await pb.collection("users").subscribe(uid, (e) => {
        if (e.action !== "update") return;
        const u: any = e.record;
        setRemaining(Math.round((u.remainingMinutes ?? 0) * 60)); // floor → round
        setTickets(u.remainingContentTickets ?? 0);
      });
    })();

    return () => {
      userUnsubRef.current?.();
      userUnsubRef.current = null;
    };
  }, [pb.authStore.isValid]);

  /* ---------- 0초 → 자동 로그아웃 --------------------------- */
  useEffect(() => {
    if (remaining === 0 && pb.authStore.isValid) handleLogout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  /* ---------- busy 플래그 해제 ------------------------------ */
  const clearBusy = async () => {
    if (!mirrorId) return;
    try {
      await pb.collection("mirrorId").update(mirrorId, { busy: false, token: "" });
    } catch (e) {
      console.warn("mirrorId busy 해제 실패", e);
    }
  };

  /* ---------- 세션 종료 공통 ------------------------------- */
  const finalizeSession = async (spentSec: number) => {
    if (finalizedRef.current) return;     // ⭐ 중복 방지
    finalizedRef.current = true;

    const userId = pb.authStore.model?.id;
    if (!userId) return;

    /* 1) 사용자 잔여 시간 차감 */
    try {
      const cur: any = await pb.collection("users").getOne(userId);
      await pb.collection("users").update(userId, {
        remainingMinutes: Math.max(0, (cur.remainingMinutes ?? 0) - spentSec / 60),
      });
    } catch (e) {
      console.error("⛔️ 잔여 시간 차감 실패:", e);
    }

    /* 2) sessions 레코드 종료 */
    try {
      const sid = sessionIdRef.current || localStorage.getItem("sid") || "";
      if (sid) {
        await pb.collection("sessions").update(sid, {
          endedAt: toKstISO(now()),
          spentSec,
          spentMin: +(spentSec / 60).toFixed(2),
        });
      }
    } catch (e) {
      console.error("⛔️ 세션 update 실패:", e);
    }
  };

  /* ---------- 로그아웃 -------------------------------------- */
  const handleLogout = async () => {
    if (!pb.authStore.isValid) return;

    /** 1) 모든 실시간 구독 해제 */
    userUnsubRef.current?.();
    pb.realtime.unsubscribe("*");
    userUnsubRef.current = null;

    /** 2) 세션 정리 */
    const spent = diffS(loginAtRef.current, now());
    await finalizeSession(spent);
    await clearBusy();

    /** 3) 인증 토큰 제거 후 이동 */
    pb.authStore.clear();
    localStorage.removeItem("sid");
    setRemaining(0);
    setTickets(0);
    nav("/", { replace: true });
  };

  /* ---------- 창/탭 닫힘 ------------------------------------ */
  useEffect(() => {
    if (!pb.authStore.isValid) return;
    const flush = async () => {
      if (!pb.authStore.isValid) return;
      const spent = diffS(loginAtRef.current, now());
      await finalizeSession(spent);
      await clearBusy();
    };
    window.addEventListener("pagehide", flush);      // beforeunload 제거
    return () => window.removeEventListener("pagehide", flush);
  }, [pb.authStore.isValid]);

  /* ---------- S / ‘ㄴ’ 키 → 로그아웃 ------------------------ */
  useEffect(() => {
    if (!pb.authStore.isValid) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyS" || e.key === "s" || e.key === "ㄴ") {
        e.preventDefault();
        handleLogout();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pb.authStore.isValid]);

  /* ---------- Context 노출 ---------------------------------- */
  return (
    <SessionContext.Provider value={{ remaining, tickets, handleLogout, userName }}>
      {children}
    </SessionContext.Provider>
  );
};

/* custom hook */
export const useSession = () => useContext(SessionContext);
