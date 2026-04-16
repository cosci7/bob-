
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, Content } from '@google/genai';
import { ChatMessage, SystemState, FileAsset } from '../types';

interface ChatInterfaceProps {
  addLog: (msg: string, type?: 'action' | 'info' | 'error') => void;
  addNote: (content: string) => void;
  addFile: (name: string, content: string) => void;
  setSystemState: React.Dispatch<React.SetStateAction<SystemState>>;
  files: FileAsset[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ addLog, addNote, addFile, setSystemState, files }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'JARVIS online. Come posso assisterti oggi?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Content[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant' | 'system', content: string) => {
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      content,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const handleFunctionCall = (name: string, args: Record<string, unknown>): string => {
    if (name === 'create_note') {
      addNote(args.content as string);
      return 'Nota creata con successo.';
    }
    if (name === 'create_file') {
      addFile(args.name as string, args.content as string);
      return `File "${args.name}" creato con successo.`;
    }
    if (name === 'open_application') {
      setSystemState(prev => ({ ...prev, activeWindow: args.app_name as string }));
      return `Applicazione "${args.app_name}" aperta.`;
    }
    if (name === 'get_system_info') {
      return JSON.stringify({ status: 'optimized', disk: 'Healthy', files_count: files.length });
    }
    return 'Funzione non riconosciuta.';
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput('');
    addMessage('user', text);
    addLog(`User: ${text.substring(0, 40)}...`, 'info');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      historyRef.current.push({ role: 'user', parts: [{ text }] });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: historyRef.current,
        config: {
          systemInstruction: `Sei JARVIS, un'intelligenza artificiale avanzata integrata nel sistema operativo dell'utente.
Parla in Italiano. Hai permessi per creare file, note e gestire il sistema.
Sii sintetico, efficiente e tecnico. Usa un tono professionale ma amichevole.
Se l'utente chiede di creare file o note, usa le funzioni apposite.
Puoi anche rispondere a domande generali, fare analisi, scrivere codice, e assistere l'utente in qualsiasi task.`,
          tools: [{
            functionDeclarations: [
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
                description: 'Genera un nuovo file nel sistema.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Nome del file con estensione.' },
                    content: { type: Type.STRING, description: 'Contenuto del file.' },
                  },
                  required: ['name', 'content'],
                },
              },
              {
                name: 'open_application',
                description: "Simula l'apertura di un'applicazione.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    app_name: { type: Type.STRING, description: "Nome dell'applicazione." },
                  },
                  required: ['app_name'],
                },
              },
              {
                name: 'get_system_info',
                description: 'Recupera informazioni di sistema.',
                parameters: { type: Type.OBJECT, properties: {} },
              },
            ],
          }],
        },
      });

      const candidate = response.candidates?.[0];
      if (!candidate) {
        addMessage('system', 'Nessuna risposta dal modello.');
        setIsLoading(false);
        return;
      }

      const parts = candidate.content?.parts || [];
      let assistantText = '';

      for (const part of parts) {
        if (part.functionCall) {
          const fc = part.functionCall;
          addLog(`KERNEL_EXEC: ${fc.name}`, 'action');
          const result = handleFunctionCall(fc.name!, fc.args as Record<string, unknown>);

          // Send function response back and get final text
          historyRef.current.push({
            role: 'model',
            parts: [{ functionCall: { name: fc.name!, args: fc.args as Record<string, unknown> } }],
          });
          historyRef.current.push({
            role: 'user',
            parts: [{ functionResponse: { name: fc.name!, response: { result } } }],
          });

          const followUp = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: historyRef.current,
            config: {
              systemInstruction: `Sei JARVIS. Parla in Italiano. Conferma brevemente l'azione eseguita.`,
            },
          });

          const followUpText = followUp.candidates?.[0]?.content?.parts
            ?.map(p => p.text)
            .filter(Boolean)
            .join('') || result;

          assistantText += followUpText;
          historyRef.current.push({ role: 'model', parts: [{ text: followUpText }] });
        } else if (part.text) {
          assistantText += part.text;
        }
      }

      if (assistantText) {
        addMessage('assistant', assistantText);
        if (!parts.some(p => p.functionCall)) {
          historyRef.current.push({ role: 'model', parts: [{ text: assistantText }] });
        }
        addLog(`JARVIS: ${assistantText.substring(0, 40)}...`, 'info');
      }
    } catch (err) {
      console.error(err);
      addMessage('system', 'Errore di comunicazione con il kernel AI.');
      addLog('Chat error: connessione fallita.', 'error');
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-sky-600/20 text-sky-100 border border-sky-500/30'
                  : msg.role === 'system'
                  ? 'bg-red-900/20 text-red-300 border border-red-500/30 text-xs font-mono'
                  : 'bg-slate-800/60 text-slate-200 border border-slate-700/50'
              }`}
            >
              {msg.role === 'assistant' && (
                <span className="text-[10px] text-sky-500 font-mono block mb-1">JARVIS</span>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <span className="text-[9px] text-slate-500 mt-1 block text-right font-mono">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
              <span className="text-[10px] text-sky-500 font-mono block mb-1">JARVIS</span>
              <div className="flex space-x-1.5">
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-end space-x-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Scrivi un messaggio..."
          className="flex-1 bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-600 resize-none focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 font-mono"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="p-3 bg-sky-500 text-white rounded-xl hover:bg-sky-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;
