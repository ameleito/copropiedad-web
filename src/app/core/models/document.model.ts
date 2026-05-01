export type DocCategory =
  | 'REGLAMENTO'
  | 'ACTA'
  | 'PRESUPUESTO'
  | 'CONTRATO'
  | 'CIRCULAR'
  | 'INFORME'
  | 'OTRO';

export interface DocItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  url: string | null;
  fileSizeKb: number | null;
  uploadedByName: string;
  isPublic: boolean;
  createdAt: string;
}

export interface CreateDocumentRequest {
  title: string;
  description?: string | null;
  category: string;
  url?: string | null;
  isPublic: boolean;
}

export const DOC_CATEGORY_LABELS: Record<DocCategory, string> = {
  REGLAMENTO: 'Reglamento',
  ACTA: 'Acta',
  PRESUPUESTO: 'Presupuesto',
  CONTRATO: 'Contrato',
  CIRCULAR: 'Circular',
  INFORME: 'Informe',
  OTRO: 'Otro',
};
