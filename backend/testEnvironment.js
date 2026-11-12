// Isolate test workers even when the caller has production credentials.
process.env.NODE_ENV = "test";
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;
