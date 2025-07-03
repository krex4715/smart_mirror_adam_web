import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Mode3: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 아무 키 누르면 메인으로
    const handleKeyDown = () => navigate("/main");
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-[3rem] font-bold animate-pulse">Launching&nbsp;Soon!! 🚀</h1>
    </div>
  );
};

export default Mode3;
