#! /bin/bash

ipfs init

ipfs daemon &

node ./src/server.js