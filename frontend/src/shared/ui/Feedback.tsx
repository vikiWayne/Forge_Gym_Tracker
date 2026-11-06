import type { ReactNode } from "react";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <div role="alert" className="error-message">
      {message}
    </div>
  ) : null;
}
export function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle className="spin" size={28} />
      <p>Getting your space ready…</p>
    </div>
  );
}
export function EmptyState({
  title,
  children,
  to,
  action,
}: {
  title: string;
  children: ReactNode;
  to?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Sparkles size={26} />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {to && (
        <Link className="button primary" to={to}>
          {action}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}
