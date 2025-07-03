/*****************************************************************
 *  로그인 · 타이머 · 세션 기록 + busy 플래그 관리
 *  ─ 추가:  S 키(=‘ㄴ’ 키) 를 누르면 즉시 로그아웃
 *****************************************************************/
import React, {
  createContext, useContext, useEffect, useRef, useState, ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { pb } from "./pb";

/* ========= 타입 ========= */
interface SessionCtx {
  remaining: number;
  handleLogout: () => void;
  userName: string;
}
const SessionContext = createContext<SessionCtx>({
  remaining: 0, handleLogout: () => {}, userName: "",
});

/* ========= 유틸 ========= */
const now      = () => Date.now();
const diffS    = (a:number,b:number)=>Math.max(1,Math.round((b-a)/1000));
const toKstISO = (d:number|Date)=>
  new Date(typeof d==="number"?d+9*3600000:d.getTime()+9*3600000)
  .toISOString().replace("Z","+09:00");

/* ========= Provider ========= */
export const SessionProvider:React.FC<{children:ReactNode}> = ({ children })=>{
  const nav = useNavigate();

  const loginAtRef   = useRef(0);
  const sessionIdRef = useRef<string>("");

  const mirrorId = localStorage.getItem("mirrorId") || "";   // 미러 식별자

  const [remaining,setRemaining] = useState(0);
  const [userName,setUserName]   = useState("");

  /* ---------- authStore 변화 (로그인 / 로그아웃) ---------- */
  useEffect(()=>{
    const unsub = pb.authStore.onChange(async ()=>{
      if(!pb.authStore.isValid){               // 로그아웃
        clearBusy();
        setRemaining(0); setUserName(""); sessionIdRef.current="";
        localStorage.removeItem("sid");
        return;
      }

      /* ── 로그인 직후 ── */
      const user:any = pb.authStore.model;
      loginAtRef.current = now();

      setRemaining((user.remainingMinutes??0)*60);
      setUserName(user.name??user.username??"");

      /* sessions 레코드 생성 */
      try{
        const rec:any = await pb.collection("sessions").create({
          users:user.id, startedAt:toKstISO(loginAtRef.current),
          endedAt:null, spentSec:0, spentMin:0
        });
        sessionIdRef.current = rec.id;
        localStorage.setItem("sid",rec.id);
      }catch(e){ console.error("⛔️ 세션 레코드 생성 실패:",e);}
    });
    return ()=>unsub();
  },[]);

  /* ---------- 1초 카운트다운 ---------- */
  useEffect(()=>{
    if(!pb.authStore.isValid) return;
    const t = setInterval(()=>setRemaining(s=>Math.max(0,s-1)),1000);
    return ()=>clearInterval(t);
  },[pb.authStore.isValid]);

  /* ---------- 0초 → 자동 로그아웃 ---------- */
  useEffect(()=>{
    if(remaining===0 && pb.authStore.isValid) handleLogout();
  },[remaining]);          // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- busy 플래그 해제 ---------- */
  const clearBusy = async ()=>{
    if(!mirrorId) return;
    try{
      await pb.collection("mirrorId").update(mirrorId,{ busy:false, token:"" });
      console.log("💤 mirrorId busy=false");
    }catch(e){ console.warn("mirrorId busy 해제 실패",e);}
  };

  /* ---------- 세션 종료 공통 ---------- */
  const finalizeSession = async (spentSec:number)=>{
    const userId = pb.authStore.model?.id;
    if(!userId) return;

    /* 1) 사용자 잔여 시간 차감 */
    try{
      const cur:any = await pb.collection("users").getOne(userId);
      await pb.collection("users").update(userId,{
        remainingMinutes: Math.max(0,(cur.remainingMinutes??0)-spentSec/60)
      });
    }catch(e){ console.error("⛔️ 잔여 시간 차감 실패:",e);}

    /* 2) sessions 레코드 종료 */
    try{
      const sid = sessionIdRef.current || localStorage.getItem("sid") || "";
      if(sid){
        await pb.collection("sessions").update(sid,{
          endedAt:toKstISO(now()),
          spentSec, spentMin:+(spentSec/60).toFixed(2)
        });
      }
    }catch(e){ console.error("⛔️ 세션 update 실패:",e);}
  };

  /* ---------- 로그아웃 ---------- */
  const handleLogout = async ()=>{
    if(!pb.authStore.isValid) return;
    const spent = diffS(loginAtRef.current,now());
    await finalizeSession(spent);
    await clearBusy();

    pb.authStore.clear();
    localStorage.removeItem("sid");
    setRemaining(0);
    nav("/",{replace:true});
  };

  /* ---------- 창/탭 닫힘 ---------- */
  useEffect(()=>{
    if(!pb.authStore.isValid) return;
    const flush = async ()=>{
      if(!pb.authStore.isValid) return;
      const spent = diffS(loginAtRef.current,now());
      await finalizeSession(spent);
      await clearBusy();
    };
    window.addEventListener("pagehide",flush);
    window.addEventListener("beforeunload",flush);
    return ()=>{
      window.removeEventListener("pagehide",flush);
      window.removeEventListener("beforeunload",flush);
    };
  },[pb.authStore.isValid]);

  /* ---------- S / ‘ㄴ’ 키 → 로그아웃 ---------- */
  useEffect(()=>{
    if(!pb.authStore.isValid) return;           // 로그인 중일 때만 듣기

    const onKey = (e:KeyboardEvent)=>{
      // e.code 는 물리적 키(US 배치 기준) — ‘S’ 자리에 해당
      // 한국어 입력 상태일 때 e.key 가 ‘ㄴ’ 으로 들어오는 경우도 대비
      if(e.code === "KeyS" || e.key === "s" || e.key === "ㄴ"){
        e.preventDefault();
        handleLogout();
      }
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  }, [pb.authStore.isValid]);                  // 로그인/로그아웃 시 재설정

  /* ---------- Context 노출 ---------- */
  return(
    <SessionContext.Provider value={{remaining,handleLogout,userName}}>
      {children}
    </SessionContext.Provider>
  );
};

/* custom hook */
export const useSession = ()=>useContext(SessionContext);
