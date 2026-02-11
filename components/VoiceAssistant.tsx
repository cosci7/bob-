
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { SystemState, FileAsset } from '../types';

// Helper functions for audio encoding/decoding
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface VoiceAssistantProps {
  addLog: (msg: string, type?: 'action' | 'info' | 'error') => void;
  addNote: (content: string) => void;
  addFile: (name: string, content: string) => void;
  setSystemState: React.Dispatch<React.SetStateAction<SystemState>>;
  files: FileAsset[];
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ addLog, addNote, addFile, setSystemState, files }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(32).fill(0));

  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Download logic for function call
  const triggerDownload = (fileName: string) => {
    const file = files.find(f => f.name.toLowerCase() === fileName.toLowerCase());
    if (file) {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addLog(`Scarico file: ${file.name}`, 'action');
      return "Successo: Download avviato.";
    }
    addLog(`Download fallito: File ${fileName} non trovato.`, 'error');
    return "Errore: File non trovato.";
  };

  // Function Declarations for Gemini
  const controlFunctions: FunctionDeclaration[] = [
    {
      name: 'create_note',
      description: 'Crea una nota testuale nel sistema.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          content: { type: Type.STRING, description: 'Il contenuto della nota.' },
        },
        required: ['content'],
      },
    },
    {
      name: 'create_file',
      description: 'Genera un nuovo file fisico nel sistema.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Nome del file con estensione (es. report.txt).' },
          content: { type: Type.STRING, description: 'Contenuto testuale del file.' },
        },
        required: ['name', 'content'],
      },
    },
    {
      name: 'download_file',
      description: 'Scarica un file esistente sul computer dell utente.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: 'Il nome del file da scaricare.' },
        },
        required: ['name'],
      },
    },
    {
      name: 'open_application',
      description: 'Simula l apertura di un app.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          app_name: { type: Type.STRING, description: 'Nome dell app.' },
        },
        required: ['app_name'],
      },
    },
    {
      name: 'get_system_info',
      description: 'Recupera informazioni di sistema.',
      parameters: { type: Type.OBJECT, properties: {} },
    }
  ];

  const startSession = async () => {
    try {
      setIsConnecting(true);
      addLog('Neural Link establishing...', 'info');

      const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
      if (!apiKey) {
        addLog('API key non configurata. Imposta VITE_GEMINI_API_KEY.', 'error');
        setIsConnecting(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: `Sei J.A.R.V.I.S., l'assistente personale dell'utente in stile Iron Man.
          Rispondi in italiano con tono professionale e conciso.
          Hai permessi per creare file, note e gestire il download degli asset: conferma sempre quando agisci.`,
          tools: [{ functionDeclarations: controlFunctions }],
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            addLog('JARVIS Live Status: OPERATIONAL', 'info');

            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const avg = inputData.reduce((a, b) => a + Math.abs(b), 0) / inputData.length;
              const newData = new Array(32).fill(0).map(() => Math.min(100, avg * 1000 + Math.random() * 20));
              setVisualizerData(newData);

              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.outputTranscription) {
              setTranscription(prev => (prev + ' ' + message.serverContent?.outputTranscription?.text).slice(-100));
            }
            if (message.serverContent?.turnComplete) {
              setTranscription('');
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                let result: any = "ok";
                addLog(`KERNEL_EXEC: ${fc.name}`, 'action');
                
                if (fc.name === 'create_note') {
                  addNote(fc.args.content as string);
                } else if (fc.name === 'create_file') {
                  addFile(fc.args.name as string, fc.args.content as string);
                } else if (fc.name === 'download_file') {
                  result = triggerDownload(fc.args.name as string);
                } else if (fc.name === 'open_application') {
                  setSystemState(prev => ({ ...prev, activeWindow: fc.args.app_name as string }));
                } else if (fc.name === 'get_system_info') {
                   result = { status: "optimized", disk: "Healthy", files_count: files.length };
                }

                sessionPromise.then(session => {
                  session.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result } }
                  });
                });
              }
            }
          },
          onerror: (e) => {
            console.error(e);
            stopSession();
          },
          onclose: () => setIsActive(false),
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
      addLog('Failed to bind to neural kernel.', 'error');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    setIsActive(false);
    setVisualizerData(new Array(32).fill(0));
    addLog('JARVIS Offline.', 'info');
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex-1 bg-slate-950/80 rounded-xl border border-slate-800 p-4 flex flex-col items-center justify-center relative overflow-hidden">
        {isActive ? (
          <div className="flex items-end justify-center space-x-1 h-32 w-full">
            {visualizerData.map((v, i) => (
              <div 
                key={i} 
                className="w-1 bg-sky-500 rounded-full transition-all duration-75"
                style={{ height: `${v}%`, opacity: 0.3 + (v/150) }}
              ></div>
            ))}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-2 border-slate-800 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <svg className="w-8 h-8 text-slate-700" fill="currentColor" viewBox="0 0 20 20"><path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" /></svg>
            </div>
            <p className="text-slate-600 text-xs font-mono">Neural Interface Standby</p>
          </div>
        )}
        
        {transcription && (
          <div className="absolute bottom-4 left-4 right-4 bg-sky-900/20 backdrop-blur-md p-3 rounded border border-sky-500/20">
            <p className="text-[10px] text-sky-300 font-mono line-clamp-2">TRANSCRIBING: {transcription}</p>
          </div>
        )}
      </div>

      <button
        onClick={isActive ? stopSession : startSession}
        disabled={isConnecting}
        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg ${
          isActive 
            ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' 
            : 'bg-sky-500 text-white hover:bg-sky-400'
        } ${isConnecting ? 'opacity-50 cursor-wait' : ''}`}
      >
        {isConnecting ? 'ESTABLISHING LINK...' : isActive ? 'TERMINATE SESSION' : 'INITIALIZE JARVIS'}
      </button>

      <div className="grid grid-cols-2 gap-4">
        <button className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center justify-center hover:bg-slate-800 transition-colors uppercase tracking-widest font-mono">
          Sensors
        </button>
        <button className="p-3 bg-slate-900/50 rounded-lg border border-slate-800 text-[10px] text-slate-400 flex items-center justify-center hover:bg-slate-800 transition-colors uppercase tracking-widest font-mono">
          Logs
        </button>
      </div>
    </div>
  );
};

export default VoiceAssistant;
