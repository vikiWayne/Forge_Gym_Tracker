export type ProgressPhoto = {
  id: string;
  date: string;
  caption: string;
  content_type: string;
  size: number;
  created_at: number;
};
export async function checkPhotoResponse(response: Response) {
  if (response.status === 401)
    window.dispatchEvent(new Event("session-expired"));
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(
      result.error || "This photo could not be loaded. Please try again.",
    );
  }
}
