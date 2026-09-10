const request = require("supertest");

test("GET / ตอบ hello!", async () => {
  const response = await request("http://localhost:3000").get("/");
  expect(response.text).toBe("hello!");
});

test("GET /todos โดยไม่มี token ต้องโดน 401", async () => {
  const response = await request("http://localhost:3000").get("/todos");
  expect(response.status).toBe(401);
});

test("login แล้วเรียก GET /todos ได้", async () => {
  const loginRes = await request("http://localhost:3000")
    .post("/login")
    .send({ email: "deepa@mail.com", password: "mypassword123" });
  const token = loginRes.body.token;

  const todosRes = await request("http://localhost:3000")
    .get("/todos")
    .set("Authorization", `Bearer ${token}`);

  expect(todosRes.status).toBe(200);
});
