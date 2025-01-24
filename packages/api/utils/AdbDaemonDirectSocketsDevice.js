import { AdbPacket, AdbPacketSerializeStream } from "@yume-chan/adb";
import {
  StructDeserializeStream,
  MaybeConsumable,
  WrapReadableStream,
  WrapWritableStream,
} from "@yume-chan/stream-extra";
import { TCPSocket } from './TCPSocket.js'

export class AdbDaemonDirectSocketsDevice {
  static isSupported() {
    return true;
  }

  #options;

  serial;

  get host() {
    return this.#options.host;
  }

  port;

  get name() {
    return this.#options.name;
  }

  constructor(options) {
    this.#options = options;
    this.port = options.port ?? 5555;
    this.serial = `${this.host}:${this.port}`;
  }

  async connect() {
    const socket = new TCPSocket(this.host, this.port, {
      noDelay: true,
      unref: this.#options.unref,
    });
    const { readable, writable } = await socket.opened;

    return {
      readable: new WrapReadableStream(readable).pipeThrough(
        new StructDeserializeStream(AdbPacket),
      ),
      writable: new WrapWritableStream(writable)
        .bePipedThroughFrom(new MaybeConsumable.UnwrapStream())
        .bePipedThroughFrom(new AdbPacketSerializeStream()),
    };
  }
}