const express = require("express");
const dns = require("dns");
const { Pool } = require("pg");
const promClient = require('prom-client');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL database connection
const dbConfig = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});

// PostgreSQL database connection with error handling
let pool;
try {
  pool = new Pool(dbConfig);
} catch (error) {
  console.error("Error creating database pool:", error);
  process.exit(1);
}

// Prometheus metrics
const promRegistry = new promClient.Registry();
promClient.collectDefaultMetrics({ register: promRegistry });

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
    const addresses = await dns.promises.lookup(domain, { family: 4 }); // Only IPv4
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
app.get("/metrics", async (req, res) => {
  try {
    const metrics = await promRegistry.metrics();
    res.set('Content-Type', promClient.register.contentType);
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
});

// Health endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
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
