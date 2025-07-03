import { useEffect, useRef } from "react";

const AutoHideCursor: React.FC<{ timeout?: number }> = ({ timeout = 3000 }) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const root = document.documentElement;   // html 태그
    const body = document.body;

    const hide = () => {
      root.classList.add("cursor-hidden");
      body.classList.add("cursor-hidden");
    };
    const show = () => {
      root.classList.remove("cursor-hidden");
      body.classList.remove("cursor-hidden");
    };

    const handleMove = () => {
      /* 커서 보이기 */
      show();

      /* 기존 타이머 클리어 후 재설정 */
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(hide, timeout);
    };

    /* 첫 진입 시 바로 숨김 */
    hide();

    /* 마우스 + 터치 움직임 모두 감지 */
    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mousedown", handleMove, { passive: true });
    window.addEventListener("touchstart", handleMove, { passive: true });
    window.addEventListener("touchmove", handleMove, { passive: true });

    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mousedown", handleMove);
      window.removeEventListener("touchstart", handleMove);
      window.removeEventListener("touchmove", handleMove);
      /* 페이지 떠날 때 커서 복구 */
      show();
    };
  }, [timeout]);

  return null;
};

export default AutoHideCursor;
