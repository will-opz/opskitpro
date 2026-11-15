"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Plus,
  X,
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2,
  Edit3,
} from "lucide-react";
import { isImeComposing } from "@/lib/ime";
import type { ConnectionTab } from "../hooks/useMultiConnection";

interface ConnectionTabsProps {
  lang: "zh" | "en";
  tabs: ConnectionTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onAddTab: () => void;
  onRemoveTab: (id: string) => void;
  onRenameTab: (id: string, name: string) => void;
  canAddTab: boolean;
  workspaceId: string;
  focusTabId?: string;
}

export function ConnectionTabs({
  lang,
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRemoveTab,
  onRenameTab,
  canAddTab,
  workspaceId,
  focusTabId,
}: ConnectionTabsProps) {
  const id = useId();
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  useEffect(() => { if (focusTabId) buttons.current.get(focusTabId)?.focus(); }, [focusTabId]);
  const editing = useRef<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const displayName = (name: string) =>
    lang === "zh" ? name.replace(/^Connection (\d+)$/, "连接 $1") : name;
  const addLabel = lang === "zh" ? "添加连接" : "Add connection";
  const renameLabel = lang === "zh" ? "重命名连接" : "Rename connection";
  const closeLabel = lang === "zh" ? "关闭连接" : "Close connection";

  const startEdit = (tab: ConnectionTab, e: React.MouseEvent) => {
    e.stopPropagation();
    editing.current = tab.id;
    setEditingId(tab.id);
    setEditName(tab.name);
  };

  const confirmEdit = (id: string) => {
    if (editing.current !== id) return;
    editing.current = null;
    if (editName.trim()) {
      onRenameTab(id, editName.trim());
    }
    setEditingId(null);
  };

  const getStatusIcon = (status: ConnectionTab["status"]) => {
    switch (status) {
      case "connected":
        return <Wifi className="w-3 h-3 text-emerald-500" />;
      case "connecting":
        return <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <WifiOff className="w-3 h-3 text-[var(--text-muted)]" />;
    }
  };

  const getStatusColor = (
    status: ConnectionTab["status"],
    isActive: boolean,
  ) => {
    if (!isActive) return "border-transparent";
    switch (status) {
      case "connected":
        return "border-emerald-500";
      case "connecting":
        return "border-amber-500";
      case "error":
        return "border-red-500";
      default:
        return "border-cyan-500";
    }
  };

  return (
    <div role="group" aria-label={lang === "zh" ? "连接选择" : "Connections"} className="flex min-w-0 items-center gap-1 bg-[var(--bg-tertiary)] p-1 rounded-xl overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex shrink-0 items-center gap-1 px-2 py-1 rounded-lg transition-all border-b-2 ${
            activeTabId === tab.id
              ? `bg-[var(--surface-primary)] shadow-sm ${getStatusColor(tab.status, true)}`
              : "hover:bg-[var(--surface-primary)] border-transparent"
          }`}
        >
          <button
            type="button"
            ref={element => { if (element) buttons.current.set(tab.id, element); else buttons.current.delete(tab.id); }}
            aria-pressed={activeTabId === tab.id}
            aria-controls={workspaceId}
            aria-describedby={`${id}-${tab.id}-status`}
            onClick={() => onSelectTab(tab.id)}
            className="flex min-h-10 items-center gap-2 rounded px-1 text-xs font-medium text-[var(--text-primary)]"
          >
            {getStatusIcon(tab.status)}
            <span className="max-w-[100px] truncate">{displayName(tab.name)}</span>
            <span id={`${id}-${tab.id}-status`} hidden>{lang === "zh"
              ? ({ connected: "已连接", connecting: "连接中", error: "连接错误", disconnected: "未连接" }[tab.status])
              : tab.status}</span>
            {tab.logs.filter(l => l.type === "sent" || l.type === "received").length > 0 &&
              <span aria-hidden="true" className="rounded-full bg-[var(--bg-tertiary)] px-1.5">{tab.logs.filter(l => l.type === "sent" || l.type === "received").length}</span>}
          </button>
          {editingId === tab.id && <>
            <label htmlFor={`${id}-${tab.id}-name`} className="sr-only">{renameLabel}: {displayName(tab.name)}</label>
            <input
              id={`${id}-${tab.id}-name`}
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => {
                if (isImeComposing(e.nativeEvent)) return;
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmEdit(tab.id);
                  buttons.current.get(tab.id)?.focus();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  editing.current = null;
                  setEditingId(null);
                  buttons.current.get(tab.id)?.focus();
                }
              }}
              onBlur={() => confirmEdit(tab.id)}
              className="w-28 min-h-10 rounded border border-[var(--border-strong)] bg-[var(--surface-secondary)] px-2 text-sm"
              autoFocus
            />
          </>}

          {/* Actions */}
          <div className="flex items-center gap-0.5 ml-1">
            {editingId !== tab.id && (
              <button
                onClick={(e) => startEdit(tab, e)}
                type="button"
                className="flex min-h-10 min-w-10 items-center justify-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                aria-label={`${renameLabel}: ${displayName(tab.name)}`}
                title={renameLabel}
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}

            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const next = activeTabId === tab.id ? tabs.find(item => item.id !== tab.id)?.id : activeTabId;
                  if (next) buttons.current.get(next)?.focus();
                  onRemoveTab(tab.id);
                }}
                type="button"
                className="flex min-h-10 min-w-10 items-center justify-center rounded text-[var(--text-muted)] hover:text-red-500"
                aria-label={`${closeLabel}: ${displayName(tab.name)}`}
                title={closeLabel}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add tab button */}
      <button
          type="button"
          aria-disabled={!canAddTab}
          onClick={() => { if (canAddTab) onAddTab(); }}
          className="shrink-0 p-2 text-[var(--text-muted)] hover:text-cyan-600 hover:bg-[var(--surface-primary)] rounded-lg transition-all aria-disabled:opacity-40"
          aria-label={addLabel}
          title={addLabel}
        >
          <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
