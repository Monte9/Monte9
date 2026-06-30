"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  TOPICS,
  ALL_TYPE_KEYS,
} from "@/features/learn/client/learn-client";
import {
  TOPICS_KEY,
  CARD_TYPES_KEY,
  readJSON,
  writeJSON,
} from "@/features/learn/client/storage";

// The user's persistent generation preferences: which topics and card types a
// new set should draw from. Backed by localStorage; refs mirror the latest
// value so load() (in useLearnSession) reads them synchronously.
export function useLearnPrefs() {
  const [topics, setTopics] = useState<string[]>(TOPICS);
  const topicsRef = useRef<string[]>(TOPICS);
  const [cardTypes, setCardTypes] = useState<string[]>(ALL_TYPE_KEYS);
  const cardTypesRef = useRef<string[]>(ALL_TYPE_KEYS);

  useEffect(() => {
    const savedTopics = readJSON<string[]>(TOPICS_KEY, TOPICS);
    if (Array.isArray(savedTopics) && savedTopics.length) {
      setTopics(savedTopics);
      topicsRef.current = savedTopics;
    }
    const savedTypes = readJSON<string[]>(CARD_TYPES_KEY, ALL_TYPE_KEYS);
    if (Array.isArray(savedTypes) && savedTypes.length) {
      const valid = savedTypes.filter((t) => ALL_TYPE_KEYS.includes(t));
      const next = valid.length ? valid : ALL_TYPE_KEYS;
      setCardTypes(next);
      cardTypesRef.current = next;
    }
  }, []);

  const toggleTopic = useCallback((t: string) => {
    setTopics((cur) => {
      const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
      topicsRef.current = next;
      writeJSON(TOPICS_KEY, next);
      return next;
    });
  }, []);

  const toggleType = useCallback((t: string) => {
    setCardTypes((cur) => {
      const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
      cardTypesRef.current = next;
      writeJSON(CARD_TYPES_KEY, next);
      return next;
    });
  }, []);

  return { topics, cardTypes, topicsRef, cardTypesRef, toggleTopic, toggleType };
}
