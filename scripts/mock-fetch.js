import { MockAgent, setGlobalDispatcher } from "undici";

const mockAgent = new MockAgent();
setGlobalDispatcher(mockAgent);

const mockPool = mockAgent.get("http://localhost:3000");

mockPool.intercept({
  path: "/",
  method: "GET",
}).reply(200, { message: "Hello undici" });

mockPool.intercept({
  path: "/users",
  method: "GET",
}).reply(200, [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Charlie" },
]);

fetch("http://localhost:3000").then((res) => res.json()).then(console.log);
fetch("http://localhost:3000/users").then((res) => res.json()).then(console.dir);


// 1. undici is a Node.js library and cannot be used directly in the browser.
// 2. MSW (Mock Service Worker) behaves like a service in the browser, intercepting HTTP requests and returning mock responses.