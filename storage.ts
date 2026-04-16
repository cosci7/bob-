
import { Note, FileAsset, SystemLog } from './types';

const STORAGE_KEYS = {
  notes: 'jarvis_notes',
  files: 'jarvis_files',
  logs: 'jarvis_logs',
  chatHistory: 'jarvis_chat_history',
} as const;

export function saveNotes(notes: Note[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
  } catch { /* storage full or unavailable */ }
}

export function loadNotes(): Note[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.notes);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveFiles(files: FileAsset[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.files, JSON.stringify(files));
  } catch { /* storage full or unavailable */ }
}

export function loadFiles(): FileAsset[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.files);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveLogs(logs: SystemLog[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
  } catch { /* storage full or unavailable */ }
}

export function loadLogs(): SystemLog[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.logs);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveChatHistory(messages: unknown[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.chatHistory, JSON.stringify(messages));
  } catch { /* storage full or unavailable */ }
}

export function loadChatHistory<T>(): T[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.chatHistory);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}
