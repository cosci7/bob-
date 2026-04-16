
// Offline AI Engine - Rule-based Italian assistant for when there's no network
// Provides basic JARVIS-like responses without requiring the Gemini API

interface OfflineCommand {
  patterns: RegExp[];
  handler: (match: RegExpMatchArray, args: { files: number; notes: number }) => OfflineResponse;
}

interface OfflineResponse {
  text: string;
  action?: {
    type: 'create_note' | 'create_file' | 'open_app' | 'system_info';
    payload: Record<string, string>;
  };
}

const commands: OfflineCommand[] = [
  {
    patterns: [
      /crea\s+(?:una\s+)?nota\s*(?:con\s+(?:scritto|testo|contenuto))?\s*[:\-]?\s*(.+)/i,
      /(?:scrivi|salva|annota)\s*[:\-]?\s*(.+)/i,
      /nota\s*[:\-]\s*(.+)/i,
    ],
    handler: (match) => ({
      text: `Nota creata in modalità offline: "${match[1].substring(0, 50)}..."`,
      action: { type: 'create_note', payload: { content: match[1] } },
    }),
  },
  {
    patterns: [
      /crea\s+(?:un\s+)?file\s+(?:chiamato\s+)?(\S+)\s+(?:con\s+(?:contenuto|testo)\s*)?[:\-]?\s*(.+)/i,
      /(?:genera|scrivi)\s+(?:un\s+)?file\s+(\S+)\s*[:\-]?\s*(.+)/i,
    ],
    handler: (match) => ({
      text: `File "${match[1]}" creato in modalità offline.`,
      action: { type: 'create_file', payload: { name: match[1], content: match[2] } },
    }),
  },
  {
    patterns: [
      /apri\s+(.+)/i,
      /lancia\s+(.+)/i,
      /avvia\s+(.+)/i,
    ],
    handler: (match) => ({
      text: `Simulazione apertura di "${match[1]}" in modalità offline.`,
      action: { type: 'open_app', payload: { app_name: match[1].trim() } },
    }),
  },
  {
    patterns: [
      /(?:info|informazioni|stato)\s+(?:del\s+)?sistema/i,
      /come\s+(?:sta|va)\s+il\s+sistema/i,
      /system\s+info/i,
    ],
    handler: (_match, args) => ({
      text: `📊 Report Sistema (Offline):\n• Stato: Operativo\n• File archiviati: ${args.files}\n• Note salvate: ${args.notes}\n• Modalità: Offline - Dati locali\n• Disco: Healthy`,
      action: { type: 'system_info', payload: {} },
    }),
  },
  {
    patterns: [
      /(?:ciao|hey|salve|buon(?:giorno|asera|anotte))/i,
    ],
    handler: () => ({
      text: 'Ciao! Sono JARVIS in modalità offline. Posso creare note, file, e gestire il sistema localmente. Per risposte AI avanzate, connettiti a internet.',
    }),
  },
  {
    patterns: [
      /(?:che\s+)?(?:ora|ore)\s+(?:è|sono)/i,
      /(?:che\s+)?giorno\s+è/i,
      /(?:data|orario)\s+(?:corrente|attuale|di\s+oggi)/i,
    ],
    handler: () => ({
      text: `🕐 Data e ora corrente: ${new Date().toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'medium' })}`,
    }),
  },
  {
    patterns: [
      /(?:cosa|che\s+cosa)\s+(?:puoi|sai)\s+fare/i,
      /(?:aiuto|help|comandi)/i,
      /(?:funzionalità|capacità)/i,
    ],
    handler: () => ({
      text: `🤖 JARVIS Offline - Comandi disponibili:\n\n📝 "Crea nota: [testo]" - Crea una nota\n📁 "Crea file [nome] [contenuto]" - Crea un file\n🚀 "Apri [app]" - Simula apertura app\n📊 "Info sistema" - Stato del sistema\n🕐 "Che ore sono" - Data e ora\n🧮 "Calcola [espressione]" - Calcolatrice\n\n💡 Per risposte AI avanzate, connettiti a internet.`,
    }),
  },
  {
    patterns: [
      /calcola\s+(.+)/i,
      /quanto\s+(?:fa|è)\s+(.+)/i,
    ],
    handler: (match) => {
      try {
        const expr = match[1]
          .replace(/[xX×]/g, '*')
          .replace(/[÷]/g, '/')
          .replace(/[^0-9+\-*/().%\s]/g, '');
        if (!expr.trim()) {
          return { text: 'Espressione non valida. Usa numeri e operatori (+, -, *, /).' };
        }
        // Simple and safe math evaluation using Function constructor with no access to scope
        const result = new Function(`"use strict"; return (${expr})`)();
        if (typeof result !== 'number' || !isFinite(result)) {
          return { text: 'Risultato non valido. Controlla l\'espressione.' };
        }
        return { text: `🧮 ${match[1].trim()} = **${result}**` };
      } catch {
        return { text: 'Non riesco a calcolare questa espressione. Prova con numeri e operatori semplici.' };
      }
    },
  },
  {
    patterns: [
      /(?:grazie|thanks|thank you)/i,
    ],
    handler: () => ({
      text: 'Prego! Sono qui per aiutarti. 🤝',
    }),
  },
];

export function getOfflineResponse(input: string, context: { files: number; notes: number }): OfflineResponse {
  const trimmed = input.trim();

  for (const cmd of commands) {
    for (const pattern of cmd.patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return cmd.handler(match, context);
      }
    }
  }

  return {
    text: `⚡ Modalità Offline — Non ho una risposta specifica per "${trimmed.substring(0, 40)}${trimmed.length > 40 ? '...' : ''}".

Comandi disponibili offline:
• "Crea nota: [testo]"
• "Crea file [nome] [contenuto]"
• "Apri [app]"
• "Info sistema"
• "Calcola [espressione]"
• "Che ore sono"

Per risposte AI avanzate, connettiti a internet.`,
  };
}
