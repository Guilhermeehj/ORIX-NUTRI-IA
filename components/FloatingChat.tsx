
import React, { useState, useRef } from 'react';
import { HistoryItem } from '../types';

interface FloatingChatProps {
  history: HistoryItem[];
  onSendMessage: (text: string, shouldSpeak: boolean) => Promise<void>;
  isProcessing: boolean;
  isPlayingAudio: boolean;
}

const MicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
      <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
      <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
    </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const VoiceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
    <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
    <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
  </svg>
);

export const FloatingChat: React.FC<FloatingChatProps> = ({ onSendMessage, isProcessing, isPlayingAudio }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // High quality avatar for ORIX
  const AVATAR_URL = "https://ui-avatars.com/api/?name=Orix&background=020617&color=38bdf8&size=256&bold=true&length=1&rounded=true";

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = 'pt-BR';
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          // Send message directly to AI (Visuals hidden, voice response requested)
          onSendMessage(transcript, true);
        };

        recognitionRef.current.onerror = (event: any) => {
            console.error("Speech Error:", event.error);
            setIsListening(false);
        };
      }
      
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Already started", e);
      }
      
    } else {
        alert("Navegador não suporta voz.");
    }
  };

  const getStatusText = () => {
      if (isListening) return "Ouvindo...";
      if (isProcessing) return "Processando...";
      if (isPlayingAudio) return "Falando...";
      return "Sistema ORIX Ativo";
  };

  const getStatusColor = () => {
      if (isListening) return "text-orix-cyan drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]";
      if (isProcessing) return "text-white animate-pulse";
      if (isPlayingAudio) return "text-orix-blue drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]";
      return "text-orix-silver";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 no-print font-sans">
      
      {/* Voice Interface Panel */}
      {isOpen && (
        <div className="w-[320px] h-[450px] bg-orix-card/90 backdrop-blur-xl rounded-[2.5rem] shadow-neon-blue flex flex-col items-center justify-between border border-orix-blue/30 animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden relative">
            
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orix-blue/10 rounded-full blur-3xl transition-opacity duration-500 ${isListening || isPlayingAudio ? 'opacity-100' : 'opacity-20'}`}></div>
            </div>

            {/* Header */}
            <div className="w-full flex justify-end p-6 z-10">
                 <button onClick={() => setIsOpen(false)} className="text-orix-silver hover:text-white transition-colors bg-white/5 rounded-full p-1 hover:bg-white/10">
                    <CloseIcon />
                 </button>
            </div>

            {/* Main Avatar Area */}
            <div className="flex-grow flex flex-col items-center justify-center relative z-10 w-full">
                
                {/* Status Indicator */}
                <div className={`mb-8 font-mono font-bold tracking-[0.2em] uppercase text-sm transition-all duration-300 ${getStatusColor()}`}>
                    {getStatusText()}
                </div>

                {/* Avatar & Visualizer */}
                <div className="relative">
                    {/* Ring Animations */}
                    {isListening && (
                         <div className="absolute inset-0 rounded-full border border-orix-cyan animate-ripple"></div>
                    )}
                    {isPlayingAudio && (
                         <div className="absolute inset-0 rounded-full bg-orix-blue/30 animate-breathe blur-md"></div>
                    )}
                    {isProcessing && (
                        <div className="absolute -inset-4 rounded-full border-t-2 border-r-2 border-orix-silver animate-spin"></div>
                    )}

                    {/* The Avatar */}
                    <div className={`relative w-32 h-32 rounded-full overflow-hidden border-2 border-orix-blue shadow-neon-blue transition-transform duration-500 ${isPlayingAudio ? 'scale-110' : 'scale-100'}`}>
                         <img src={AVATAR_URL} alt="ORIX AI" className="w-full h-full object-cover" />
                         {/* Gloss effect */}
                         <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
                    </div>
                </div>

            </div>

            {/* Controls */}
            <div className="w-full p-8 pb-10 flex justify-center z-10">
                <button 
                    onClick={startListening}
                    disabled={isProcessing || isPlayingAudio}
                    className={`
                        w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
                        ${isListening 
                            ? 'bg-red-500/20 text-red-400 border border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] scale-110' 
                            : 'bg-orix-blue text-white hover:bg-white hover:text-orix-blue shadow-neon-blue hover:scale-105'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                >
                    {isListening ? (
                         <div className="w-3 h-3 bg-red-500 rounded-sm animate-pulse"></div>
                    ) : (
                         <MicIcon />
                    )}
                </button>
            </div>

            {/* Footer Text */}
            <div className="absolute bottom-4 text-[10px] text-orix-silver/40 font-mono tracking-widest">
                ORIX VOICE LINK
            </div>
        </div>
      )}

      {/* Floating Toggle Button (Closed State) */}
      {!isOpen && (
        <button 
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 rounded-full bg-orix-dark border border-orix-blue text-orix-cyan shadow-neon-blue hover:scale-110 hover:bg-orix-blue hover:text-white transition-all duration-300 flex items-center justify-center group relative overflow-hidden"
        >
            <div className="absolute inset-0 rounded-full bg-orix-cyan/20 animate-pulse"></div>
            <VoiceIcon />
        </button>
      )}
    </div>
  );
};
