"use client";

import { useState } from "react";
import {
  Play,
  Square,
  RefreshCw,
  History,
  Trash2,
  Clock,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useConnectionHistory } from "../hooks";
import type { ConnectionStatus, WebSocketConfig } from "../hooks";

interface ConnectionPanelProps {
  lang: "zh" | "en";
  status: ConnectionStatus;
  config: WebSocketConfig;
  onConnect: (url: string, options?: Partial<WebSocketConfig>) => void;
  onDisconnect: () => void;
  onConfigChange: (config: Partial<WebSocketConfig>) => void;
}

const SAMPLE_URLS = [
  { url: "wss://echo.websocket.org", name: "Echo Server" },
  { url: "wss://ws.postman-echo.com/raw", name: "Postman Echo" },
  { url: "wss://socketsbay.com/wss/v2/1/demo/", name: "SocketsBay Demo" },
];

export function ConnectionPanel({
  lang,
  status,
  config,
  onConnect,
  onDisconnect,
  onConfigChange,
}: ConnectionPanelProps) {
  const { history, addConnection, deleteConnection, clearHistory } =
    useConnectionHistory();

  const [url, setUrl] = useState(config.url || "wss://echo.websocket.org");
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [autoReconnect, setAutoReconnect] = useState(config.autoReconnect);
  const [reconnectInterval, setReconnectInterval] = useState(
    config.reconnectInterval / 1000,
  );

  const handleConnect = () => {
    if (!url.trim()) return;
    addConnection(url, autoReconnect);
    onConnect(url, {
      autoReconnect,
      reconnectInterval: reconnectInterval * 1000,
    });
  };

  const handleQuickConnect = (connectUrl: string) => {
    setUrl(connectUrl);
    addConnection(connectUrl, autoReconnect);
    onConnect(connectUrl, {
      autoReconnect,
      reconnectInterval: reconnectInterval * 1000,
    });
    setShowHistory(false);
  };

  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const copy =
    lang === "zh"
      ? {
          step: "01",
          title: "连接端点",
          endpoint: "目标地址",
          history: "历史记录",
          noHistory: "暂无连接历史",
          recent: "最近连接",
          clearAll: "清空",
          settings: "连接设置",
          connect: "连接",
          cancel: "取消",
          disconnect: "断开连接",
          autoReconnect: "自动重连",
          interval: "间隔",
          seconds: "秒",
          samples: "示例地址",
        }
      : {
          step: "01",
          title: "Connect endpoint",
          endpoint: "Target endpoint",
          history: "History",
          noHistory: "No connection history",
          recent: "Recent connections",
          clearAll: "Clear all",
          settings: "Connection settings",
          connect: "Connect",
          cancel: "Cancel",
          disconnect: "Disconnect",
          autoReconnect: "Auto reconnect",
          interval: "Interval",
          seconds: "sec",
          samples: "Sample endpoints",
        };

  return (
    <section className="glass-card rounded-2xl border border-black/5 bg-[var(--surface-primary)] p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <label className="text-xs uppercase font-bold text-[var(--text-muted)] tracking-widest flex items-center gap-2">
          <span className="rounded-md bg-cyan-500/10 px-2 py-1 font-mono text-cyan-700">
            {copy.step}
          </span>
          {isConnected ? (
            <Wifi className="w-3 h-3 text-emerald-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-[var(--text-muted)]" />
          )}
          <span>{copy.title}</span>
        </label>

        <div className="flex items-center gap-2">
          {/* History dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 px-2 py-1 text-[var(--text-muted)] hover:text-cyan-600 hover:bg-[var(--info-soft)] rounded-lg transition-all text-xs font-mono"
            >
              <History className="w-3 h-3" />
              {copy.history}
              {history.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-zinc-200 rounded-full text-xs">
                  {history.length}
                </span>
              )}
            </button>

            {showHistory && (
              <div className="absolute right-0 top-full z-50 mt-1 max-h-64 w-[min(20rem,calc(100vw-4rem))] overflow-auto rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] shadow-sm">
                {history.length === 0 ? (
                  <div className="p-4 text-center text-[var(--text-muted)] text-xs">
                    {copy.noHistory}
                  </div>
                ) : (
                  <>
                    <div className="px-3 py-2 border-b border-[var(--border-subtle)] flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        {copy.recent}
                      </span>
                      <button
                        onClick={clearHistory}
                        className="text-xs text-red-500 hover:text-[var(--danger-text)]"
                      >
                        {copy.clearAll}
                      </button>
                    </div>
                    {history.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center hover:bg-[var(--info-soft)] transition-colors group"
                      >
                        <button
                          onClick={() => handleQuickConnect(h.url)}
                          disabled={isConnected || isConnecting}
                          className="flex-1 px-3 py-2 text-left disabled:opacity-50"
                        >
                          <div className="text-xs font-mono text-[var(--text-secondary)] truncate">
                            {h.name || h.url}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(h.lastConnectedAt).toLocaleDateString(
                                lang === "zh" ? "zh-CN" : "en-US",
                              )}
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">
                              ×{h.connectCount}
                            </span>
                            {h.autoReconnect && (
                              <span className="text-xs text-cyan-500">
                                <RefreshCw className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={() => deleteConnection(h.id)}
                          className="p-2 text-[var(--text-faint)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            aria-label={copy.settings}
            title={copy.settings}
            className={`p-1.5 rounded-lg transition-all ${
              showSettings
                ? "bg-[var(--info-soft)] text-cyan-600"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* URL Input */}
      <label className="mb-2 block text-xs font-medium text-[var(--text-secondary)]">
        {copy.endpoint}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !isConnected && handleConnect()
          }
          placeholder="wss://your-websocket-server.com"
          className="min-w-0 flex-grow rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] px-4 py-3 font-mono text-sm shadow-sm transition-all focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          disabled={isConnected || isConnecting}
        />

        {!isConnected && !isConnecting ? (
          <button
            onClick={handleConnect}
            disabled={!url.trim()}
            className="ui-button-primary w-full sm:w-auto"
          >
            <Play className="w-4 h-4 fill-current" />
            {copy.connect}
          </button>
        ) : (
          <button
            onClick={onDisconnect}
            className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-red-500 px-6 py-3 font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-600 active:scale-95 sm:w-auto"
          >
            <Square className="w-4 h-4 fill-current" />
            {isConnecting ? copy.cancel : copy.disconnect}
          </button>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-4 p-4 bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-subtle)]">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoReconnect}
                onChange={(e) => {
                  setAutoReconnect(e.target.checked);
                  onConfigChange({ autoReconnect: e.target.checked });
                }}
                className="w-4 h-4 rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-xs text-[var(--text-secondary)]">
                {copy.autoReconnect}
              </span>
            </label>

            {autoReconnect && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">{copy.interval}:</span>
                <input
                  type="number"
                  value={reconnectInterval}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 3);
                    setReconnectInterval(val);
                    onConfigChange({ reconnectInterval: val * 1000 });
                  }}
                  className="w-16 px-2 py-1 text-xs font-mono bg-[var(--surface-primary)] border border-[var(--border-strong)] rounded focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  min={1}
                  max={60}
                />
                <span className="text-xs text-[var(--text-muted)]">{copy.seconds}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sample URLs */}
      <div className="mt-4 flex flex-wrap items-center gap-2 pb-1 sm:gap-3">
        <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
          {copy.samples}:
        </span>
        {SAMPLE_URLS.map((s) => (
          <button
            key={s.url}
            onClick={() => setUrl(s.url)}
            disabled={isConnected || isConnecting}
            className="text-xs bg-[var(--bg-tertiary)] hover:bg-cyan-500/10 hover:text-cyan-600 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {s.name}
          </button>
        ))}
      </div>
    </section>
  );
}
