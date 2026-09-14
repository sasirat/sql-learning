require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();
const cors = require("cors");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.send("hello!");
});

app.get("/todos", requireAuth, async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const sortOrder = req.query.sort === "desc" ? "DESC" : "ASC";

    let whereClause = "WHERE user_id = $1";
    const params = [req.userId];

    if (req.query.done === "true" || req.query.done === "false") {
      whereClause += " AND done = $2";
      params.push(req.query.done === "true");
    }

    params.push(limit, offset);
    const limitParamIndex = params.length - 1;
    const offsetParamIndex = params.length;

    const result = await pool.query(
      `SELECT * FROM todos ${whereClause} ORDER BY id ${sortOrder} LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
      params,
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM todos ${whereClause}`,
      params.slice(0, params.length - 2),
    );
    const totalCount = Number(countResult.rows[0].count);

    res.json({
      todos: result.rows,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดฝั่ง server" });
  }
});

app.post("/todos", requireAuth, async (req, res) => {
  try {
    if (!req.body.task) {
      return res.status(400).json({ error: "task ห้ามว่าง" });
    }
    const result = await pool.query(
      "INSERT INTO todos (task, done, user_id) VALUES ($1, $2, $3) RETURNING *",
      [req.body.task, req.body.done || false, req.userId],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดฝั่ง server" });
  }
});

app.put("/todos/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await pool.query(
      "UPDATE todos SET task = $1, done = $2 WHERE id = $3 RETURNING *",
      [req.body.task, req.body.done, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "ไม่เจอ todo นี้" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดฝั่ง server" });
  }
});

app.delete("/todos/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query("DELETE FROM todos WHERE id = $1", [id]);
    res.json({ message: "ลบแล้ว" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดฝั่ง server" });
  }
});

app.get("/users/:id/todos", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const result = await pool.query(
      `SELECT todos.task, todos.done, users.name
       FROM todos
       JOIN users ON todos.user_id = users.id
       WHERE users.id = $1`,
      [userId],
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดฝั่ง server" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email กับ password ห้ามว่าง" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "สมัครไม่สำเร็จ (อาจจะมี email ซ้ำ)" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: "ไม่เจอ email นี้" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "password ไม่ถูก" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "login ไม่สำเร็จ" });
  }
});

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "ต้อง login ก่อน" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "token ไม่ถูกหรือหมดอายุ" });
  }
}

app.listen(3000, () => {
  console.log("Server กำลังทำงานที่ http://localhost:3000");
});
