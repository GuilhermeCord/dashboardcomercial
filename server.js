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
  secret: "goldpao_super_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // true apenas com HTTPS
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
      res.json({ success: true });
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  });
});

app.get("/powerbi", (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect("/");
  }
  db.get("SELECT token FROM users LIMIT 1", (err, row) => {
    if (row?.token) {
      res.send(\`
        <html><body style="margin:0">
          <iframe src="https://app.powerbi.com/view?r=\${row.token}" style="width:100vw; height:100vh;" allowfullscreen></iframe>
        </body></html>
      \`);
    } else {
      res.status(500).send("Token não encontrado.");
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});