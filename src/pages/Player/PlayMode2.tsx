import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import spinner from "../../assets/images/spinner.gif";
import PocketBase from "pocketbase";

const BASE_URL = "https://ai-dam-smartmirror-pb-floral-lake-8577.fly.dev";
const pb = new PocketBase(BASE_URL);

const PlayMode2: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoWidth, setVideoWidth] = useState(0);

  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  // eslint-disable-next-line
  const [videoSrc, setVideoSrc] = useState<string>("");

  const [showModal, setShowModal] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [opacity, setOpacity] = useState(30);
  const [volume, setVolume] = useState(50);
  const [recordMessage, setRecordMessage] =
    useState<string>("X 버튼을 눌러서 녹화해보세요");
  const [isMultipleMenu, setIsMultipleMenu] = useState(false);
  const [isMenuSelect, setIsMenuSelect] = useState(false);
  const [hoverMenu, setHoverMenu] = useState<boolean>(true);

  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(
    null
  );
  const recordingChunks = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (isRecording || !videoRef.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: undefined },
      audio: true,
    });

    setRecordingStream(stream);

    const mediaRecorder = new MediaRecorder(stream);
    recordingChunks.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordingChunks.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordingChunks.current);
      const url = URL.createObjectURL(blob);
      console.log("녹화 완료, 영상 URL:", url);
    };

    mediaRecorder.start();
    setRecorder(mediaRecorder);
    setIsRecording(true);

    if (videoRef.current) {
      videoRef.current.play();
    }
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      setIsRecording(false);
      setRecordMessage("녹화 종료!");
    }

    if (recordingStream) {
      recordingStream.getTracks().forEach((track) => track.stop());
    }
  }, [recorder, recordingStream]);

  useEffect(() => {
    if (!recorder) return;

    recorder.ondataavailable = (e) => {
      recordingChunks.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordingChunks.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);

      const now = new Date();
      const formattedDate = now.toLocaleDateString("ko-KR").replace(/\D/g, "");
      const formattedTime = now.toTimeString().slice(0, 5).replace(":", "");
      const filename = `${formattedDate}_${formattedTime}_${id}`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      recordingChunks.current = [];
    };
  }, [recorder, id, stopRecording, startRecording]);

  useEffect(() => {
    if (!id) return;

    const fetchVideo = async () => {
      try {
        const data = await pb
          .collection("videos")
          .getOne(id, { expand: "artist_name" });

        if (data) {
          setVideo({
            ...data,
            videoFileUrl: `${BASE_URL}/api/files/${data.collectionId}/${data.id}/${data.video_file}`,
            videoFileOriginalUrl: `${BASE_URL}/api/files/${data.collectionId}/${data.id}/${data.video_file_original}`,
            videoTigrisUrl: data.video_url,
            videoTigrisOriginalUrl: data.video_url_original,
          });

          if (data.video_url && data.video_url_original) {
            setIsMenuSelect(true);
            setIsMultipleMenu(true);
          } else if (data.video_url || data.video_url_original) {
            setIsMenuSelect(false);
            setVideoSrc(data.video_url || data.video_url_original);
          }
        }
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [navigate, id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMenuSelect) {
        if (
          e.key === "e" ||
          e.key === "ㄷ" ||
          e.key === "f" ||
          e.key === "ㄹ" ||
          e.key === "ArrowLeft" ||
          e.key === "ArrowRight"
        ) {
          setHoverMenu((prev) => !prev);
        } else if (e.key === "Enter" || e.key === "g" || e.key === "ㅎ") {
          if (hoverMenu) {
            setVideoSrc(video.videoTigrisUrl || "");
          } else {
            setVideoSrc(video.videoTigrisOriginalUrl || "");
          }
          setIsMenuSelect(false);
        } else if (e.key === "Escape" || e.key === "j" || e.key === "ㅓ") {
          setTimeout(() => {
            navigate(-1);
          }, 600);
        }
      } else if (showModal) {
        if (e.key === "Escape" || e.key === "j" || e.key === "ㅓ") {
          setShowModal(false);
        } else {
          setTimeout(() => {
            navigate("/main");
          }, 500);
        }
      } else {
        if (!videoRef.current) return;

        switch (e.key) {
          case "h":
          case "ㅗ":
          case "z":
          case "ㅋ":
            if (isRecording) {
              setRecordMessage("녹화 정지!");
              stopRecording();
            } else {
              let countdown = 5;
              const countdownInterval = setInterval(() => {
                if (countdown > 0) {
                  setRecordMessage(`${countdown}초 뒤 녹화 시작`);
                  countdown--;
                } else {
                  clearInterval(countdownInterval);
                  setRecordMessage("녹화 중...");
                  startRecording();
                  if (videoRef.current) {
                    videoRef.current.play();
                  }
                }
              }, 1000);
            }
            e.preventDefault();

            break;
          case "ArrowLeft":
          case "e":
          case "ㄷ":
            setOpacity((prev) => Math.max(0, prev - 10));
            break;
          case "ArrowRight":
          case "f":
          case "ㄹ":
            setOpacity((prev) => Math.min(100, prev + 10));
            break;
          case "ArrowDown":
          case "d":
          case "ㅇ":
            setPlaybackRate((prev) => Math.max(0.5, prev - 0.1));
            break;
          case "ArrowUp":
          case "c":
          case "ㅊ":
            setPlaybackRate((prev) => Math.min(2.0, prev + 0.1));
            break;
          case "n":
          case "ㅜ":
            setVolume((prev) => Math.max(0, prev - 5));
            break;
          case "o":
          case "ㅐ":
            setVolume((prev) => Math.min(100, prev + 5));
            break;
          case "s":
          case "ㄴ":
            setShowModal(true);
            setTimeout(() => {
              navigate("/main");
            }, 1000);
            break;
          case "Escape":
          case "j":
          case "ㅓ":
            if (isMultipleMenu) {
              setVideoSrc("");
              setIsMenuSelect(true);
            } else {
              setIsMenuSelect(false);
              setVideoSrc("");
              setTimeout(() => {
                navigate("/mode1");
              }, 600);
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    navigate,
    showModal,
    isMenuSelect,
    isMultipleMenu,
    hoverMenu,
    video,
    isRecording,
    recorder,
    recordingStream,
    startRecording,
    stopRecording,
  ]);

  // 영상 끝나면 자동 녹화 종료
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleEnded = () => {
      if (isRecording) {
        stopRecording();
      }
    };

    videoElement.addEventListener("ended", handleEnded);
    return () => {
      videoElement.removeEventListener("ended", handleEnded);
    };
  }, [isRecording, stopRecording]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const updateProgress = () => {
      if (!isNaN(videoElement.currentTime)) {
        setCurrentTime(videoElement.currentTime);
      }
    };

    const updateDuration = () => {
      if (!isNaN(videoElement.duration)) {
        setDuration(videoElement.duration);
      }
    };

    const handleResize = () => {
      if (videoRef.current) {
        setVideoWidth(videoRef.current.clientWidth);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    videoElement.addEventListener("timeupdate", updateProgress);
    videoElement.addEventListener("loadedmetadata", updateDuration);

    return () => {
      window.removeEventListener("resize", handleResize);
      videoElement.removeEventListener("timeupdate", updateProgress);
      videoElement.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [videoSrc]);

  if (loading) {
    return (
      <div className="text-[1.25rem] font-bold text-black">로딩 중...</div>
    );
  }

  if (!video) {
    return (
      <div className="text-[1.25rem] font-bold text-black">로딩 중...</div>
    );
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    // console.log("플레이시간", minutes, seconds);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      {/* <h3 className="mt-6 text-[1.25rem] font-bold text-black">
        AR 댄스 트레이닝
      </h3> */}

      {isMenuSelect ? (
        <div className="flex items-center justify-center">
          <div className="flex gap-4">
            <button
              className={`py-2 px-4 text-[1.25rem] rounded-lg font-semibold ${
                hoverMenu
                  ? "bg-[#b777df]/40 text-white transition-all duration-[300ms] border-white border-4"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              튜토리얼 영상
            </button>
            <button
              className={`py-2 px-4 text-[1.25rem] rounded-lg font-semibold ${
                !hoverMenu
                  ? "bg-[#b777df]/40 text-white transition-all duration-[300ms] border-white border-4"
                  : "bg-gray-700 text-gray-300"
              }`}
            >
              안무 영상
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center relative">
          {!videoLoaded && (
            <img
              src={spinner}
              alt="Loading..."
              className="absolute inset-0 w-20 h-20 mx-auto my-auto"
            />
          )}
          <video
            ref={videoRef}
            loop
            disablePictureInPicture
            controlsList="nodownload nofullscreen noremoteplayback"
            style={{
              opacity: opacity / 100,
              pointerEvents: "none",
              userSelect: "none",
              objectFit: "cover",
              width: "100vw",
              height: "100vh",
            }}
            onLoadedData={() => setVideoLoaded(true)}
            className="w-full h-full"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>

          {/* 플레이어바 */}
          <div
            className="absolute w-full h-3 bg-[#b777df]/40 rounded-full cursor-pointer"
            style={{
              top: "4vh",
              left: "50%",
              transform: "translateX(-50%)",
              width: videoWidth,
              opacity: opacity / 100,
              marginBottom: "10cm",
            }}
          >
            <div className="relative w-full h-2 bg-[#b777df]/40 rounded-full cursor-pointer">
              <div
                className="absolute h-full bg-[#b777df]/100 rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-center w-full text-sm mt-2 px-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* 영상 상태바 */}
          <div
            className="absolute text-xl bg-black/50 px-4 pb-2 rounded-md z-10"
            style={{
              top: "6.8vh",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            배속: {playbackRate.toFixed(1)}x | 투명도: {opacity}% | 볼륨:{" "}
            {volume}%
          </div>

          {/* 녹화 시작 메세지 */}
          {recordMessage && (
            <div
              className="absolute text-xl bg-black/70 px-4 py-2 rounded-md transition-opacity duration-500 z-10"
              style={{
                top: "8vh",
                left: "50%",
                transform: "translateX(-50%)",
                marginBottom: "20cm",
              }}
            >
              {recordMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayMode2;
