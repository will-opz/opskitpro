"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Activity,
  Play,
  Square,
  Zap,
} from "lucide-react";
import type { ConnectionStatus } from "../hooks";

interface PingMonitorProps {
  status: ConnectionStatus;
  onSendPing: () => void;
}

interface PingRecord {
  id: number;
  sentAt: number;
  receivedAt?: number;
  latency?: number;
  timeout: boolean;
}

export function PingMonitor({ status, onSendPing }: PingMonitorProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [interval, setIntervalValue] = useState(5);
  const [pingHistory, setPingHistory] = useState<PingRecord[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingPingRef = useRef<number | null>(null);

  const stats = {
    sent: pingHistory.length,
    received: pingHistory.filter((p) => !p.timeout && p.latency).length,
    timeouts: pingHistory.filter((p) => p.timeout).length,
    avgLatency: Math.round(
      pingHistory
        .filter((p) => p.latency)
        .reduce((sum, p) => sum + (p.latency || 0), 0) /
        (pingHistory.filter((p) => p.latency).length || 1),
    ),
    minLatency: Math.min(
      ...pingHistory.filter((p) => p.latency).map((p) => p.latency!),
      Infinity,
    ),
    maxLatency: Math.max(
      ...pingHistory.filter((p) => p.latency).map((p) => p.latency!),
      0,
    ),
  };

  const sendPing = useCallback(() => {
    if (status !== "connected") return;

    const id = Date.now();
    pendingPingRef.current = id;

    setPingHistory((prev) => [
      ...prev.slice(-49),
      {
        id,
        sentAt: id,
        timeout: false,
      },
    ]);

    onSendPing();

    // Timeout after 5 seconds
    setTimeout(() => {
      if (pendingPingRef.current === id) {
        setPingHistory((prev) =>
          prev.map((p) => (p.id === id ? { ...p, timeout: true } : p)),
        );
        pendingPingRef.current = null;
      }
    }, 5000);
  }, [status, onSendPing]);

  // Simulate receiving pong (in real app, this would be triggered by actual response)
  useEffect(() => {
    if (pendingPingRef.current && pingHistory.length > 0) {
      const lastPing = pingHistory[pingHistory.length - 1];
      if (!lastPing.latency && !lastPing.timeout) {
        // Simulate response after random delay (replace with actual WS response handling)
        const delay = Math.random() * 100 + 10;
        const timeoutId = setTimeout(() => {
          const now = Date.now();
          setPingHistory((prev) =>
            prev.map((p) =>
              p.id === lastPing.id
                ? { ...p, receivedAt: now, latency: now - p.sentAt }
                : p,
            ),
          );
          pendingPingRef.current = null;
        }, delay);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [pingHistory]);

  const startPinging = () => {
    setIsRunning(true);
    sendPing();
    timerRef.current = setInterval(sendPing, interval * 1000);
  };

  const stopPinging = () => {
    setIsRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (status !== "connected" && isRunning) {
      stopPinging();
    }
  }, [status, isRunning]);

  const isConnected = status === "connected";

  return (
    <div className="glass-card rounded-2xl border border-black/5 bg-[var(--surface-primary)] backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--surface-primary)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500/10 flex items-center justify-center rounded-lg">
            <Activity className="w-4 h-4 text-[var(--warning-text)]" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
            Ping Monitor
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Interval setting */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Every</span>
            <input
              type="number"
              value={interval}
              onChange={(e) =>
                setIntervalValue(Math.max(1, parseInt(e.target.value) || 5))
              }
              disabled={isRunning}
              className="w-12 px-2 py-1 text-xs font-mono bg-[var(--surface-primary)] border border-[var(--border-strong)] rounded focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-50"
              min={1}
              max={60}
            />
            <span className="text-xs text-[var(--text-muted)]">sec</span>
          </div>

          {/* Control buttons */}
          {!isRunning ? (
            <button
              onClick={startPinging}
              disabled={!isConnected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-all disabled:opacity-30"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Start
            </button>
          ) : (
            <button
              onClick={stopPinging}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              Stop
            </button>
          )}

          {/* Single ping */}
          <button
            onClick={sendPing}
            disabled={!isConnected || isRunning}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--warning-text)] hover:bg-[var(--warning-soft)] rounded-lg transition-all disabled:opacity-30"
            title="Send single ping"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--surface-secondary)] rounded-xl p-3 text-center">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Sent
          </div>
          <div className="text-xl font-black text-[var(--text-secondary)]">{stats.sent}</div>
        </div>
        <div className="bg-[var(--accent-soft)] rounded-xl p-3 text-center">
          <div className="text-xs text-[var(--accent-text)] uppercase tracking-wider mb-1">
            Received
          </div>
          <div className="text-xl font-black text-[var(--accent-text)]">
            {stats.received}
          </div>
        </div>
        <div className="bg-[var(--danger-soft)] rounded-xl p-3 text-center">
          <div className="text-xs text-[var(--danger-text)] uppercase tracking-wider mb-1">
            Timeouts
          </div>
          <div className="text-xl font-black text-[var(--danger-text)]">
            {stats.timeouts}
          </div>
        </div>
        <div className="bg-[var(--warning-soft)] rounded-xl p-3 text-center">
          <div className="text-xs text-[var(--warning-text)] uppercase tracking-wider mb-1">
            Avg Latency
          </div>
          <div className="text-xl font-black text-[var(--warning-text)]">
            {stats.avgLatency || "--"}ms
          </div>
        </div>
      </div>

      {/* Latency chart (simple bar visualization) */}
      {pingHistory.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex items-end gap-0.5 h-16 bg-[var(--surface-secondary)] rounded-xl p-2">
            {pingHistory.slice(-50).map((ping) => {
              const height = ping.timeout
                ? 100
                : ping.latency
                  ? Math.min(ping.latency / 2, 100)
                  : 0;
              return (
                <div
                  key={ping.id}
                  className={`flex-1 rounded-t transition-all ${
                    ping.timeout
                      ? "bg-red-400"
                      : ping.latency
                        ? "bg-emerald-400"
                        : "bg-zinc-200 animate-pulse"
                  }`}
                  style={{ height: `${height}%`, minWidth: "2px" }}
                  title={
                    ping.timeout
                      ? "Timeout"
                      : ping.latency
                        ? `${ping.latency}ms`
                        : "Pending"
                  }
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1 px-1">
            <span>
              Min: {stats.minLatency === Infinity ? "--" : stats.minLatency}ms
            </span>
            <span>Max: {stats.maxLatency || "--"}ms</span>
          </div>
        </div>
      )}
    </div>
  );
}
