export type ToolStatus = 'PRODUCAO' | 'PILOTO' | 'CONSTRUCAO';

export interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  area: string;
  status: ToolStatus;
  tags: string[];
  owner: string;
  embed: boolean;
  active: boolean;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  summary: string;
  content: string;
  pinned: boolean;
  publishedAt: string;
  active: boolean;
}

export interface Favorite {
  toolId: string;
  favoritedAt: string;
}

export interface RecentAccess {
  toolId: string;
  lastAccess: string;
  count: number;
}
