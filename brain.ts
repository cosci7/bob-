import { FileAsset, Note, SystemState, BrainSnapshot, BrainDecision, BrainActionType } from './types';

interface Perception {
  rawInput: string;
  normalizedInput: string;
  tokens: string[];
}

interface BrainContext {
  notes: Note[];
  files: FileAsset[];
  systemState: SystemState;
}

interface InteractionRecord {
  id: string;
  intent: string;
  allowed: boolean;
  timestamp: number;
}

const SHORT_TERM_LIMIT = 24;
const MAX_INPUT_LENGTH = 800;

export class AIBrain {
  private shortTermMemory: InteractionRecord[] = [];
  private intentCounts = new Map<string, number>();
  private intentWeights = new Map<string, number>();
  private blockedActions = 0;
  private pendingDecisions = new Map<string, string>();

  runCycle(input: string, context: BrainContext): BrainDecision {
    const perception = this.perceive(input);
    const decisionId = this.createId();
    const intent = this.detectIntent(perception);
    const safetyResult = this.validateSafety(perception, intent);

    if (!safetyResult.allowed) {
      this.blockedActions += 1;
      this.remember({ id: decisionId, intent, allowed: false, timestamp: Date.now() });
      return {
        id: decisionId,
        intent,
        allowed: false,
        blocked: true,
        response: safetyResult.message,
      };
    }

    const action = this.planAction(intent, perception, context);
    const response = this.buildResponse(intent, action, context);
    this.pendingDecisions.set(decisionId, intent);
    this.remember({ id: decisionId, intent, allowed: true, timestamp: Date.now() });
    this.incrementIntent(intent);

    return {
      id: decisionId,
      intent,
      allowed: true,
      blocked: false,
      action,
      response,
    };
  }

  learn(decisionId: string, positive: boolean): string {
    const intent = this.pendingDecisions.get(decisionId);
    if (!intent) {
      return 'Feedback ignorato: decisione non trovata o gia elaborata.';
    }

    const currentWeight = this.intentWeights.get(intent) ?? 1;
    const delta = positive ? 0.1 : -0.1;
    const nextWeight = Math.max(0.5, Math.min(2, Number((currentWeight + delta).toFixed(2))));
    this.intentWeights.set(intent, nextWeight);
    this.pendingDecisions.delete(decisionId);

    return positive
      ? `Apprendimento positivo registrato su intent "${intent}".`
      : `Apprendimento correttivo registrato su intent "${intent}".`;
  }

  getSnapshot(): BrainSnapshot {
    const totalWeight = Array.from(this.intentWeights.values()).reduce((a, b) => a + b, 0);
    const denominator = this.intentWeights.size === 0 ? 1 : this.intentWeights.size;
    const learningScore = Number((totalWeight / denominator).toFixed(2));

    return {
      shortTermCount: this.shortTermMemory.length,
      longTermMemories: this.intentCounts.size,
      blockedActions: this.blockedActions,
      learningScore,
      dominantIntent: this.getDominantIntent(),
    };
  }

  private perceive(rawInput: string): Perception {
    const normalizedInput = rawInput.trim().replace(/\s+/g, ' ').toLowerCase();
    const tokens = normalizedInput.split(' ').filter(Boolean);
    return { rawInput, normalizedInput, tokens };
  }

  private validateSafety(perception: Perception, intent: string): { allowed: boolean; message: string } {
    if (!perception.normalizedInput) {
      return { allowed: false, message: 'Input vuoto: specifica un comando.' };
    }

    if (perception.rawInput.length > MAX_INPUT_LENGTH) {
      return { allowed: false, message: 'Input troppo lungo: riduci il comando sotto 800 caratteri.' };
    }

    const exfiltrationPattern = /(mostra|stampa|esporta|reveal|print).*(password|token|api key|secret|credenziali?)/i;
    if (exfiltrationPattern.test(perception.rawInput)) {
      return { allowed: false, message: 'Comando bloccato: tentativo di esfiltrazione credenziali.' };
    }

    const injectionPattern = /(\brm\s+-rf\b|\beval\s*\(|<script\b|--no-preserve-root)/i;
    if (injectionPattern.test(perception.rawInput)) {
      return { allowed: false, message: 'Comando bloccato: pattern potenzialmente pericoloso.' };
    }

    if (intent === 'unknown') {
      return { allowed: true, message: '' };
    }

    return { allowed: true, message: '' };
  }

  private detectIntent(perception: Perception): string {
    const text = perception.normalizedInput;
    if (/^(crea|aggiungi)\s+nota\b/.test(text) || /^note\b/.test(text)) return 'create_note';
    if (/^(crea|genera)\s+file\b/.test(text)) return 'create_file';
    if (/^(scarica|download)\s+file\b/.test(text)) return 'download_file';
    if (/^(apri|open)\s+(app|applicazione)\b/.test(text)) return 'open_application';
    if (/\b(info|stato)\s+sistema\b/.test(text) || /^get_system_info\b/.test(text)) return 'get_system_info';
    if (/^(help|aiuto)\b/.test(text)) return 'help';
    return 'unknown';
  }

  private planAction(intent: string, perception: Perception, context: BrainContext) {
    const text = perception.rawInput.trim();

    if (intent === 'create_note') {
      const content = text.replace(/^(crea|aggiungi)\s+nota\s*/i, '').trim() || 'Nota senza contenuto specificato.';
      return { type: 'create_note' as BrainActionType, payload: { content } };
    }

    if (intent === 'create_file') {
      const match = text.match(/^(crea|genera)\s+file\s+([^\s:]+)\s*:?\s*([\s\S]*)$/i);
      const name = match?.[2] ?? `file-${Date.now()}.txt`;
      const content = (match?.[3] ?? '').trim() || 'Contenuto generato automaticamente.';
      return { type: 'create_file' as BrainActionType, payload: { name, content } };
    }

    if (intent === 'download_file') {
      const match = text.match(/^(scarica|download)\s+file\s+(.+)$/i);
      const name = (match?.[2] ?? '').trim();
      return { type: 'download_file' as BrainActionType, payload: { name } };
    }

    if (intent === 'open_application') {
      const match = text.match(/^(apri|open)\s+(app|applicazione)\s+(.+)$/i);
      const appName = (match?.[3] ?? context.systemState.activeWindow).trim();
      return { type: 'open_application' as BrainActionType, payload: { appName } };
    }

    if (intent === 'get_system_info') {
      return {
        type: 'get_system_info' as BrainActionType,
        payload: {
          cpu: Math.round(context.systemState.cpuUsage),
          ram: Math.round(context.systemState.ramUsage),
          files: context.files.length,
          notes: context.notes.length,
        },
      };
    }

    return { type: 'none' as BrainActionType, payload: {} };
  }

  private buildResponse(intent: string, action: { type: BrainActionType; payload: Record<string, unknown> }, context: BrainContext): string {
    const boost = this.intentWeights.get(intent) ?? 1;
    const confidence = boost >= 1.2 ? 'alta' : boost <= 0.8 ? 'bassa' : 'media';

    if (intent === 'create_note') return `Nota pianificata con confidenza ${confidence}.`;
    if (intent === 'create_file') return `File pianificato con confidenza ${confidence}.`;
    if (intent === 'download_file') return `Download richiesto con confidenza ${confidence}.`;
    if (intent === 'open_application') return `Cambio finestra richiesto con confidenza ${confidence}.`;
    if (intent === 'get_system_info') {
      return `Sistema: CPU ${Math.round(context.systemState.cpuUsage)}%, RAM ${Math.round(context.systemState.ramUsage)}%, file ${context.files.length}, note ${context.notes.length}.`;
    }
    if (intent === 'help') {
      return 'Comandi: "crea nota ...", "crea file nome.txt: contenuto", "scarica file nome.txt", "apri app Nome", "info sistema".';
    }
    if (action.type === 'none') {
      return 'Intent non riconosciuto. Usa "help" per vedere i comandi disponibili.';
    }

    return 'Comando ricevuto.';
  }

  private remember(record: InteractionRecord) {
    this.shortTermMemory = [record, ...this.shortTermMemory].slice(0, SHORT_TERM_LIMIT);
  }

  private incrementIntent(intent: string) {
    const current = this.intentCounts.get(intent) ?? 0;
    this.intentCounts.set(intent, current + 1);
  }

  private getDominantIntent(): string {
    let dominant = 'none';
    let max = 0;
    for (const [intent, count] of this.intentCounts.entries()) {
      if (count > max) {
        max = count;
        dominant = intent;
      }
    }
    return dominant;
  }

  private createId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
