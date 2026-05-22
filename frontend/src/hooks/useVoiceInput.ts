"use client";

import { useState, useRef, useEffect } from "react";

export function useVoiceInput(onResult: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const callbackRef = useRef(onResult);
  callbackRef.current = onResult;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  function startListening() {
    if (isListening) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-NG";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      callbackRef.current(e.results[0][0].transcript as string);
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);

    rec.start();
    setIsListening(true);
  }

  return { isListening, startListening, supported };
}
