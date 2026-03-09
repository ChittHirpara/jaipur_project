import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("cos.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    app_title TEXT,
    content TEXT,
    summary TEXT,
    intent TEXT,
    embedding TEXT, -- JSON array
    cluster_id INTEGER
  );

  CREATE TABLE IF NOT EXISTS edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER,
    target_id INTEGER,
    weight REAL,
    type TEXT,
    FOREIGN KEY(source_id) REFERENCES snapshots(id),
    FOREIGN KEY(target_id) REFERENCES snapshots(id)
  );
`);

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API Routes
  app.post("/api/snapshots", (req, res) => {
    const { app_title, content, summary, intent, embedding, cluster_id } = req.body;
    const stmt = db.prepare(`
      INSERT INTO snapshots (app_title, content, summary, intent, embedding, cluster_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(app_title, content, summary, intent, JSON.stringify(embedding), cluster_id);
    
    // Auto-link to previous snapshot if it exists
    const lastSnapshot = db.prepare("SELECT id FROM snapshots WHERE id < ? ORDER BY id DESC LIMIT 1").get(info.lastInsertRowid);
    if (lastSnapshot) {
      db.prepare("INSERT INTO edges (source_id, target_id, weight, type) VALUES (?, ?, ?, ?)")
        .run(lastSnapshot.id, info.lastInsertRowid, 1.0, "temporal");
    }

    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/snapshots", (req, res) => {
    const snapshots = db.prepare("SELECT * FROM snapshots ORDER BY timestamp DESC LIMIT 50").all();
    res.json(snapshots.map(s => ({ ...s, embedding: JSON.parse(s.embedding || "[]") })));
  });

  app.get("/api/graph", (req, res) => {
    const nodes = db.prepare("SELECT id, app_title, intent, timestamp, cluster_id FROM snapshots").all();
    const links = db.prepare("SELECT source_id as source, target_id as target, weight, type FROM edges").all();
    res.json({ nodes, links });
  });

  app.delete("/api/snapshots", (req, res) => {
    db.prepare("DELETE FROM edges").run();
    db.prepare("DELETE FROM snapshots").run();
    res.json({ status: "cleared" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`COS Server running on http://localhost:${PORT}`);
  });
}

startServer();
