export type ActionFeedbackEvent = {
  id: string;
  phase: "pending" | "success" | "error";
};
export const ACTION_FEEDBACK_EVENT = "forge:action-feedback";
export function announceAction(detail: ActionFeedbackEvent) {
  window.dispatchEvent(new CustomEvent(ACTION_FEEDBACK_EVENT, { detail }));
}
