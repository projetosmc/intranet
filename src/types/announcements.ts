export type TemplateType = 'simple' | 'banner' | 'poll';
export type PollType = 'single' | 'multiple';
export type PopupMode = 'imediato' | 'proximo_login';

export interface PollOption {
  id: string;
  optionText: string;
  voteCount: number;
  userVoted?: boolean;
}

export interface AnnouncementAuthor {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface AnnouncementComment {
  id: string;
  announcementId: string;
  userId: string;
  parentId?: string;
  content: string;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
  author: AnnouncementAuthor;
  replies?: AnnouncementComment[];
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
  author?: AnnouncementAuthor;
  startDate?: string;
  endDate?: string;
  viewsCount?: number;
  commentsCount?: number;
  allowComments?: boolean;
  isUrgent?: boolean;
  isPopup?: boolean;
  popupMode?: PopupMode;
}