export type TemplateType = 'simple' | 'banner' | 'poll';
export type PollType = 'single' | 'multiple';

export interface PollOption {
  id: string;
  optionText: string;
  voteCount: number;
  userVoted?: boolean;
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