# IPFS Upload node

This is a node.js express app that uses the go-ipfs client (the js-ipfs client [doesn't support](https://github.com/ipfs/js-ipfs/pull/856) the DHT yet) to upload scenes to our IPFS node.

## Usage with docker

```
docker build . -t upload:latest
docker run -p 3000:3000 -p 4001:4001 -p 5001:5001 -p 8080:8080 upload:latest
```
