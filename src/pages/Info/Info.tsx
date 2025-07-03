import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import spinner from "../../assets/images/spinner.gif";
import PocketBase from "pocketbase";

const BASE_URL = "https://ai-dam-smartmirror-pb-floral-lake-8577.fly.dev";
const pb = new PocketBase(BASE_URL);
pb.autoCancellation(false);

const Info: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hoverConfirm, setHoverConfirm] = useState<boolean>(true);
  const [videoLoaded, setVideoLoaded] = useState(false);

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
            videoPreviewStartTime: data.preview_start,
            videoPreviewEndTime: data.preview_end,
            videoFileUrl: `${BASE_URL}/api/files/${data.collectionId}/${data.id}/${data.video_file}`,
            videoFileOriginalUrl: `${BASE_URL}/api/files/${data.collectionId}/${data.id}/${data.video_file_original}`,
            videoTigrisUrl: `${data.video_url}`,
            videoTigrisOriginalUrl: `${data.video_url_original}`,
          });
        }
      } catch (error) {
        console.error("Error fetching video:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!video) return;

      if (
        e.key === "e" ||
        e.key === "ㄷ" ||
        e.key === "f" ||
        e.key === "ㄹ" ||
        e.key === "ArrowLeft" ||
        e.key === "ArrowRight"
      ) {
        setHoverConfirm((prev) => !prev);
      } else if (e.key === "Enter" || e.key === "g" || e.key === "ㅎ") {
        if (hoverConfirm) {
          navigate(`/loading/${video.id}`);
        } 
        else {
          navigate(-1);
        }
      }
      else if (e.key === "Escape" || e.key === "j" || e.key === "ㅓ") {
        setTimeout(() => {
          navigate(-1);
        }, 600);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, video, hoverConfirm]);

  if (loading) {
    return <div className="text-white">로딩 중...</div>;
  }

  if (!video) {
    return <div className="text-white">Loading.....</div>;
  }

  const getVideoSrc = (video: {
    videoTigrisUrl?: string;
    videoTigrisOriginalUrl?: string;
    videoPreviewStartTime?: number;
    videoPreviewEndTime?: number;
  }) => {
    const {
      videoTigrisUrl,
      videoTigrisOriginalUrl,
      videoPreviewStartTime = 0,
      videoPreviewEndTime = 0,
    } = video;

    const baseUrl = videoTigrisUrl || videoTigrisOriginalUrl || "";

    const isZeroRange =
      videoPreviewStartTime === 0 && videoPreviewEndTime === 0;

    if (isZeroRange) {
      return `${baseUrl}#t=3,10`;
    }

    return `${baseUrl}#t=${videoPreviewStartTime},${videoPreviewEndTime}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-[3rem] font-bold mb-10">안무 미리보기</h1>

      <div className="bg-white/40 backdrop-blur-lg p-6 rounded-lg w-64 h-full aspect-[9/16] flex items-center justify-center">
        {!videoLoaded && (
          <img
            src={spinner}
            alt="Loading..."
            className="absolute inset-0 w-20 h-20 mx-auto my-auto"
          />
        )}
        <video
          autoPlay
          loop
          onLoadedData={() => setVideoLoaded(true)}
          onCanPlayThrough={() => setVideoLoaded(true)}
          className="w-full h-full rounded-md"
        >
          <source src={getVideoSrc(video)} type="video/mp4" />
          브라우저가 비디오 태그를 지원하지 않습니다.
        </video>
      </div>

      <div className="flex items-center my-6">
        <div className="bg-[#b777df]/40 backdrop-blur-lg p-6 rounded-lg w-64 text-center">
          <h3 className="text-[1.5rem] font-bold">
            {video.expand?.artist_name?.name}-{video.song_name}
          </h3>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => navigate(`/loading/${video.id}`)}
          className={`py-2 px-4 text-[1.25rem] rounded font-semibold ${
            hoverConfirm
              ? "bg-green-600 transition-all duration-[300ms] border-white border-4"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          확인
        </button>
        <button
          onClick={() => navigate(-1)}
          className={`py-2 px-4 text-[1.25rem] rounded font-semibold ${
            !hoverConfirm
              ? "bg-red-600 transition-all duration-[300ms] border-white border-4"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          취소
        </button>
      </div>
    </div>
  );
};

export default Info;
