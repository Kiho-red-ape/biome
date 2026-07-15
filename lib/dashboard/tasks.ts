// Shared types for the participant dashboard "Needs Your Attention" feed and
// the cross-study documents center. Kept framework-free so both the API route
// and the client components import the same shapes.

export type TaskUrgency = 'overdue' | 'due_soon' | 'normal';

export type TaskKind =
  | 'sign_document'
  | 'accept_agreement'
  | 'eligibility_quiz'
  | 'self_report'
  | 'collect_sample'
  | 'ship_sample'
  | 'phlebotomy'
  | 'reply_message'
  | 'configure_payout'
  | 'resolve_dispute';

export interface TaskItem {
  id: string;            // stable: `${kind}:${sourceId}`
  kind: TaskKind;
  label: string;         // e.g. "Sign informed consent"
  studyId: string;
  studyTitle: string;
  urgency: TaskUrgency;
  dueDate: string | null;
  href: string;          // CTA target (existing page now; workspace deep-link in Phase 2)
}

export interface ParticipantDoc {
  id: string;
  experimentId: string;
  title: string;
  documentType: string;
  requiresSignature: boolean;
  signedByMe: boolean;
  signatureDueDate: string | null;
  fileName: string | null;
}

export interface DocumentStudyGroup {
  studyId: string;
  studyTitle: string;
  documents: ParticipantDoc[];
}

// Sort weight: overdue first, then due_soon, then normal.
export const URGENCY_RANK: Record<TaskUrgency, number> = {
  overdue:  0,
  due_soon: 1,
  normal:   2,
};

// Days-until-due → urgency. Negative (past due) = overdue, ≤ threshold = due_soon.
export function urgencyFromDue(dueDate: string | null, soonDays = 3): TaskUrgency {
  if (!dueDate) return 'normal';
  const diffDays = Math.floor((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) return 'overdue';
  if (diffDays <= soonDays) return 'due_soon';
  return 'normal';
}
