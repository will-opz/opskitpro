"use client";

import { useState } from "react";
import { Download, Info } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { ToolPageHeader } from "@/components/ToolPageHeader";

type Lang = "zh" | "en";

const QR_MAX_BYTES = 500;

function getUtf8ByteLength(value: string) {
  return new TextEncoder().encode(value).byteLength;
}

export default function QRClient({ dict, lang }: { dict: any; lang: Lang }) {
  const [text, setText] = useState("");
  const payloadBytes = getUtf8ByteLength(text);
  const isOverLimit = payloadBytes > QR_MAX_BYTES;
  const counterId = "qr-payload-counter";
  const errorId = "qr-payload-error";

  const downloadQR = () => {
    if (!text || isOverLimit) return;
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `opskitpro-qr-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-700 pt-8 md:pt-12 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-4xl mx-auto">
        <ToolPageHeader
          title={dict.tools.qrgen_title}
          description={dict.tools.qrgen_desc}
          processing={lang === "zh" ? "本地处理 · 不上传" : "Local processing · Not uploaded"}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Input Side */}
          <div className="space-y-6">
            <div className="bg-zinc-100 rounded-2xl border border-black/10 p-6 backdrop-blur-sm">
              <label className="block text-sm font-medium text-zinc-600 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" />
                {dict.tools.qrgen.helper}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={dict.tools.qrgen.placeholder}
                aria-invalid={isOverLimit}
                aria-describedby={`${counterId}${isOverLimit ? ` ${errorId}` : ""}`}
                className={`w-full h-48 sm:h-64 bg-[#fafafa]/50 border rounded-xl p-4 text-zinc-900 font-mono placeholder:text-zinc-700 focus:outline-none transition-colors resize-none ${
                  isOverLimit
                    ? "border-red-400 focus:border-red-500"
                    : "border-black/10 focus:border-emerald-500/50"
                }`}
              />
              <div className="mb-4 mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p
                  id={counterId}
                  className={`text-xs tabular-nums ${isOverLimit ? "font-semibold text-red-600" : "text-zinc-500"}`}
                >
                  {payloadBytes} / {QR_MAX_BYTES} bytes
                </p>
                {isOverLimit && (
                  <p
                    id={errorId}
                    role="alert"
                    className="text-xs font-medium text-red-600"
                  >
                    {lang === "zh"
                      ? "内容过长，请缩短后再生成二维码。"
                      : "Content is too long. Shorten it to generate a QR code."}
                  </p>
                )}
              </div>
              <button
                onClick={downloadQR}
                disabled={!text || isOverLimit}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {dict.tools.qrgen.download}
              </button>
            </div>
          </div>

          {/* Preview Side */}
          <div className="flex flex-col items-center justify-start py-8">
            <div className="relative group w-full max-w-[384px] p-4 sm:p-8 bg-white rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)] transition-transform hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/5 to-transparent pointer-events-none" />
              {text && !isOverLimit ? (
                <QRCodeSVG
                  id="qr-code-svg"
                  value={text}
                  size={320}
                  level="H"
                  includeMargin={false}
                  className="relative z-10 h-auto w-full max-w-[320px]"
                />
              ) : (
                <div className="aspect-square w-full max-w-[320px] border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-600 italic text-center px-8">
                  {isOverLimit
                    ? lang === "zh"
                      ? "内容超过 500 字节，无法生成二维码。"
                      : "Content exceeds 500 bytes and cannot be encoded."
                    : lang === "zh"
                      ? "输入内容后即可预览二维码。"
                      : "Enter content to preview QR."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
