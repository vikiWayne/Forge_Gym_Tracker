import { appFetch } from "../../shared/api/transport";
import { useState, type FormEvent } from "react";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { localDate } from "../../shared/lib/dates";
import { checkPhotoResponse } from "./types";
import { preparePhoto } from "./preparePhoto";
export function PhotoForm({ onSaved }: { onSaved: () => Promise<void> }) {
  const [file, setFile] = useState<File | null>(null);
  const action = useAsyncAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void action.run(async () => {
      if (!file) throw new Error("Choose a photo first.");
      const image = await preparePhoto(file);
      const response = await appFetch("/api/photos", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": image.type,
          "X-Photo-Date": String(data.get("date")),
          "X-Photo-Caption": encodeURIComponent(
            String(data.get("caption") || ""),
          ),
        },
        body: image,
      });
      await checkPhotoResponse(response);
      await onSaved();
    });
  }
  return (
    <form onSubmit={submit}>
      <label>
        Photo
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          disabled={action.pending}
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
      </label>
      <p className="field-hint">
        JPEG, PNG or WebP. Photos are resized to 1,600 pixels and saved as JPEG
        without the original file metadata. Maximum stored size: 2 MiB.
      </p>
      <label>
        Date
        <input
          type="date"
          name="date"
          required
          max={localDate()}
          defaultValue={localDate()}
          disabled={action.pending}
        />
      </label>
      <label>
        Caption <span className="optional">optional</span>
        <textarea
          name="caption"
          maxLength={500}
          placeholder="A little context for this moment…"
          disabled={action.pending}
        />
      </label>
      <ErrorMessage message={action.error} />
      <button className="button primary full-width" disabled={action.pending}>
        {action.pending ? "Preparing and uploading…" : "Save private photo"}
      </button>
    </form>
  );
}
