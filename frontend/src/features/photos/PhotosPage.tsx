import { useEffect, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import type { ProgressPhoto } from "./types";
import { PhotoCard } from "./PhotoCard";
import { PhotoForm } from "./PhotoForm";
import "./photos.css";
export function PhotosPage() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<ProgressPhoto | null>(null);
  const [month, setMonth] = useState("");
  const action = useAsyncAction();
  async function refresh() {
    try {
      const result = await api<{ photos: ProgressPhoto[] }>("/photos");
      setPhotos(result.photos);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Photos could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  const matches = photos.filter(
    (photo) => !month || photo.date.startsWith(month),
  );
  return (
    <>
      <PageHeader
        eyebrow="YOUR PRIVATE VISUAL JOURNAL"
        title="Progress, in your own frame."
        description="Keep a dated photo timeline alongside your training. These photos are visible only to your account."
        action={
          <button className="button primary" onClick={() => setAdding(true)}>
            <Plus size={17} />
            Add photo
          </button>
        }
      />
      <p className="photo-privacy">
        <ShieldCheck size={18} />
        Photos are never included in Together or offline caches. A connection is
        required to view or upload them.
      </p>
      <ErrorMessage message={error || action.error} />
      {error && (
        <button className="button secondary" onClick={() => void refresh()}>
          Try again
        </button>
      )}
      <div className="photo-toolbar">
        <label>
          Filter timeline
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </label>
        {month && (
          <button className="button subtle" onClick={() => setMonth("")}>
            Show all dates
          </button>
        )}
        <span>
          {matches.length} {matches.length === 1 ? "photo" : "photos"}
        </span>
      </div>
      {loading ? (
        <LoadingState />
      ) : matches.length ? (
        <div className="photo-grid">
          {matches.map((photo) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onDelete={() => {
                action.clearError();
                setDeleting(photo);
              }}
            />
          ))}
        </div>
      ) : (
        !error && (
          <EmptyState
            title={
              month
                ? "No photos in this month."
                : "Your timeline starts when you’re ready."
            }
          >
            Add a photo to keep a private, dated record. There are no
            comparisons or scores.
          </EmptyState>
        )
      )}
      {adding && (
        <Modal
          title="Add a private progress photo"
          close={() => setAdding(false)}
        >
          <PhotoForm
            onSaved={async () => {
              await refresh();
              setAdding(false);
            }}
          />
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete this photo?" close={() => setDeleting(null)}>
          <p>
            This permanently removes this photo and its caption from your
            timeline.
          </p>
          <ErrorMessage message={action.error} />
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setDeleting(null)}
            >
              Keep photo
            </button>
            <button
              className="button danger"
              disabled={action.pending}
              onClick={() =>
                void action.run(async () => {
                  await api(`/photos/${deleting.id}`, "DELETE");
                  await refresh();
                  setDeleting(null);
                })
              }
            >
              {action.pending ? "Deleting…" : "Delete photo"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
