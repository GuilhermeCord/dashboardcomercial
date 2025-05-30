const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const db = new sqlite3.Database("database.db");

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "goldpao_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 60 * 1000 } // 30 minutos
}));

// Cria a tabela e usuário padrão
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

// Página de login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Dashboard protegido
app.get("/dashboard", (req, res) => {
  if (!req.session.usuario) return res.redirect("/");
  
  db.get("SELECT token FROM users WHERE usuario = ?", [req.session.usuario], (err, row) => {
    if (err || !row) return res.redirect("/");

    res.send(`
      <!DOCTYPE html>
      <html lang="pt-br">
      <head>
        <meta charset="UTF-8">
        <title>Dashboard</title>
        <style>
          html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
          iframe { width: 100vw; height: 100vh; border: none; }
        </style>
      </head>
      <body>
        <iframe src="https://app.powerbi.com/view?r=${row.token}" allowfullscreen></iframe>
      </body>
      </html>
    `);
  });
});

// Login
app.post("/login", (req, res) => {
  const { usuario, senha } = req.body;
  db.get("SELECT * FROM users WHERE usuario = ? AND senha = ?", [usuario, senha], (err, row) => {
    if (row) {
      req.session.usuario = row.usuario;
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
