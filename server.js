const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");

const app = express();
const db = new sqlite3.Database("database.db");

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "segredo_super_secreto",
  resave: false,
  saveUninitialized: false
}));

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (usuario TEXT, senha TEXT, token TEXT)");
  db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
    if (row.count === 0) {
      db.run("INSERT INTO users (usuario, senha, token) VALUES (?, ?, ?)", [
        "comercial.vendas@goldpao.com.br",
        "Goldpao@2025",
        "eyJrIjoiNjY3NTcwYzctM2ZjNC00NzIyLTliNDMtMTM2OGFlYzI0ZThiIiwidCI6ImMzNDRhNmQ1LTUxZTItNDk5Mi1iZjkxLTQ3MTlmYWNhZDcyMCJ9"
      ]);
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;
  db.get("SELECT * FROM users WHERE usuario = ? AND senha = ?", [usuario, senha], (err, row) => {
    if (row) {
      req.session.loggedIn = true;
      req.session.token = row.token;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Credenciais inválidas." });
    }
  });
});

app.get("/dashboard", (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/");
  }
  res.sendFile(path.join(__dirname, "public", "dashboard.html"));
});

app.get("/getPowerBiToken", (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(403).json({ error: "Não autorizado." });
  }
  res.json({ token: req.session.token });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
