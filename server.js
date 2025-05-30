const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const db = new sqlite3.Database("database.db");

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

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
      res.cookie("autenticado", "true", { httpOnly: true });
      res.redirect("/dashboard");
    } else {
      res.status(401).send("Credenciais inválidas.");
    }
  });
});

app.get("/dashboard", (req, res) => {
  if (req.cookies.autenticado !== "true") {
    return res.redirect("/");
  }

  db.get("SELECT token FROM users LIMIT 1", (err, row) => {
    if (row && row.token) {
      res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head><meta charset="UTF-8"><title>Dashboard</title></head>
        <body style="margin:0;padding:0;background:#0D0C15;">
          <iframe src="https://app.powerbi.com/view?r=${row.token}" style="width:100vw;height:100vh;border:none;"></iframe>
        </body>
        </html>
      `);
    } else {
      res.status(500).send("Dashboard indisponível.");
    }
  });
});

app.get("/logout", (req, res) => {
  res.clearCookie("autenticado");
  res.redirect("/");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});
