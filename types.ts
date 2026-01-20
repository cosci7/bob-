
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
