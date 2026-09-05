"use client";

import { useState } from "react";
import {
  Send,
  Braces,
  ChevronDown,
  Sparkles,
  Plus,
  Trash2,
  Check,
  AlertCircle,
} from "lucide-react";
import { useMessageTemplates } from "../hooks";
import type { ConnectionStatus } from "../hooks";

interface MessageComposerProps {
  lang: "zh" | "en";
  status: ConnectionStatus;
  onSend: (message: string) => void;
}

export function MessageComposer({ lang, status, onSend }: MessageComposerProps) {
  const {
    templates,
    customTemplates,
    addTemplate,
    deleteTemplate,
    processTemplate,
    extractVariables,
  } = useMessageTemplates();

  const [message, setMessage] = useState(
    '{"type": "ping", "timestamp": ' + Date.now() + "}",
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Validate JSON in real-time
  const validateJson = (text: string) => {
    if (!text.trim()) {
      setJsonError(null);
      return;
    }
    // Only validate if it looks like JSON
    if (text.trim().startsWith("{") || text.trim().startsWith("[")) {
      try {
        JSON.parse(text);
        setJsonError(null);
      } catch (e: any) {
        setJsonError(e.message);
      }
    } else {
      setJsonError(null);
    }
  };

  const handleMessageChange = (value: string) => {
    setMessage(value);
    setSelectedTemplate(null);
    validateJson(value);
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(message);
      setMessage(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch {}
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(message);
      setMessage(JSON.stringify(parsed));
      setJsonError(null);
    } catch {}
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(templateId);
    const vars = extractVariables(template.content);

    // Initialize vars
    const initVars: Record<string, string> = {};
    vars.forEach((v) => {
      initVars[v] = "";
    });
    setTemplateVars(initVars);

    // Process and set
    const processed = processTemplate(template.content, initVars);
    setMessage(processed);
    validateJson(processed);
    setShowTemplates(false);
  };

  const updateTemplateVar = (key: string, value: string) => {
    const newVars = { ...templateVars, [key]: value };
    setTemplateVars(newVars);

    const template = templates.find((t) => t.id === selectedTemplate);
    if (template) {
      const processed = processTemplate(template.content, newVars);
      setMessage(processed);
      validateJson(processed);
    }
  };

  const handleSend = () => {
    if (status !== "connected" || !message.trim()) return;
    onSend(message);
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim() || !message.trim()) return;
    addTemplate(newTemplateName.trim(), message);
    setNewTemplateName("");
    setShowSaveDialog(false);
  };

  const currentVars = selectedTemplate
    ? extractVariables(
        templates.find((t) => t.id === selectedTemplate)?.content || "",
      )
    : [];

  const isJson =
    message.trim().startsWith("{") || message.trim().startsWith("[");
  const copy =
    lang === "zh"
      ? {
          step: "02",
          title: "编写并发送消息",
          templates: "模板",
          presets: "预设模板",
          custom: "自定义模板",
          format: "格式化",
          minify: "压缩",
          saveAsTemplate: "保存为模板",
          templateName: "模板名称",
          save: "保存",
          cancel: "取消",
          variables: "变量",
          placeholder: "输入要发送的消息（Cmd/Ctrl+Enter 发送）",
          invalid: "格式无效",
          send: "发送",
        }
      : {
          step: "02",
          title: "Compose and send",
          templates: "Templates",
          presets: "Presets",
          custom: "Custom templates",
          format: "Format",
          minify: "Minify",
          saveAsTemplate: "Save as template",
          templateName: "Template name",
          save: "Save",
          cancel: "Cancel",
          variables: "Variables",
          placeholder: "Type a message (Cmd/Ctrl+Enter to send)",
          invalid: "Invalid",
          send: "Send",
        };

  return (
    <div className="glass-card rounded-2xl border border-black/5 bg-[var(--surface-primary)] backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500/10 flex items-center justify-center rounded-lg">
            <Send className="w-4 h-4 text-cyan-600" />
          </div>
          <span className="rounded-md bg-cyan-500/10 px-2 py-1 font-mono text-xs font-bold text-cyan-700">
            {copy.step}
          </span>
          <h3 className="text-xs font-bold text-[var(--text-secondary)]">
            {copy.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Template dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--bg-tertiary)] hover:bg-zinc-200 rounded-lg text-xs font-mono font-bold text-[var(--text-secondary)] transition-all"
            >
              <Sparkles className="w-3 h-3" />
              {copy.templates}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showTemplates ? "rotate-180" : ""}`}
              />
            </button>

            {showTemplates && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-[var(--surface-primary)] rounded-xl shadow-sm border border-[var(--border-strong)] z-50 max-h-80 overflow-auto">
                <div className="p-2 border-b border-[var(--border-subtle)]">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    {copy.presets}
                  </span>
                </div>
                {templates
                  .filter((t) => t.category === "preset")
                  .map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t.id)}
                      className="w-full px-3 py-2 text-left hover:bg-[var(--info-soft)] transition-colors flex items-center justify-between group"
                    >
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        {t.name}
                      </span>
                      {selectedTemplate === t.id && (
                        <Check className="w-3 h-3 text-cyan-600" />
                      )}
                    </button>
                  ))}

                {customTemplates.length > 0 && (
                  <>
                    <div className="p-2 border-t border-b border-[var(--border-subtle)] mt-1">
                      <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        {copy.custom}
                      </span>
                    </div>
                    {customTemplates.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center hover:bg-[var(--info-soft)] transition-colors group"
                      >
                        <button
                          onClick={() => applyTemplate(t.id)}
                          className="flex-1 px-3 py-2 text-left flex items-center justify-between"
                        >
                          <span className="text-xs font-mono text-[var(--text-secondary)]">
                            {t.name}
                          </span>
                          {selectedTemplate === t.id && (
                            <Check className="w-3 h-3 text-cyan-600" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteTemplate(t.id)}
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

          {/* JSON format buttons */}
          {isJson && (
            <>
              <button
                onClick={formatJson}
                className="px-2 py-1 text-xs font-mono text-[var(--text-muted)] hover:text-cyan-600 hover:bg-[var(--info-soft)] rounded transition-all"
              >
                {copy.format}
              </button>
              <button
                onClick={minifyJson}
                className="px-2 py-1 text-xs font-mono text-[var(--text-muted)] hover:text-cyan-600 hover:bg-[var(--info-soft)] rounded transition-all"
              >
                {copy.minify}
              </button>
            </>
          )}

          {/* Save as template */}
          <button
            onClick={() => setShowSaveDialog(!showSaveDialog)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-text)] hover:bg-[var(--accent-soft)] rounded-lg transition-all"
            aria-label={copy.saveAsTemplate}
            title={copy.saveAsTemplate}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save template dialog */}
      {showSaveDialog && (
        <div className="flex flex-wrap items-center gap-2 border-b border-emerald-100 bg-[var(--accent-soft)] px-4 py-3">
          <input
            type="text"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder={copy.templateName}
            className="min-w-40 flex-1 rounded-lg border border-emerald-200 bg-[var(--surface-primary)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            onKeyDown={(e) => e.key === "Enter" && handleSaveTemplate()}
          />
          <button
            onClick={handleSaveTemplate}
            disabled={!newTemplateName.trim()}
            className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {copy.save}
          </button>
          <button
            onClick={() => setShowSaveDialog(false)}
            className="px-3 py-1.5 bg-zinc-200 text-[var(--text-secondary)] text-xs font-bold rounded-lg hover:bg-zinc-300"
          >
            {copy.cancel}
          </button>
        </div>
      )}

      {/* Template variables */}
      {currentVars.length > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            {copy.variables}:
          </span>
          {currentVars.map((v) => (
            <div key={v} className="flex items-center gap-1">
              <span className="text-xs font-mono text-blue-500">{`{{${v}}}`}</span>
              <input
                type="text"
                value={templateVars[v] || ""}
                onChange={(e) => updateTemplateVar(v, e.target.value)}
                placeholder={v}
                className="w-24 px-2 py-1 text-xs font-mono bg-[var(--surface-primary)] border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => handleMessageChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={copy.placeholder}
          rows={5}
          className={`w-full p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none ${
            jsonError ? "bg-[var(--danger-soft)]" : "bg-[var(--surface-primary)]"
          }`}
          spellCheck={false}
        />

        {/* JSON indicator */}
        {isJson && (
          <div
            className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
              jsonError
                ? "bg-[var(--danger-soft)] text-[var(--danger-text)]"
                : "bg-[var(--accent-soft)] text-[var(--accent-text)]"
            }`}
          >
            {jsonError ? (
              <AlertCircle className="w-3 h-3" />
            ) : (
              <Braces className="w-3 h-3" />
            )}
            {jsonError ? copy.invalid : "JSON"}
          </div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={status !== "connected" || !message.trim()}
          className="absolute bottom-4 right-4 bg-cyan-600 text-white pl-4 pr-5 py-2 rounded-xl hover:bg-cyan-700 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 font-bold shadow-lg shadow-cyan-500/20"
        >
          <Send className="w-4 h-4" />
          {copy.send}
        </button>
      </div>

      {/* JSON error message */}
      {jsonError && (
        <div className="px-4 py-2 bg-[var(--danger-soft)] border-t border-red-100 text-xs font-mono text-[var(--danger-text)]">
          {jsonError}
        </div>
      )}
    </div>
  );
}
