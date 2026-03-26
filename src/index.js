require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profiles");
const jobsRoutes = require("./routes/jobs");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/jobs", jobsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  void next;
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
