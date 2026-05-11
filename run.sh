#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

nvm i 24
nvm use 24

npm run install:all


npm run server:dev >nodetto-server.log 2>&1 &
npm run client:dev >nodetto-client.log 2>&1 &
