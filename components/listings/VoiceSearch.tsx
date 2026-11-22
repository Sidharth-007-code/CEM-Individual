"use client";

import React, { useState } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="p-2 rounded-xl transition-all"
        onClick={startListening}
        disabled={isListening}
        aria-label={isListening ? "Listening..." : "Search with voice"}
        leftIcon={isListening ? <MicOff className="w-4 h-4 stroke-[2.5]" /> : <Mic className="w-4 h-4 stroke-[2.5]" />}
        isLoading={isListening}
      />

      {unsupportedMsg && (
        <div className="absolute top-11 right-0 z-50 w-60 p-2.5 bg-modern-surface border border-modern-border rounded-xl shadow-modern-lg text-xs font-mono font-medium text-modern-text-primary flex items-start space-x-1.5 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-3.5 h-3.5 text-modern-danger flex-shrink-0 mt-0.5 stroke-[2.5]" aria-hidden="true" />
          <span>{unsupportedMsg}</span>
        </div>
      )}
    </div>
  );
}