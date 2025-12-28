export type ToolStatus = 'PRODUCAO' | 'PILOTO' | 'CONSTRUCAO';
export type TemplateType = 'simple' | 'banner' | 'poll';
export type PollType = 'single' | 'multiple';

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
  templateType: TemplateType;
  imageUrl?: string;
  pollType?: PollType;
  pollOptions?: PollOption[];
}

export interface PollOption {
  id: string;
  optionText: string;
  voteCount?: number;
  userVoted?: boolean;
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
