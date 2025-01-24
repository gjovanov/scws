import { AdbPacket, AdbPacketSerializeStream, unreachable, } from "@yume-chan/adb";
import { ConsumableWritableStream, DuplexStreamFactory, ReadableStream, StructDeserializeStream, pipeFrom, } from "@yume-chan/stream-extra";
export default class AdbDaemonWebSocketDevice {
    serial;
    name;
    constructor(url, name) {
        this.serial = url;
        this.name = name;
    }
    async connect() {
        const socket = new WebSocket(this.serial);
        socket.binaryType = "arraybuffer";
        await new Promise((resolve, reject) => {
            socket.onopen = resolve;
            socket.onerror = () => {
                reject(new Error("WebSocket connect failed"));
            };
        });
        const duplex = new DuplexStreamFactory({
            close: () => {
                socket.close();
            },
        });
        socket.onclose = () => {
            duplex.dispose().catch(unreachable);
        };
        const readable = duplex.wrapReadable(new ReadableStream({
            start: (controller) => {
                socket.onmessage = ({ data, }) => {
                    controller.enqueue(new Uint8Array(data));
                };
            },
        }, {
            highWaterMark: 16 * 1024,
            size(chunk) {
                return chunk.byteLength;
            },
        }));
        const writable = duplex.createWritable(new ConsumableWritableStream({
            write(chunk) {
                socket.send(chunk);
            },
        }));
        return {
            readable: readable.pipeThrough(new StructDeserializeStream(AdbPacket)),
            writable: pipeFrom(writable, new AdbPacketSerializeStream()),
        };
    }
}
//# sourceMappingURL=index.js.map