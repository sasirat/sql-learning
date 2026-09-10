const express = require("express");
const app = express();

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

let todos = [
  { id: 1, task: "shopping", done: false },
  { id: 2, task: "homework", done: true },
  { id: 3, task: "clean the room", done: false },
];

app.get("/", (req, res) => {
  res.send("hello!");
});

app.get("/todos", (req, res) => {
  res.json(todos);
});

app.post("/todos", (req, res) => {
  const newTodo = {
    id: todos.length + 1,
    task: req.body.task,
    done: req.body.done,
  };
  todos.push(newTodo);
  res.json(newTodo);
});

app.put("/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return res.status(404).json({ error: "ไม่เจอ todo นี้" });
  }
  todo.task = req.body.task;
  todo.done = req.body.done;
  res.json(todo);
});

app.delete("/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  todos = todos.filter((t) => t.id !== id);
  res.json({ message: "ลบแล้ว" });
});

app.listen(3000, () => {
  console.log("Server กำลังทำงานที่ http://localhost:3000");
});
