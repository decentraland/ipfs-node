# IPFS Upload node

This is a node.js express app that uses the go-ipfs client (the js-ipfs client [doesn't support](https://github.com/ipfs/js-ipfs/pull/856) the DHT yet) to upload scenes to our IPFS node.

## Public API

| Endpoint| Method | Response |
| ------------- |:-------------:|-------------|
| api/pin/:peerId/:x/:y | POST | { data: object } | 
| api/resolve/:x/:y | GET | { url: { ipns: string, ipfs: string, dependencies: array } } | 
| api/get/:ipfs/:file* | GET | file | 

## Debugging

You can always check commands manually, get into the container:
```
docker exec it ipfs-node bash
```
The command api is documented [here](https://ipfs.io/docs/commands/).

## Test environment

You need to create your own source of assets and publish it. Let's say to create a 2 level deep folder structure like:

- sample 
  * child1
    - text.txt
  * child2.txt

You can upload publish your assets like:

```
ipfs add -r ./sample
```
This will return a list of hashes per element, take the main one from the parent directory.

```bash
# output omitted for convenience...
# added QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH sample/child/text.txt
# added QmbFMke1KXqnYyBBWxB74N4c5SBnJMVAiMNRcGu6x1AwQH sample/child2.txt
# added QmNrDkNEovk19jPe1wQA9vXFwGwBE8t9uCGuaXukfR385g sample/child
# added QmUt8guW4C7zDZ7WHociwudbfs83zMZ7Rkxrjkoeg3QupX sample

ipfs name publish QmUt8guW4C7zDZ7WHociwudbfs83zMZ7Rkxrjkoeg3QupX
#Published to QmNwrcEu5AiDdKZEWzFcGbWxP5j7E1z4eNC7xWaJaVjKMU: /ipfs/QmUt8guW4C7zDZ7WHociwudbfs83zMZ7Rkxrjkoeg3QupX
```
Et voila! votre ipfs hash is up. Now you can query ipns hashes and dependencies using the API.
Assuming `QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK` is the node peerId
and there is an IPNS  inside the parcel (1,2)

```http
POST api/pin/QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK/1/2
HTTP/1.1 200 OK
Content-Type: application/json

{
  "ok":true
}

```


```http
POST api/pin/QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK/1/2
HTTP/1.1 404 Not found
Content-Type: application/json

{
  "error": "IPNS not found"
}
```

```http
POST api/pin/QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK/1/2
HTTP/1.1 500 
Content-Type: application/json

{
  "error": "Can not connect to peer: QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK"
}
```

Get the hashes related to a parcel

```http
GET api/resolve/-81,-108
HTTP/1.1 200 OK
Content-Type: application/json

{
    "ok": true,
    "url": {
        "ipns": "Qmbu41fpDf2xp547AQz3uYYXCy81JqWAYU31KW4u7MQPB4",
        "ipfs": "QmSwTyffPvZt7cxdoGaQWrzQVus3ArqG7WFWct6LF4yCpD",
        "dependencies": [
            {
                "src": "'QmSwTyffPvZt7cxdoGaQWrzQVus3ArqG7WFWct6LF4yCpD",
                "ipfs": "QmUziFsqDd72KUwYHcGCusY8PVMmgj6bRUFqYv8KL6NCej",
                "name": "minimap.png'"
            },
            {
                "src": "'QmSwTyffPvZt7cxdoGaQWrzQVus3ArqG7WFWct6LF4yCpD",
                "ipfs": "QmQ7ixyMcQKyfrPG95pifJBs6qUA2YLkNmDboCq9KtAq9x",
                "name": "scene.html'"
            },
            {
                "src": "'QmSwTyffPvZt7cxdoGaQWrzQVus3ArqG7WFWct6LF4yCpD",
                "ipfs": "QmSv553QHeod1fNn9BxaQjxnwQwbQqv2RmLEEyaF71WDuK",
                "name": "scene.json'"
            },
            {
                "src": "'QmSwTyffPvZt7cxdoGaQWrzQVus3ArqG7WFWct6LF4yCpD",
                "ipfs": "QmdLYsV4qy3XUcJ1TQw2cHxd2JCUpvHwcEgfgWKzp2kxE6",
                "name": "scene.xml'"
            }
        ]
    }
}
```

```http
GET api/resolve/-81,-108
HTTP/1.1 403 FORBIDDEN
Content-Type: application/json

{
  "error": "Parcel (-81,-108) is blacklisted"
}
```

```http
GET api/resolve/-81,-108
HTTP/1.1 404 Not found
Content-Type: application/json

{
  "error": "IPNS not found"
}
```

Get a file

```http
GET api/get/QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK
HTTP/1.1 200 OK
Content-Type: stream
```

```http
 GET api/get/QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK/filename
 HTTP/1.1 200 OK
 Content-Type: stream
 ```
 
 ```http
  GET api/get/QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK/subfolder/filename
  HTTP/1.1 200 OK
  Content-Type: stream
  ```
 ```http
 GET api/get/QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK/subfolder/filename
 HTTP/1.1 403 FORBIDDEN
 Content-Type: application/json
 
 {
   "error": "IPFS QmexQCWwaEdEDWrMArR2T2g3V4RGvXXiXj6HgWfRBCumDK is blacklisted"
 }
 ```
  
Notice you cannot get node, only leaf.

## Usage with docker

### Development

```
npm run docker:build
npm run docker:run
```

### AWS

```
npm run docker:build
npm run docker:aws:run
```

## Version
2.0.0 - Refactor API gateways.
