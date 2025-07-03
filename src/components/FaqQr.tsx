import React from "react";
import { QRCodeSVG } from "qrcode.react";

const FAQ_URL = "https://auth.ai-dam.ai/faq.html";

const FaqQr: React.FC = () => (
  <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-center">
    <QRCodeSVG
      value={FAQ_URL}
      size={160}             /* ← 110 → 160 px */
      bgColor="transparent"
      fgColor="#ffffff"
    />
    <span className="mt-2 text-sm text-white/80">문의 · FAQ</span>
  </div>
);

export default FaqQr;
