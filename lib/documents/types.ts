export const DOCUMENT_TYPES = [
  'irb_approval',
  'study_protocol',
  'amendment',
  'participant_info_sheet',
  'consent_form',
  'service_contract',
  'researcher_agreement',
  'sponsor_authorization',
  'data_sharing_agreement',
  'insurance_certificate',
  'regulatory_filing',
  'lab_agreement',
  'pi_credentials',
  'other',
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number];

export const CLEARANCE_LEVELS = ['operator','researcher','participant','public'] as const;
export type ClearanceLevel = typeof CLEARANCE_LEVELS[number];

export const DOC_STATUSES = [
  'draft','pending_review','pending_signature','signed','approved','rejected','expired',
] as const;
export type DocStatus = typeof DOC_STATUSES[number];

export type StudyDocument = {
  id: string;
  experiment_id: string;
  document_type: DocumentType;
  title: string;
  description: string | null;
  clearance_level: ClearanceLevel;
  file_path: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  version: number;
  supersedes_id: string | null;
  status: DocStatus;
  requires_signature: boolean;
  signature_due_date: string | null;
  review_notes: string | null;
  uploaded_by: string;
  reviewed_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  content_html: string | null;
  content_hash: string | null;
  signatures?: DocumentSignature[];
};

export type DocumentSignature = {
  id: string;
  document_id: string;
  signer_user_id: string;
  signer_name: string;
  signer_email: string | null;
  signer_role: 'researcher' | 'sponsor' | 'participant' | 'operator' | 'witness';
  ip_address: string | null;
  signed_at: string;
  document_version: number;
  document_hash: string | null;
};

export type DocumentSendLog = {
  id: string;
  document_id: string;
  sent_to_email: string;
  sent_to_user_id: string | null;
  sent_by: string;
  message: string | null;
  sent_at: string;
  viewed_at: string | null;
  signed_at: string | null;
};

// ── Display metadata ────────────────────────────────────────────────────────

export const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  irb_approval:           'IRB / Ethics Approval',
  study_protocol:         'Study Protocol',
  amendment:              'Protocol Amendment',
  participant_info_sheet: 'Participant Info Sheet',
  consent_form:           'Informed Consent Form',
  service_contract:       'Service Contract',
  researcher_agreement:   'Researcher Agreement',
  sponsor_authorization:  'Sponsor Authorization',
  data_sharing_agreement: 'Data Sharing Agreement',
  insurance_certificate:  'Insurance Certificate',
  regulatory_filing:      'Regulatory Filing',
  lab_agreement:          'Lab Partner Agreement',
  pi_credentials:         'PI Credentials / CV',
  other:                  'Other',
};

export const DOC_CATEGORY: Record<DocumentType, string> = {
  irb_approval:           'Regulatory',
  study_protocol:         'Protocol',
  amendment:              'Protocol',
  participant_info_sheet: 'Protocol',
  consent_form:           'Consent',
  service_contract:       'Contracts',
  researcher_agreement:   'Contracts',
  sponsor_authorization:  'Contracts',
  data_sharing_agreement: 'Contracts',
  insurance_certificate:  'Compliance',
  regulatory_filing:      'Regulatory',
  lab_agreement:          'Contracts',
  pi_credentials:         'Compliance',
  other:                  'Other',
};

export const STATUS_LABEL: Record<DocStatus, string> = {
  draft:              'Draft',
  pending_review:     'Pending Review',
  pending_signature:  'Pending Signature',
  signed:             'Signed',
  approved:           'Approved',
  rejected:           'Revision Needed',
  expired:            'Expired',
};

export const STATUS_COLORS: Record<DocStatus, { bg: string; color: string }> = {
  draft:             { bg: 'var(--off-white)', color: 'var(--gray)' },
  pending_review:    { bg: 'var(--amber)',     color: 'var(--black)' },
  pending_signature: { bg: 'var(--amber)',     color: 'var(--black)' },
  signed:            { bg: 'var(--navy)',      color: 'var(--white)' },
  approved:          { bg: 'var(--black)',     color: 'var(--amber)' },
  rejected:          { bg: '#ef4444',          color: 'var(--white)' },
  expired:           { bg: 'var(--off-white)', color: 'var(--gray)' },
};

export const CLEARANCE_LABEL: Record<ClearanceLevel, string> = {
  operator:    'Ops Only',
  researcher:  'Researcher',
  participant: 'Participant',
  public:      'Public',
};

// ── Required documents per study ────────────────────────────────────────────

export const REQUIRED_DOCS_BASE: DocumentType[] = [
  'irb_approval',
  'study_protocol',
  'service_contract',
  'researcher_agreement',
  'consent_form',
  'participant_info_sheet',
];

export const REQUIRED_DOCS_WITH_SAMPLES: DocumentType[] = [
  ...REQUIRED_DOCS_BASE,
  'lab_agreement',
];

export const REQUIRED_DOCS_WITH_SPONSOR: DocumentType[] = [
  ...REQUIRED_DOCS_BASE,
  'sponsor_authorization',
  'data_sharing_agreement',
];

// ── Who can upload each document type ───────────────────────────────────────
// 'researcher' = study owner uploads it
// 'operator'   = Biome ops uploads it
// 'both'       = either party

export const UPLOADER_ROLE: Record<DocumentType, 'researcher' | 'operator' | 'both'> = {
  irb_approval:           'researcher',
  study_protocol:         'researcher',
  amendment:              'researcher',
  participant_info_sheet: 'operator',
  consent_form:           'operator',
  service_contract:       'operator',
  researcher_agreement:   'operator',
  sponsor_authorization:  'researcher',
  data_sharing_agreement: 'operator',
  insurance_certificate:  'researcher',
  regulatory_filing:      'researcher',
  lab_agreement:          'operator',
  pi_credentials:         'researcher',
  other:                  'both',
};
