import { useState, useEffect, FormEvent } from "react";

const API_URL = "https://sql-learning-production.up.railway.app";

type Todo = { id: number; task: string; done: boolean };

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (data.token) setToken(data.token);
    else alert("login ไม่สำเร็จ");
  }

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/todos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTodos(data.todos));
  }, [token]);

  if (!token) {
    return (
      <form onSubmit={handleLogin}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="password"
        />
        <button type="submit">Login</button>
      </form>
    );
  }

  return (
    <div>
      <h1>My Todos</h1>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            {todo.task} {todo.done ? "✅" : "⏳"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
