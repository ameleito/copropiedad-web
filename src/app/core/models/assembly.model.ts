export interface AssemblyItem {
  id: string;
  title: string;
  type: string;
  location: string | null;
  virtualLink: string | null;
  status: string;
  createdByName: string;
  quorumRequired: number;
  quorumAchieved: number | null;
  scheduledAt: string;
  createdAt: string;
  attendeeCount: number;
  agendaItemCount: number;
  totalUnits: number;
}

export interface AgendaItemModel {
  id: string;
  title: string;
  description: string | null;
  orderNum: number;
  requiresVote: boolean;
  voteOptions: string[] | null;
  voteDurationSeconds: number | null;
  voteStartedAt: string | null;
  voteClosed: boolean;
  proposedByName: string | null;
}

export interface VoteModel {
  id: string;
  agendaItemId: string;
  voterName: string;
  unitNumber: string;
  option: string;
  coefficient: number | null;
  votedAt: string;
}

export interface CreateAssemblyRequest {
  title: string;
  type: string;
  scheduledAt: string;
  location?: string | null;
  virtualLink?: string | null;
  quorumRequired: number;
}

export interface AddAgendaItemRequest {
  title: string;
  description?: string | null;
  requiresVote: boolean;
  voteOptions?: string[];
  voteDurationSeconds?: number | null;
}
