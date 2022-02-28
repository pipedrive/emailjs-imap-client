#!/usr/bin/env bash

docker run --rm -it --entrypoint sh -v "${PWD}":/app -w /app -u 1000:1000 node:10-alpine ./builder.sh
