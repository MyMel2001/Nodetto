#!/bin/bash
npm run install:all


npm run server:dev >nodetto-server.log 2>&1 &
npm run client:dev >nodetto-client.log 2>&1 &
