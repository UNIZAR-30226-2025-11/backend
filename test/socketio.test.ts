import { describe, beforeAll, afterAll, expect, it } from "vitest";
import io, { Socket as ClientSocket } from "socket.io-client";

import { server } from "../src/app.js";

// https://socket.io/docs/v4/testing/
// https://medium.com/@juaogei159/how-to-effectively-write-integration-tests-for-websockets-using-vitest-and-socket-io-360208978210

// Return response as promise
function waitFor(socket: ClientSocket, event: string) {
  return new Promise((resolve) => socket.once(event, resolve));
}

describe("Socket.io connection", () => {
  let client: ClientSocket;

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        server.listen(8000, () => {
          client = io("http://localhost:8000");
          client.on("connect", resolve);
        });
      }),
  );

  afterAll(() => {
    client.close();
    server.close();
  });

  it(`hello-req should return "Hello world" on hello-res`, async () => {
    client.emit("hello-req");
    let response = await waitFor(client, "hello-res");
    expect(response).toBe("Hello world");
  });

  it(`hello should return "Hello world" in callback`, async () => {
    let response = await client.emitWithAck("hello");
    expect(response).toBe("Hello world");
  });
});
