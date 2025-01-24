FROM node:22.5.0-slim AS base

ENV HOST=0.0.0.0
ENV PORT=4001
ENV SHELL=/bin/bash
# ENV NODE_TLS_REJECT_UNAUTHORIZED=0


COPY . /app
WORKDIR /app


SHELL ["/bin/bash", "-c"]
RUN apt update && \
    apt install adb unzip jq -y && \
    cp ./install/aapt2 /usr/bin/ && \
    npm i -g pnpm && \
    pnpm recursive install && \
    cd /app/packages/api && \
    npx @yume-chan/fetch-scrcpy-server 2.6.1 && \
    cd /app/packages/ui && \
    ./patch.sh && \
    pnpm run build


EXPOSE 4001/tcp
WORKDIR /app/packages/api
CMD [ "pnpm", "run", "build-and-start" ]