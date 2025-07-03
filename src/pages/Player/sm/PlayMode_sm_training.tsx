/* ──────────────────────────────
 *  src/pages/Player/PlayMode_sm_training.tsx
 *  - 단일 영상 재생 + 섹션 네비게이션(i/ㅑ)
 *  - 섹션·서브 마커, Intro 라벨 제외
 *  - 왼쪽 상단: ① NavMenu (열려 있을 때) / ② StatusPanel(닫혀 있을 때)
 * ────────────────────────────── */
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PocketBase from "pocketbase";

import spinner         from "../../../assets/images/spinner.gif";
import JoystickGuide   from "../../../components/JoystickGuide";
import NavMenu         from "../../../components/NavMenu";

import { parseNavItems, NavItem }      from "../../../utils/parseNavItems";
import { parseSections, SectionPoint } from "../../../utils/parseSections";

/* PocketBase */
const BASE_URL = "https://ai-dam-smartmirror-pb-floral-lake-8577.fly.dev";
const pb = new PocketBase(BASE_URL);
pb.autoCancellation(false);

/* util */
const fmt = (t:number)=>`${Math.floor(t/60)}:${`${Math.floor(t%60)}`.padStart(2,"0")}`;

/* 상태 아이콘(이모지) */
const icons = { speed:"⏩️", opa:"🎞️", vol:"🔊", flip:"🔄" };

const PlayMode_sm_training:React.FC = () => {
  const nav = useNavigate();
  const { id } = useParams();

  /* refs & state */
  const vidRef        = useRef<HTMLVideoElement>(null);
  const wasPlayingRef = useRef(false);
  const [loading,setLoading] = useState(true);
  const [src    ,setSrc    ] = useState("");
  const [dur    ,setDur    ] = useState(0);
  const [cur    ,setCur    ] = useState(0);
  const [vw     ,setVW     ] = useState(0);
  const [rate   ,setRate   ] = useState(1.0);
  const [opa    ,setOpa    ] = useState(100);
  const [vol    ,setVol    ] = useState(50);
  const [flip   ,setFlip   ] = useState(false);
  const [jumpMsg,setJumpMsg] = useState("");
  const [showMenu,setShowMenu] = useState(false);

  const [items   ,setItems   ] = useState<NavItem[]>([]);
  const [sections,setSections] = useState<SectionPoint[]>([]);

  /* 1. 메타 로드 */
  useEffect(()=>{
    if(!id) return;
    (async()=>{
      const d:any = await pb.collection("video_sections").getOne(id);
      setSrc(d.video_url);
      setItems(parseNavItems(d));
      setSections(parseSections(d));
      setLoading(false);
    })();
  },[id]);

  /* 2. 플레이어 키보드 */
  useEffect(()=>{
    const hd=(e:KeyboardEvent)=>{
      if(showMenu) return;
      const v=vidRef.current;if(!v) return;
      let msg="";
      switch(e.key){
        case "i":case"ㅑ": wasPlayingRef.current=!v.paused; setShowMenu(true); return;
        case " ":case"g":case"ㅎ": v.paused?v.play():v.pause(); break;
        case "ArrowLeft":case"e":case"ㄷ": setOpa(o=>Math.max(0,o-10)); break;
        case "ArrowRight":case"f":case"ㄹ": setOpa(o=>Math.min(100,o+10)); break;
        case "ArrowDown":case"d":case"ㅇ": setRate(r=>Math.max(0.5,r-0.1)); break;
        case "ArrowUp":case"c":case"ㅊ": setRate(r=>Math.min(2.0,r+0.1)); break;
        case "k":case"ㅏ": v.currentTime-=10; msg="10초 ⏪️"; break;
        case "l":case"ㅣ": v.currentTime-=5 ; msg="5초 ⏪️"; break;
        case "r":case"ㄱ": v.currentTime+=5 ; msg="5초 ⏩️"; break;
        case "m":case"ㅡ": v.currentTime+=10; msg="10초 ⏩️"; break;
        case "n":case"ㅜ": setVol(t=>Math.max(0,t-5)); break;
        case "o":case"ㅐ": setVol(t=>Math.min(100,t+5)); break;
        case "h":case"ㅗ": setFlip(f=>!f); break;
        case "Escape":case"j":case"ㅓ": nav(-1); break;
        case "`": nav(-2); break;
      }
      if(msg){ setJumpMsg(msg); setTimeout(()=>setJumpMsg(""),1000);}
    };
    window.addEventListener("keydown",hd);
    return()=>window.removeEventListener("keydown",hd);
  },[nav,showMenu]);

  /* 3. 속성 동기화 & 리사이즈 */
  useEffect(()=>{ if(vidRef.current) vidRef.current.playbackRate=rate; },[rate]);
  useEffect(()=>{ if(vidRef.current) vidRef.current.volume=vol/100; },[vol]);
  useEffect(()=>{
    const v=vidRef.current;if(!v) return;
    const t=()=>setCur(v.currentTime);
    const m=()=>setDur(v.duration);
    const r=()=>{ if(v) setVW(v.clientWidth); };
    window.addEventListener("resize",r); r();
    v.addEventListener("timeupdate",t);
    v.addEventListener("loadedmetadata",m);
    return()=>{
      window.removeEventListener("resize",r);
      v.removeEventListener("timeupdate",t);
      v.removeEventListener("loadedmetadata",m);
    };
  },[src]);

  /* 4. 메뉴 선택 */
  const handleSelect = useCallback((sec:number)=>{
    const v=vidRef.current;if(!v) return;
    v.currentTime=sec;
    if(wasPlayingRef.current) v.play();
  },[]);

  /* 현재 섹션 index */
  const curIdx = sections.findIndex(
    (pt,i)=> cur>=pt.sec && (i===sections.length-1 || cur < sections[i+1].sec)
  );

  if(loading) return <div className="text-white text-xl">로딩 중…</div>;

  return(
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="flex flex-col items-center relative w-full h-full">

        {!src && <div className="text-lg">영상이 없습니다</div>}
        {!src && <JoystickGuide/>}

        {src && (
          <>
            {!vidRef.current?.readyState &&
              <img src={spinner} alt="loading"
                   className="absolute inset-0 w-20 h-20 m-auto"/>}

            <video
              ref={vidRef} src={src} autoPlay loop
              style={{
                width:"100vw",height:"100vh",objectFit:"cover",
                opacity:opa/100,transform:flip?"scaleX(-1)":"none",
                pointerEvents:"none",userSelect:"none",
              }}
              disablePictureInPicture controlsList="nodownload nofullscreen noremoteplayback"
            />

            {/* ── 프로그레스바 ─────────────────────── */}
            <div className="absolute h-3 bg-[#b777df]/40 rounded-full"
                 style={{top:"5vh",left:"50%",transform:"translateX(-50%)",width:vw}}>
              <div className="h-full bg-[#b777df] rounded-full"
                   style={{width:`${dur?(cur/dur)*100:0}%`}}/>

              {/* 섹션 마커 + 라벨 (Intro 제외) */}
              {sections.map((pt,i)=>{
                const pct = dur? (pt.sec/dur)*100 : 0;
                const active=i===curIdx;
                const isIntro = pt.label.toLowerCase().startsWith("intro");
                return(
                  <React.Fragment key={pt.label}>
                    <div className="absolute w-0.5 h-4 -top-1"
                         style={{left:`${pct}%`,
                                 backgroundColor:active?"#fff":"rgb(255,255,255)"}}/>
                    {!isIntro &&
                      <div className={`absolute -translate-x-1/4 whitespace-nowrap text-xl ${
                                       active?"text-white font-semibold":"text-gray-400"}`}
                           style={{left:`${pct}%`,top:"-1.8rem"}}>
                        {pt.label}
                      </div>}
                  </React.Fragment>
                );
              })}

              {/* 서브 마커 */}
              {items.map(it=>{
                if(sections.some(s=>s.sec===it.sec)) return null;
                const pct=dur?(it.sec/dur)*100:0;
                return <div key={`${it.label}-${it.sec}`}
                            className="absolute w-0.5 h-2 -top-0.5 bg-white"
                            style={{left:`${pct}%`}}/>;
              })}
            </div>

            {/* 시간 표시 */}
            <div className="absolute text-2xl"
                 style={{top:"6vh",left:"50%",transform:"translateX(-50%)"}}>
              {fmt(cur)} / {fmt(dur)}
            </div>

            {/* 점프 알림 */}
            {jumpMsg &&
              <div className="absolute text-xl bg-black/70 px-4 py-2 rounded-md"
                   style={{top:"8vh",left:"50%",transform:"translateX(-50%)"}}>
                {jumpMsg}
              </div>}

            <JoystickGuide/>

            {/* ── 왼쪽 상단 : NavMenu or StatusPanel ── */}
            {showMenu ? (
              <NavMenu
                  items={items}
                  visible={showMenu}
                  onClose={() => setShowMenu(false)}
                  onSelect={handleSelect}
                  onJump={(delta) => {
                    const v = vidRef.current;
                    if (v) v.currentTime += delta;

                    /* ─────── 점프 메시지 표시 ─────── */
                    const msg =
                      delta === -10 ? "10초 ⏪️" :
                      delta === -5  ?  "5초 ⏪️" :
                      delta ===  5  ?  "5초 ⏩️" :
                      delta === 10  ? "10초 ⏩️" : "";
                    if (msg) {
                      setJumpMsg(msg);
                      setTimeout(() => setJumpMsg(""), 1000);
                    }
                  }}
                  onFlip={() => setFlip(f => !f)} 
                />
            ) : (
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
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PlayMode_sm_training;
