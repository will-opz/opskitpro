"use client";

import { useRef, useMemo, forwardRef, useImperativeHandle } from "react";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidate: (value: string) => void;
  placeholder?: string;
  describedBy?: string;
}

export interface JsonEditorRef {
  focus: () => void;
}

export const JsonEditor = forwardRef<JsonEditorRef, JsonEditorProps>(
  function JsonEditor({ value, onChange, onValidate, placeholder, describedBy }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumberRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
    }));

    const lineCount = useMemo(
      () => (value ? value.split("\n").length : 1),
      [value],
    );

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      onValidate(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab" && !e.shiftKey && e.altKey) {
        e.preventDefault();
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const newValue =
          value.substring(0, start) + "  " + value.substring(end);
        onChange(newValue);
        onValidate(newValue);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
    };

    const handleScroll = () => {
      if (textareaRef.current && lineNumberRef.current) {
        lineNumberRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    };

    return (
      <div className="relative flex">
        <div
          ref={lineNumberRef}
          className="absolute inset-y-0 left-0 hidden w-12 overflow-hidden whitespace-pre border-r border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-2 py-4 text-right font-mono text-[13px] leading-relaxed text-[var(--text-faint)] select-none sm:block"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}
        </div>
        <textarea
          ref={textareaRef}
          aria-labelledby="json-input-title"
          aria-describedby={describedBy}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={placeholder}
          spellCheck={false}
          className="w-full min-h-[240px] sm:min-h-[320px] p-4 sm:pl-16 bg-transparent text-[var(--text-primary)] font-mono text-[13px] leading-relaxed focus:outline-none resize-y placeholder:text-[var(--text-faint)] selection:bg-[var(--accent-soft)]"
          style={{ tabSize: 2 }}
        />
      </div>
    );
  },
);
