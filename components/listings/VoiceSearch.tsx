"use client";

import React, { useState } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";

interface VoiceSearchProps {
  onTranscript: (text: string) => void;
}

export function VoiceSearch({ onTranscript }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [unsupportedMsg, setUnsupportedMsg] = useState<string | null>(null);

  const startListening = () => {
    setUnsupportedMsg(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setUnsupportedMsg("Voice search is supported on Chrome & Edge browsers.");
      setTimeout(() => setUnsupportedMsg(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("[Voice search warning]:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.warn("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={startListening}
        className={`p-2 rounded-full transition-all ${
          isListening
            ? "bg-saffron-500 text-white animate-pulse shadow-md"
            : "text-ink-500 hover:text-ink-900 hover:bg-paper-200"
        }`}
        title={isListening ? "Listening..." : "Search with voice"}
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      {unsupportedMsg && (
        <div className="absolute top-10 right-0 z-50 w-60 p-2 bg-paper-100 border border-ink-300 rounded-notice shadow-float text-[11px] text-ink-700 flex items-start space-x-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-saffron-600 flex-shrink-0 mt-0.5" />
          <span>{unsupportedMsg}</span>
        </div>
      )}
    </div>
  );
}

