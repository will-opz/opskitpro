"use client";

import { useRef, useMemo, forwardRef, useImperativeHandle } from "react";

interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  onValidate: (value: string) => void;
  placeholder?: string;
}

export interface JsonEditorRef {
  focus: () => void;
}

export const JsonEditor = forwardRef<JsonEditorRef, JsonEditorProps>(
  function JsonEditor({ value, onChange, onValidate, placeholder }, ref) {
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
          className="hidden sm:flex flex-col items-end px-3 py-6 bg-[var(--surface-secondary)] border-r border-[var(--border-subtle)] text-xs font-mono text-[var(--text-faint)] select-none overflow-hidden leading-relaxed shrink-0 min-w-[3rem]"
          aria-hidden="true"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="leading-relaxed">
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          aria-labelledby="json-input-title"
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          placeholder={placeholder}
          spellCheck={false}
          className="w-full min-h-[240px] sm:min-h-[320px] p-4 bg-transparent text-[var(--text-primary)] font-mono text-[13px] leading-relaxed focus:outline-none resize-y placeholder:text-[var(--text-faint)] selection:bg-[var(--accent-soft)]"
          style={{ tabSize: 2 }}
        />
      </div>
    );
  },
);
