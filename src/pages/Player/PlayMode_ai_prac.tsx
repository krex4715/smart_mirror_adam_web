/*  src/pages/Player/PlayMode3.tsx
 *  - 업로드 원본 ↔ AI 결과 선택 재생기
 *  - 왼쪽 상단 상태 패널(아이콘·세로형)
 *  - 좌우 반전(h/ㅗ), 속도·투명·볼륨·점프
 *  - 메뉴(원본·AI) → 영상 선택
 *  - 상태 패널은 메뉴 닫힌 상태(재생 중)에만 표시
 *  ───────────────────────────────────────────────*/
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PocketBase from "pocketbase";
import spinner from "../../assets/images/spinner.gif";
import JoystickGuide from "../../components/JoystickGuide";

const BASE = "https://ai-dam-smartmirror-pb-floral-lake-8577.fly.dev";
const pb   = new PocketBase(BASE);
pb.autoCancellation(false);

/* 위치·크기 상수 */
const BOX_W = 1000;
const BOX_Y = 400;

/* 포맷 */
const fmt = (t:number)=>`${Math.floor(t/60)}:${`${Math.floor(t%60)}`.padStart(2,"0")}`;

/* 상태 아이콘 */
const icons = { speed:"⏩️", opa:"🎞️", vol:"🔊", flip:"🔄" };

/* 타입 */
type JobRec = {
  id:string; collectionId:string; video:string; result:string;
  status:string; originalUrl:string; aiUrl:string;
};

const PlayMode3:React.FC = () => {
  const { id } = useParams(); const nav = useNavigate();

  /* 데이터 */
  const [job,setJob] = useState<JobRec|null>(null);

  /* 메뉴 & 플레이 */
  const [isMenu,setIsMenu] = useState(true);
  const [hover,setHover]   = useState<0|1>(0);
  const [src,setSrc]       = useState("");

  /* 비디오 상태 */
  const vidRef=useRef<HTMLVideoElement>(null);
  const [loaded,setLoaded]=useState(false);
  const [duration,setDuration]=useState(0);
  const [cur,setCur]=useState(0);
  const [vw,setVW]=useState(window.innerWidth);

  const [rate,setRate]=useState(1.0);
  const [opa,setOpa]=useState(100);
  const [vol,setVol]=useState(50);
  const [flip,setFlip]=useState(false);
  const [jump,setJump]=useState("");

  /* 1. 레코드 로드 */
  useEffect(()=>{
    if(!id) return;
    (async()=>{
      const r:any = await pb.collection("jobs").getOne(id);
      setJob({
        ...r,
        originalUrl:`${BASE}/api/files/${r.collectionId}/${r.id}/${r.video}`,
        aiUrl     :`${BASE}/api/files/${r.collectionId}/${r.id}/${r.result}`,
      });
    })();
  },[id]);

  const aiReady = job?.status==="done";

  /* 2. 키보드 */
  useEffect(()=>{
    const hd=(e:KeyboardEvent)=>{
      /* 메뉴 모드 */
      if(isMenu){
        if(["ArrowLeft","ArrowRight","e","f","ㄷ","ㄹ"].includes(e.key)){
          if(aiReady) setHover(p=>p===0?1:0);
        }
        if(["Enter","g","ㅎ"].includes(e.key) && job){
          if(hover===0 || aiReady){
            setSrc(hover===0?job.originalUrl:job.aiUrl);
            setIsMenu(false);
          }
        }else if(["Escape","j","ㅓ","`"].includes(e.key)) nav(-1);
        return;
      }

      /* 플레이어 모드 */
      const v=vidRef.current;if(!v) return;
      let m="";
      switch(e.key){
        case " ":case"g":case"ㅎ": v.paused?v.play():v.pause(); break;
        case "ArrowLeft":case"e":case"ㄷ": setOpa(o=>Math.max(0,o-10)); break;
        case "ArrowRight":case"f":case"ㄹ": setOpa(o=>Math.min(100,o+10)); break;
        case "ArrowDown":case"d":case"ㅇ": setRate(r=>Math.max(0.5,+(r-0.1).toFixed(1))); break;
        case "ArrowUp":case"c":case"ㅊ": setRate(r=>Math.min(2.0,+(r+0.1).toFixed(1))); break;
        case "k":case"ㅏ": v.currentTime-=10; m="10초 ⏪️"; break;
        case "l":case"ㅣ": v.currentTime-=5 ; m="5초 ⏪️"; break;
        case "r":case"ㄱ": v.currentTime+=5 ; m="5초 ⏩️"; break;
        case "m":case"ㅡ": v.currentTime+=10; m="10초 ⏩️"; break;
        case "n":case"ㅜ": setVol(vl=>Math.max(0,vl-5)); break;
        case "o":case"ㅐ": setVol(vl=>Math.min(100,vl+5)); break;
        case "h":case"ㅗ": setFlip(f=>!f); break;
        case "Escape":case"j":case"ㅓ": v.pause(); setIsMenu(true); break;
        case "`": nav(-1); break;
      }
      if(m){ setJump(m); setTimeout(()=>setJump(""),800);}
    };
    window.addEventListener("keydown",hd);
    return()=>window.removeEventListener("keydown",hd);
  },[isMenu,hover,aiReady,job,nav]);

  /* 3. 동기화 */
  useEffect(()=>{ if(vidRef.current) vidRef.current.playbackRate=rate;},[rate]);
  useEffect(()=>{ if(vidRef.current) vidRef.current.volume=vol/100; },[vol]);
  useEffect(()=>{
    const v=vidRef.current;if(!v) return;
    const t=()=>setCur(v.currentTime);
    const m=()=>setDuration(v.duration);
    const r=()=>setVW(window.innerWidth);
    window.addEventListener("resize",r); r();
    v.addEventListener("timeupdate",t);
    v.addEventListener("loadedmetadata",m);
    return()=>{
      window.removeEventListener("resize",r);
      v.removeEventListener("timeupdate",t);
      v.removeEventListener("loadedmetadata",m);
    };
  },[src]);

  /* 4. 렌더 */
  if(!job) return <div className="flex items-center justify-center min-h-screen bg-black text-white">Loading…</div>;

  const isOriginal = src===job.originalUrl;

  return(
    <div className={`flex flex-col items-center min-h-screen bg-black text-white ${isMenu?"justify-center":"justify-start"}`}>
      {/* ─ 메뉴 ─ */}
      {isMenu && (
        <div className="flex gap-8">
          {[
            {label:"원본 영상", disabled:false},
            {label:aiReady?"AI 처리 영상":"AI 처리중…", disabled:!aiReady},
          ].map((btn,i)=>(
            <button key={i} disabled={btn.disabled}
              onMouseEnter={()=>{if(!btn.disabled) setHover(i as 0|1);}}
              onClick={()=>{
                if(!btn.disabled){
                  setSrc(i===0?job.originalUrl:job.aiUrl);
                  setIsMenu(false);
                }
              }}
              className={`px-8 py-3 text-xl rounded-lg font-semibold transition-all
                          ${hover===i
                             ?"bg-[#b777df]/40 border-4 border-white"
                             :btn.disabled
                               ?"bg-gray-800 text-gray-500 cursor-not-allowed"
                               :"bg-gray-700 text-gray-300"}`}>
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* ─ 플레이어 ─ */}
      {!isMenu && (
        <div className="relative w-full h-full">
          {!loaded && <img src={spinner} alt="loading"
                           className="absolute inset-0 w-20 h-20 m-auto"/>}

          <video
            ref={vidRef} src={src} autoPlay loop
            onLoadedData={()=>setLoaded(true)}
            style={{
              position:isOriginal?"absolute":"static",
              right:isOriginal?0:undefined,
              top:isOriginal?BOX_Y:undefined,
              width:isOriginal?BOX_W:"100vw",
              height:isOriginal?"auto":"100vh",
              objectFit:"contain",
              transform:flip?"scaleX(-1)":"none",
              opacity:opa/100,
              pointerEvents:"none",userSelect:"none",
            }}
            disablePictureInPicture controlsList="nodownload nofullscreen noremoteplayback"
          />

          {/* 프로그레스 */}
          <div className="absolute h-3 bg-[#b777df]/40 rounded-full"
               style={{top:"5vh",left:"50%",transform:"translateX(-50%)",width:vw}}>
            <div className="h-full bg-[#b777df] rounded-full"
                 style={{width:`${duration?(cur/duration)*100:0}%`}}/>
          </div>

          {/* 시간 */}
          <div className="absolute text-2xl"
               style={{top:"5.5vh",left:"50%",transform:"translateX(-50%)"}}>
            {fmt(cur)} / {fmt(duration)}
          </div>

          {/* 상태 패널 (왼쪽 상단) */}
          <div
            className="absolute bg-black/60 rounded-lg pointer-events-none text-xl space-y-4"
            style={{top:"300px",left:"20px",padding:"12px 16px"}}
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
              <span>{icons.flip}</span><span>반전 {flip?"ON":"OFF"}</span>
            </div>
          </div>

          {/* 가이드 & 점프 */}
          <JoystickGuide/>
          {jump &&
            <div className="absolute text-xl bg-black/70 px-4 py-2 rounded-md"
                 style={{top:"8vh",left:"50%",transform:"translateX(-50%)"}}>
              {jump}
            </div>}
        </div>
      )}
    </div>
  );
};

export default PlayMode3;
