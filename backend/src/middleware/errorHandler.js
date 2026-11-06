import { z } from "zod";
export function errorHandler(error, req, res, next) {
  if (error instanceof z.ZodError)
    return res.status(400).json({
      error: error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    });
  if (error.type === "entity.parse.failed")
    return res.status(400).json({ error: "Invalid JSON body." });
  if (error.type === "entity.too.large")
    return res.status(413).json({ error: "Request body is too large." });
  console.error(error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
