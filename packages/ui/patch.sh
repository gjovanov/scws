#!/bin/bash

sed -i -e 's|\[YuvBuffer|\[{ default: YuvBuffer }|g' ./node_modules/@yume-chan/scrcpy-decoder-tinyh264/esm/decoder.js
sed -i -e 's|\./worker.js|@yume-chan/scrcpy-decoder-tinyh264/esm/worker.js|g' ./node_modules/@yume-chan/scrcpy-decoder-tinyh264/esm/wrapper.js
sed -i -e 's|\./worker.js|@yume-chan/pcm-player/esm/worker.js|g' ./node_modules/@yume-chan/pcm-player/esm/index.js


# sed -i -e 's|\[YuvBuffer|\[{ default: YuvBuffer }|g' ../../node_modules/@yume-chan/scrcpy-decoder-tinyh264/esm/decoder.js
# sed -i -e 's|\./worker.js|@yume-chan/scrcpy-decoder-tinyh264/esm/worker.js|g' ../../node_modules/@yume-chan/scrcpy-decoder-tinyh264/esm/wrapper.js
# sed -i -e 's|\./worker.js|@yume-chan/pcm-player/esm/worker.js|g' ../../node_modules/@yume-chan/pcm-player/esm/index.js