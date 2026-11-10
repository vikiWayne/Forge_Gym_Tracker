import { useEffect, useState } from "react";
import { formatDate } from "../../shared/lib/dates";
import { checkPhotoResponse, type ProgressPhoto } from "./types";
export function PhotoCard({
  photo,
  onDelete,
}: {
  photo: ProgressPhoto;
  onDelete: () => void;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = "";
    setUrl("");
    setError("");
    void fetch(`/api/photos/${photo.id}/image`, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        await checkPhotoResponse(response);
        return response.blob();
      })
      .then((blob) => {
        if (!controller.signal.aborted) {
          objectUrl = URL.createObjectURL(blob);
          setUrl(objectUrl);
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo.id, attempt]);
  return (
    <article className="panel photo-card">
      <div className="photo-frame">
        {url ? (
          <img
            src={url}
            alt={
              photo.caption || `Progress photo from ${formatDate(photo.date)}`
            }
          />
        ) : (
          <p role="status">{error || "Loading private photo…"}</p>
        )}
      </div>
      {error && (
        <button
          className="button secondary"
          onClick={() => setAttempt((value) => value + 1)}
        >
          Retry image
        </button>
      )}
      <div className="photo-card-copy">
        <h2>{formatDate(photo.date)}</h2>
        {photo.caption && <p>{photo.caption}</p>}
        <button className="button subtle" onClick={onDelete}>
          Delete photo
        </button>
      </div>
    </article>
  );
}
