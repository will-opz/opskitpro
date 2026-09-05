"use client";

import { useState } from "react";
import {
  Activity,
  Binary,
  ChevronDown,
  MessageSquare,
  Settings2,
} from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { useMultiConnection } from "./hooks";
import {
  ConnectionPanel,
  MessageComposer,
  LogViewer,
  StatsPanel,
  SessionManager,
  BinaryComposer,
  PingMonitor,
  ConnectionTabs,
} from "./components";

type ViewMode = "text" | "binary" | "ping";

type Lang = "zh" | "en";

export default function WebsocketClient({
  dict,
  lang,
}: {
  dict: any;
  lang: Lang;
}) {
  const {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    connect,
    disconnect,
    send,
    addTab,
    removeTab,
    renameTab,
    clearLogs,
    canAddTab,
  } = useMultiConnection();

  const [viewMode, setViewMode] = useState<ViewMode>("text");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const shellText = {
    zh: {
      badge: "实时传输实验室",
      home: "首页",
      tools: "工具",
      title: dict.tools.websocket_title,
      desc: dict.tools.websocket_desc,
      text: "文本",
      binary: "二进制",
      ping: "心跳",
      connected: "已连接",
      connecting: "连接中...",
      error: "连接异常",
      disconnected: "未连接",
      advanced: "高级功能",
      simpleHint: "连接端点、发送消息、查看流量日志。",
    },

    en: {
      badge: "Real-Time Transport Lab",
      home: "Home",
      tools: "Tools",
      title: dict.tools.websocket_title,
      desc: dict.tools.websocket_desc,
      text: "Text",
      binary: "Binary",
      ping: "Ping",
      connected: "Connected",
      connecting: "Connecting...",
      error: "Error",
      disconnected: "Disconnected",
      advanced: "Advanced",
      simpleHint:
        "Connect an endpoint, send messages, and inspect traffic logs.",
    },
  }[lang];

  const handleConnect = (url: string, options?: any) => {
    connect(activeTabId, url, options);
  };

  const handleDisconnect = () => {
    disconnect(activeTabId);
  };

  const handleSend = (data: string | ArrayBuffer) => {
    send(activeTabId, data);
  };

  const handleSendPing = () => {
    send(activeTabId, JSON.stringify({ type: "ping", timestamp: Date.now() }));
  };

  const handleLoadSession = (logs: any[]) => {
    // Would need to implement session loading into current tab
    console.log("Load session:", logs.length, "messages");
  };

  return (
    <div className="relative overflow-hidden bg-[var(--bg-primary)] pb-12 font-sans text-[var(--text-secondary)] selection:bg-cyan-500/20 selection:text-[var(--text-primary)] sm:pb-16">
      {/* Background */}

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <main className="w-full max-w-6xl mx-auto px-6 mt-8 md:mt-12 z-20 relative font-sans">
        <ToolPageHeader
          title={shellText.title}
          description={shellText.simpleHint}
          processing={lang === "zh" ? "浏览器直连目标服务" : "Browser connects directly to your target"}
          mode="network"
        />

        <div className="mb-6 mt-4 flex flex-wrap items-center gap-3">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-widest transition-all ${
                  activeTab.status === "connected"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-[var(--accent-text)]"
                    : activeTab.status === "connecting"
                      ? "bg-amber-500/10 border-amber-500/20 text-[var(--warning-text)] animate-pulse"
                      : activeTab.status === "error"
                        ? "bg-red-500/10 border-red-500/20 text-[var(--danger-text)]"
                        : "bg-[var(--bg-tertiary)] border-[var(--border-strong)] text-[var(--text-muted)]"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    activeTab.status === "connected"
                      ? "bg-emerald-500 shadow-[0_0_8px_#10b981]"
                      : activeTab.status === "connecting"
                        ? "bg-amber-500"
                        : activeTab.status === "error"
                          ? "bg-red-500"
                          : "bg-zinc-400"
                  }`}
                />
                {activeTab.status === "connected"
                  ? shellText.connected
                  : activeTab.status === "connecting"
                    ? shellText.connecting
                    : activeTab.status === "error"
                      ? shellText.error
                      : shellText.disconnected}
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanced((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] px-3 py-2 text-xs font-bold text-[var(--text-secondary)] shadow-sm transition hover:border-cyan-500/30 hover:bg-[var(--info-soft)] hover:text-cyan-700"
              >
                <Settings2 className="h-4 w-4" />
                {shellText.advanced}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                />
              </button>
        </div>

        {showAdvanced && (
          <section className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 shadow-sm backdrop-blur-xl">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <ConnectionTabs
                lang={lang}
                tabs={tabs}
                activeTabId={activeTabId}
                onSelectTab={setActiveTabId}
                onAddTab={addTab}
                onRemoveTab={removeTab}
                onRenameTab={renameTab}
                canAddTab={canAddTab}
              />
              <SessionManager
                lang={lang}
                currentUrl={activeTab.url}
                currentLogs={activeTab.logs}
                onLoadSession={handleLoadSession}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                {
                  mode: "text" as ViewMode,
                  label: shellText.text,
                  icon: MessageSquare,
                  tone: "text-cyan-600",
                },
                {
                  mode: "binary" as ViewMode,
                  label: shellText.binary,
                  icon: Binary,
                  tone: "text-purple-600",
                },
                {
                  mode: "ping" as ViewMode,
                  label: shellText.ping,
                  icon: Activity,
                  tone: "text-[var(--warning-text)]",
                },
              ].map((item) => {
                const Icon = item.icon;
                const active = viewMode === item.mode;
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setViewMode(item.mode)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      active
                        ? `border-[var(--border-strong)] bg-[var(--surface-primary)] shadow-sm ${item.tone}`
                        : "border-transparent bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Connection Panel */}
          <div className="lg:col-span-12">
            <ConnectionPanel
              lang={lang}
              status={activeTab.status}
              config={activeTab.config}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onConfigChange={() => {}}
            />
          </div>

          {/* Stats Panel */}
          {showAdvanced && (
            <div className="lg:col-span-12">
              <StatsPanel
                lang={lang}
                status={activeTab.status}
                stats={activeTab.stats}
              />
            </div>
          )}

          {/* Message Composer based on view mode */}
          <div className="lg:col-span-12">
            {(!showAdvanced || viewMode === "text") && (
              <MessageComposer
                lang={lang}
                status={activeTab.status}
                onSend={handleSend}
              />
            )}
            {showAdvanced && viewMode === "binary" && (
              <BinaryComposer status={activeTab.status} onSend={handleSend} />
            )}
            {showAdvanced && viewMode === "ping" && (
              <PingMonitor
                status={activeTab.status}
                onSendPing={handleSendPing}
              />
            )}
          </div>

          {/* Log Viewer */}
          <div className="lg:col-span-12">
            <LogViewer
              lang={lang}
              logs={activeTab.logs}
              onClear={() => clearLogs(activeTabId)}
            />
          </div>
        </div>
      </main>

      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .bg-grid-zinc-900\/\[0\.03\] {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2318181b' fill-opacity='0.03'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
}
