import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PocketBase from "pocketbase";

const BASE_URL = "https://ai-dam-smartmirror-pb-floral-lake-8577.fly.dev";
const pb = new PocketBase(BASE_URL);
pb.autoCancellation(false);

const Loading: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [progress, setProgress] = useState(0);
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
        case "j":
        case "ㅓ":
          setTimeout(() => {
            navigate(-1);
          }, 600);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  useEffect(() => {
    if (!id) return;

    const fetchVideo = async () => {
      try {
        const videoData = await pb.collection("videos").getOne(id);
        setVideo({
          ...videoData,
          thumbnailUrl: `${BASE_URL}/api/files/${videoData.collectionId}/${videoData.id}/${videoData.thumbnail}`,
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching video:", error);
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  useEffect(() => {
    const lastVisitedPage = localStorage.getItem("lastVisitedPage") || -1;

    if (progress < 100) {
      const interval = setInterval(() => {
        setProgress((prevProgress) => Math.min(prevProgress + 1, 100));
      }, 30);
      return () => clearInterval(interval);
    } else {
      setTimeout(() => {
        navigate(`/player/${lastVisitedPage}/${id}`);
      }, 600);
    }
  }, [progress, navigate, id]);

  if (loading) {
    return <div className="text-white">로딩 중...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      {video ? (
        <div className="bg-[#b777df]/40 backdrop-blur-lg p-6 rounded-lg w-64 text-center">
          <img
            src={video.thumbnailUrl}
            alt="thumbnail"
            className="w-full h-full aspect-[9/16] object-cover rounded-md"
          />
        </div>
      ) : (
        <p>비디오를 찾을 수 없습니다.</p>
      )}

      <div className="relative w-64 h-4 mt-10 bg-[#b777df]/40 rounded-full">
        <div
          className="absolute top-0 left-0 h-full bg-[#b777df]/100 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
        <div
          className="absolute top-0 left-0 h-full flex items-center justify-center"
          style={{ width: `${progress}%` }}
        >
          <div
            className="animate-ping bg-white w-4 h-4 rounded-full"
            style={{
              position: "absolute",
              left: `${progress - 5}%`,
              top: "-50%",
            }}
          ></div>
        </div>
      </div>

      <p className="mt-4 text-[1.25rem] font-semibold">영상 준비중...</p>
    </div>
  );
};

export default Loading;
