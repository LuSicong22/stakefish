const express = require("express");
const http = require("http");
const https = require("https");
const dns = require("dns");
const { Pool } = require("pg"); // Replace with your preferred database library

const app = express();
const port = process.env.PORT || 3000;

// Database connection (replace with your credentials)
const pool = new Pool({
  user: "your_username",
  host: "your_host",
  database: "your_database",
  password: "your_password",
  port: 5432,
});

// Check if running under Kubernetes
const isKubernetes = process.env.KUBERNETES_SERVICE_HOST !== undefined;

// Access log middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} ${res.statusCode}`);
  next();
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    version: "0.1.0",
    date: Math.floor(Date.now() / 1000),
    kubernetes: isKubernetes,
  });
});

// /v1/tools/lookup endpoint
app.get("/v1/tools/lookup", async (req, res) => {
  const domain = req.query.domain;
  if (!domain) {
    return res
      .status(400)
      .json({ message: "Missing required parameter: domain" });
  }

  try {
    const addresses = await dns.lookup(domain, { family: 4 }); // Only IPv4
    const query = {
      domain,
      client_ip: req.ip,
      created_at: Math.floor(Date.now() / 1000),
      addresses: addresses.map((address) => ({ ip: address })),
    };

    await pool.query(
      "INSERT INTO queries (domain, client_ip, created_at, addresses) VALUES ($1, $2, $3, $4)",
      [query.domain, query.client_ip, query.created_at, query.addresses]
    );

    res.json(query);
  } catch (error) {
    if (error.code === "ENOTFOUND") {
      return res.status(404).json({ message: "Domain not found" });
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// /v1/tools/validate endpoint
app.post("/v1/tools/validate", (req, res) => {
  const { ip } = req.body;
  if (!ip) {
    return res.status(400).json({ message: "Missing required parameter: ip" });
  }

  const isValid = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);
  res.json({ status: isValid });
});

// /v1/history endpoint
app.get("/v1/history", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM queries ORDER BY created_at DESC LIMIT 20"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Prometheus metrics endpoint
app.get("/metrics", (req, res) => {
  // Implement your custom metrics here
  res.end("Your metrics here");
});

// Health endpoint
app.get("/health", (req, res) => {
  res.send("OK");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down...");
  await pool.end();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
