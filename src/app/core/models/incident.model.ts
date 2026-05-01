export interface Incident {
  id: string;
  reportedByName: string;
  title: string;
  description: string;
  location: string | null;
  severity: string;
  photoUrl: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  createdAt: string;
}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  location?: string | null;
  severity: string;
}
