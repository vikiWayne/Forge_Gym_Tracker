export function checkOrigin(req, res, next) {
  const origin = req.headers.origin;
  const ownOrigin = `${req.protocol}://${req.headers.host}`;
  const developmentOrigins =
    process.env.NODE_ENV === "production"
      ? []
      : [
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          ...(process.env.DEV_ORIGIN ? [process.env.DEV_ORIGIN] : []),
        ];
  if (origin && origin !== ownOrigin && !developmentOrigins.includes(origin)) {
    return res.status(403).json({ error: "Origin not allowed." });
  }
  next();
}
