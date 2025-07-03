/* ──────────────────────────────
 *  src/components/NavMenu.tsx
 *  - 계층형 메뉴
 *  - g/ㅎ : 선택(메뉴 유지)
 *  - k/l/r/m : ±5·10초 점프(onJump)
 *  - h/ㅗ : 반전(onFlip)   ★ NEW ★
 *  - Esc / j / ㅓ / i / ㅑ : 닫기
 * ────────────────────────────── */
import React, { useEffect, useState } from "react";
import classNames from "classnames";
import { NavItem } from "../utils/parseNavItems";

interface DisplayItem { label: string; sec: number | null; }

interface Props {
  items: NavItem[];
  visible: boolean;
  onClose: () => void;
  onSelect: (sec: number) => void;
  onJump?: (deltaSec: number) => void;   // ±5·10초 이동
  onFlip?: () => void;                  // 좌우반전      ★ NEW ★
}

/* ---------- utils ---------- */
const buildTree = (raw: NavItem[]): DisplayItem[] => {
  const out: DisplayItem[] = [];
  let cur = "";
  raw.forEach(({ label, sec }) => {
    const [prefix, sub] = label.split(" │ ").map(s => s.trim());
    if (prefix !== cur) {
      out.push({ label: prefix, sec: null });
      cur = prefix;
    }
    out.push({ label: sub, sec });
  });
  return out;
};
const firstSelectable = (list: DisplayItem[]) =>
  list.findIndex(x => x.sec !== null);

/* ---------- component ---------- */
const NavMenu: React.FC<Props> = ({
  items, visible, onClose, onSelect,
  onJump = () => {}, onFlip = () => {}
}) => {
  const list = buildTree(items);
  const [idx, setIdx] = useState(firstSelectable(list));

  /* 키보드 */
  useEffect(() => {
    if (!visible) return;

    const move = (dir: number) => {
      let i = idx;
      do {
        i = (i + dir + list.length) % list.length;
      } while (list[i].sec === null);
      setIdx(i);
    };

    const hd = (e: KeyboardEvent) => {
      switch (e.key) {
        case "c": case "ㅊ": move(-1); break;
        case "d": case "ㅇ": move(1);  break;

        case "g": case "ㅎ":
          if (list[idx].sec !== null) onSelect(list[idx].sec!);
          break;

        /* 점프 */
        case "k": case "ㅏ": onJump(-10); break;
        case "l": case "ㅣ": onJump(-5);  break;
        case "r": case "ㄱ": onJump(5);   break;
        case "m": case "ㅡ": onJump(10);  break;

        /* 좌우반전 */
        case "h": case "ㅗ": onFlip(); break;   /* ★ 추가 ★ */

        /* 닫기 */
        case "Escape":
        case "j": case "ㅓ":
        case "i": case "ㅑ":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", hd);
    return () => window.removeEventListener("keydown", hd);
  }, [visible, idx, list, onClose, onSelect, onJump, onFlip]);

  if (!visible) return null;

  return (
    <div
      className="absolute bg-black/60 rounded-lg pointer-events-auto"
      style={{ top: "300px", left: "20px", padding: "12px 24px" }}
    >
      <ul className="space-y-1 w-40">
        {list.map((it, i) => (
          <li
            key={`${it.label}-${i}`}
            className={classNames(
              it.sec === null
                ? "font-semibold text-xl text-gray-200"
                : "text-gray-400 pl-6 text-lg cursor-pointer hover:text-white",
              it.sec !== null && i === idx && "bg-fuchsia-600 text-white rounded px-1"
            )}
          >
            {it.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NavMenu;
