import { PromiseResolver } from "@yume-chan/async";
import { PushReadableStream, WritableStream } from "@yume-chan/stream-extra";
import { connect } from "node:net";

export class TCPSocket {
  #socket;
  #opened = new PromiseResolver();
  get opened() {
    return this.#opened.promise;
  }

  constructor(remoteAddress, remotePort, options) {
    this.#socket = connect(remotePort, remoteAddress);

    if (options?.noDelay) {
      this.#socket.setNoDelay(true);
    }
    if (options?.unref) {
      this.#socket.unref();
    }

    this.#socket.on("connect", () => {
      const readable = new PushReadableStream((controller) => {
        this.#socket.on("data", async (data) => {
          this.#socket.pause();
          await controller.enqueue(data);
          this.#socket.resume();
        });

        this.#socket.on("end", () => {
          try {
            controller.close();
          } catch {}
        });

        controller.abortSignal.addEventListener("abort", () => {
          this.#socket.end();
        });
      });

      this.#opened.resolve({
        remoteAddress,
        remotePort,
        localAddress: this.#socket.localAddress,
        localPort: this.#socket.localPort,
        readable,
        writable: new WritableStream({
          write: async (chunk) => {
            return new Promise((resolve, reject) => {
              if (!this.#socket.write(chunk)) {
                this.#socket.once("drain", resolve);
              } else {
                resolve();
              }
            });
          },
          close: async () => {
            this.#socket.end();
          },
        }),
      });
    });

    this.#socket.on("error", (error) => {
      this.#opened.reject(error);
    });
  }
}