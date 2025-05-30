const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");

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
      res.send(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
          <meta charset="UTF-8">
          <title>Dashboard</title>
          <style>
            body {
              margin: 0;
              background-color: #0D0C15;
            }
            iframe {
              width: 100vw;
              height: 100vh;
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe src="https://app.powerbi.com/view?r=${row.token}"></iframe>
        </body>
        </html>
      `);
    } else {
      res.status(401).send("Credenciais inválidas.");
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Servidor rodando na porta " + PORT);
});