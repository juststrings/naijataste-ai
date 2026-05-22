"use client";

import { useState, useRef, useEffect } from "react";

export function useVoiceInput(onResult: (transcript: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [interim, setInterim] = useState("");
  const callbackRef = useRef(onResult);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recRef = useRef<any>(null);
  callbackRef.current = onResult;

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  function startListening() {
    if (isListening) {
      recRef.current?.stop();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new Ctor();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-NG";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript as string;
        if (e.results[i].isFinal) {
          finalText += t;
        } else {
          interimText += t;
        }
      }
      if (finalText) {
        setInterim("");
        callbackRef.current(finalText.trim());
      } else {
        setInterim(interimText);
      }
    };

    rec.onend = () => {
      setInterim("");
      setIsListening(false);
    };
    rec.onerror = () => {
      setInterim("");
      setIsListening(false);
    };

    recRef.current = rec;
    rec.start();
    setIsListening(true);
  }

  return { isListening, startListening, supported, interim };
}
