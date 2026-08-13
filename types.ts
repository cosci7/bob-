
export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'action' | 'info' | 'error';
  message: string;
}

export interface Note {
  id: string;
  content: string;
  timestamp: string;
}

export interface FileAsset {
  id: string;
  name: string;
  content: string;
  type: string;
  timestamp: string;
  size: number;
}

export interface SystemState {
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  uptime: string;
  activeWindow: string;
  notifications: number;
}

export type BrainActionType =
  | 'create_note'
  | 'create_file'
  | 'download_file'
  | 'open_application'
  | 'get_system_info'
  | 'none';

export interface BrainDecision {
  id: string;
  intent: string;
  allowed: boolean;
  blocked: boolean;
  response: string;
  action?: {
    type: BrainActionType;
    payload: Record<string, unknown>;
  };
}

export interface BrainSnapshot {
  shortTermCount: number;
  longTermMemories: number;
  blockedActions: number;
  learningScore: number;
  dominantIntent: string;
}

export interface BrainCommandResult {
  decisionId: string;
  response: string;
  blocked: boolean;
  canGiveFeedback: boolean;
}
