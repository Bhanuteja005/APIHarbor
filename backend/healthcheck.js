// Container healthcheck: exit 0 when the API answers /api/status with 200, else 1.
// Used by the Docker HEALTHCHECK directive (Railway uses its own HTTP healthcheck).
const http = require("http");

const port = process.env.PORT || 4000;

const req = http.request(
  { host: "127.0.0.1", port, path: "/api/status", timeout: 2500 },
  (res) => {
    process.exit(res.statusCode === 200 ? 0 : 1);
  }
);

req.on("error", () => process.exit(1));
req.on("timeout", () => {
  req.destroy();
  process.exit(1);
});
req.end();
