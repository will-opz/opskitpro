"use client";

import { useState, useEffect, useCallback } from "react";

export interface JsonDraft {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "opskitpro_json_drafts";
const MAX_DRAFTS = 10;

export function useJsonStorage() {
  const [drafts, setDrafts] = useState<JsonDraft[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load drafts from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadDrafts = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setDrafts(JSON.parse(stored));
        }
      } catch (err) {
        console.error("Failed to load drafts:", err);
      }
      setIsLoaded(true);
    };
    loadDrafts();
  }, []);

  // Save drafts to localStorage
  const saveDrafts = useCallback((newDrafts: JsonDraft[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDrafts));
      setDrafts(newDrafts);
    } catch (err) {
      console.error("Failed to save drafts:", err);
    }
  }, []);

  const saveDraft = useCallback(
    (name: string, content: string): JsonDraft => {
      const now = Date.now();
      const newDraft: JsonDraft = {
        id: String(now),
        name: name || `Draft ${new Date(now).toLocaleString()}`,
        content,
        createdAt: now,
        updatedAt: now,
      };

      // Remove oldest if at limit
      const updated = [newDraft, ...drafts.slice(0, MAX_DRAFTS - 1)];
      saveDrafts(updated);
      return newDraft;
    },
    [drafts, saveDrafts],
  );

  const updateDraft = useCallback(
    (id: string, content: string) => {
      const updated = drafts.map((d) =>
        d.id === id ? { ...d, content, updatedAt: Date.now() } : d,
      );
      saveDrafts(updated);
    },
    [drafts, saveDrafts],
  );

  const deleteDraft = useCallback(
    (id: string) => {
      const updated = drafts.filter((d) => d.id !== id);
      saveDrafts(updated);
    },
    [drafts, saveDrafts],
  );

  const renameDraft = useCallback(
    (id: string, name: string) => {
      const updated = drafts.map((d) => (d.id === id ? { ...d, name } : d));
      saveDrafts(updated);
    },
    [drafts, saveDrafts],
  );

  return {
    drafts,
    isLoaded,
    saveDraft,
    updateDraft,
    deleteDraft,
    renameDraft,
  };
}
