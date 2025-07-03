import React from "react";
import { QRCodeSVG } from "qrcode.react";

/* 필요하면 링크만 수정해서 쓰세요 */
const LINKS = [
  {
    url: "https://auth.ai-dam.ai/faq.html",   // 문의·FAQ
    label: "🙏 문의 접수",
  },
];

const SupportQrs: React.FC = () => (
  <div className="fixed bottom-6 right-6 z-[60] flex gap-8">
    {LINKS.map(({ url, label }) => (
      <div key={label} className="flex flex-col items-center">
        <span className="mt-2 text-2xl text-white/80 whitespace-nowrap">
          {label}
        </span>
        <QRCodeSVG
          value={url}
          size={200}             /* ↔ 필요하면  픽셀 크기 조정 */
          bgColor="transparent"
          fgColor="#ffffff"
        />
        
      </div>
    ))}
  </div>
);

export default SupportQrs;
