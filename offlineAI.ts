
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

// Safe math expression evaluator - no eval/Function used
function evaluateMathExpression(input: string): number | null {
  const sanitized = input
    .replace(/[xX×]/g, '*')
    .replace(/[÷]/g, '/')
    .replace(/\s+/g, '');

  // Only allow digits, operators, parentheses, and decimal points
  if (!/^[0-9+\-*/().]+$/.test(sanitized) || !sanitized) return null;

  // Tokenize
  const tokens: (number | string)[] = [];
  let i = 0;
  while (i < sanitized.length) {
    if (/[0-9.]/.test(sanitized[i])) {
      let num = '';
      while (i < sanitized.length && /[0-9.]/.test(sanitized[i])) {
        num += sanitized[i++];
      }
      const parsed = parseFloat(num);
      if (isNaN(parsed)) return null;
      tokens.push(parsed);
    } else if ('+-*/()'.includes(sanitized[i])) {
      tokens.push(sanitized[i++]);
    } else {
      return null;
    }
  }

  // Recursive descent parser
  let pos = 0;

  function parseExpr(): number | null {
    let left = parseTerm();
    if (left === null) return null;
    while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
      const op = tokens[pos++] as string;
      const right = parseTerm();
      if (right === null) return null;
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseTerm(): number | null {
    let left = parseFactor();
    if (left === null) return null;
    while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
      const op = tokens[pos++] as string;
      const right = parseFactor();
      if (right === null) return null;
      if (op === '/' && right === 0) return null;
      left = op === '*' ? left * right : left / right;
    }
    return left;
  }

  function parseFactor(): number | null {
    if (pos >= tokens.length) return null;
    // Handle unary minus
    if (tokens[pos] === '-') {
      pos++;
      const val = parseFactor();
      return val === null ? null : -val;
    }
    if (tokens[pos] === '(') {
      pos++; // skip '('
      const val = parseExpr();
      if (val === null || tokens[pos] !== ')') return null;
      pos++; // skip ')'
      return val;
    }
    if (typeof tokens[pos] === 'number') {
      return tokens[pos++] as number;
    }
    return null;
  }

  const result = parseExpr();
  if (result === null || pos !== tokens.length || !isFinite(result)) return null;
  return Math.round(result * 1e10) / 1e10; // avoid floating point artifacts
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
        const result = evaluateMathExpression(match[1]);
        if (result === null) {
          return { text: 'Espressione non valida. Usa numeri e operatori (+, -, *, /).' };
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
