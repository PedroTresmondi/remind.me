"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/** Web Speech API event types (not always in TS lib). */
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

/** Minimal type for Web Speech API recognition instance (not on globalThis in all TS configs). */
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export interface UseSpeechToTextOptions {
  language?: string;
  continuous?: boolean;
  onResult?: (text: string) => void;
  onError?: (message: string) => void;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const {
    language = "pt-BR",
    continuous = true,
    onResult,
    onError,
  } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  const start = useCallback(() => {
    setError(null);
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setError("Reconhecimento de voz não suportado neste navegador.");
      onError?.("Reconhecimento de voz não suportado neste navegador.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionAPI() as SpeechRecognitionInstance;
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      transcriptRef.current = "";
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = (result[0]?.transcript ?? "").trim();
        if (!transcript || !result.isFinal) continue;
        const current = transcriptRef.current.trim();
        // Se o novo trecho contém o que já temos, substitui (evita "re" + "reunião" + "reunião amanhã")
        if (current && transcript.toLowerCase().includes(current.toLowerCase())) {
          transcriptRef.current = transcript;
        } else if (current && current.toLowerCase().includes(transcript.toLowerCase())) {
          // Novo trecho já está contido no anterior, ignora
          continue;
        } else {
          transcriptRef.current = current ? current + " " + transcript : transcript;
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      const finalText = transcriptRef.current.trim();
      if (finalText && onResult) {
        onResult(finalText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error === "not-allowed") {
        const msg = "Microfone bloqueado. Permita o acesso ao microfone.";
        setError(msg);
        onError?.(msg);
      } else if (event.error !== "aborted") {
        const msg = event.error === "no-speech"
          ? "Nenhuma fala detectada. Tente novamente."
          : `Erro: ${event.error}`;
        setError(msg);
        onError?.(msg);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      setError("Não foi possível iniciar o microfone.");
      onError?.("Não foi possível iniciar o microfone.");
      setIsListening(false);
    }
  }, [language, continuous, onResult, onError]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  return { isSupported, isListening, start, stop, error };
}
