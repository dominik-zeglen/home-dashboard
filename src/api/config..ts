export const API_HOST =
  process.env.NODE_ENV === "production"
    ? window.location.host
    : "localhost:18745";
