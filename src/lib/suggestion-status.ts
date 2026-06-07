export const SUGGESTION_STATUSES = ["submitted", "under_review", "in_progress", "resolved", "rejected"] as const;

export type SuggestionStatus = (typeof SUGGESTION_STATUSES)[number];

export const STAFF_STATUS_OPTIONS: Array<{ value: SuggestionStatus; label: string }> = [
  { value: "submitted", label: "Pending" },
  { value: "under_review", label: "Under review" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Denied" },
];

export type TransparencyStatus = "pending" | "resolved" | "denied";

export function getTransparencyStatus(status: string): TransparencyStatus {
  if (status === "resolved") return "resolved";
  if (status === "rejected") return "denied";
  return "pending";
}

export function getSuggestionStatusLabel(status: string, grouped = false) {
  if (grouped) {
    const publicStatus = getTransparencyStatus(status);
    return publicStatus === "denied" ? "Denied" : publicStatus[0].toUpperCase() + publicStatus.slice(1);
  }

  const match = STAFF_STATUS_OPTIONS.find((option) => option.value === status);
  return match?.label ?? status.replace(/_/g, " ");
}

export function getStatusBadgeClass(status: string, grouped = false) {
  const value = grouped ? getTransparencyStatus(status) : status;

  if (value === "resolved") return "bg-primary/10 text-primary";
  if (value === "rejected" || value === "denied") return "bg-destructive/10 text-destructive";
  if (value === "in_progress") return "bg-accent text-accent-foreground";
  return "bg-muted text-muted-foreground";
}