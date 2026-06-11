export const ENTITY_TYPE_COLORS: Record<string, string> = {
  PERSON: '#3B82F6',
  ORGANIZATION: '#10B981',
  PRODUCT: '#8B5CF6',
  SERVICE: '#F59E0B',
  PROCESS: '#F97316',
  DEPARTMENT: '#06B6D4',
  ROLE: '#6366F1',
  LOCATION: '#EC4899',
  DOCUMENT: '#64748B',
  REGULATION: '#DC2626',
  TECHNOLOGY: '#14B8A6',
  EVENT: '#A855F7',
  METRIC: '#EAB308',
  CONCEPT: '#78716C',
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  PERSON: 'Persona',
  ORGANIZATION: 'Organizzazione',
  PRODUCT: 'Prodotto',
  SERVICE: 'Servizio',
  PROCESS: 'Processo',
  DEPARTMENT: 'Dipartimento',
  ROLE: 'Ruolo',
  LOCATION: 'Luogo',
  DOCUMENT: 'Documento',
  REGULATION: 'Normativa',
  TECHNOLOGY: 'Tecnologia',
  EVENT: 'Evento',
  METRIC: 'Metrica',
  CONCEPT: 'Concetto',
};

export const RELATION_TYPE_COLORS: Record<string, string> = {
  WORKS_FOR: '#94A3B8',
  MANAGES: '#60A5FA',
  BELONGS_TO: '#34D399',
  DEPENDS_ON: '#F87171',
  PRODUCES: '#A78BFA',
  USES: '#FBBF24',
  CONTAINS: '#2DD4BF',
  RELATED_TO: '#94A3B8',
  PART_OF: '#818CF8',
  RESPONSIBLE_FOR: '#F472B6',
  LOCATED_IN: '#FB923C',
  REPORTS_TO: '#38BDF8',
  COLLABORATES_WITH: '#4ADE80',
  PROVIDES: '#C084FC',
  REGULATES: '#EF4444',
};

export function getEntityColor(type: string): string {
  return ENTITY_TYPE_COLORS[type] ?? '#94A3B8';
}

export function getEntityLabel(type: string): string {
  return ENTITY_TYPE_LABELS[type] ?? type;
}

export function getRelationColor(type: string): string {
  return RELATION_TYPE_COLORS[type] ?? '#64748B';
}
