# IPFS Upload node

This is a node.js express app that uses the go-ipfs client (the js-ipfs client [doesn't support](https://github.com/ipfs/js-ipfs/pull/856) the DHT yet) to upload scenes to our IPFS node.

## Usage with docker

```
docker build . -t upload:latest
docker run -p 3000:3000 -p 4001:4001 -p 5001:5001 -p 8080:8080 upload:latest
```

## Setting up a VPS

Some instructions here:

	https://ipfs.io/ipfs/QmURiPVvwtbitUgehDY7MXWrsKiHBqMKTKpT3gbLZoYZtv/index.html

Set up VPS (512mb ram seems ok) and ssh in as `root`.

	$ apt-get update
	$ wget https://dist.ipfs.io/go-ipfs/v0.4.11/go-ipfs_v0.4.11_linux-amd64.tar.gz
	$ tar xvfz go-ipfs_v0.4.11_linux-amd64.tar.gz
	$ cp go-ipfs/ipfs /usr/local/bin

Check ipfs runs then kill it.

	$ ipfs daemon

Get node.js 6.x.x PPA

	$ curl -sL https://deb.nodesource.com/setup_6.x -o nodesource_setup.sh
	$ sudo sh nodesource_setup.sh
	$ sudo apt-get install nodejs
	$ node -v

Install forever globally

	$ sudo npm install -g forever

Install build essentials

	$ sudo apt-get install build-essential

*todo:* harden box.

## Open ports

Open 3000, 4001 and 8080 to your VR (use AWS security groups).

## Start up ipfs daemon

Allow gateway connections from public web.

     $ ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080

Todo: Set ipfs to start at startup. I'm not sure how to do this. For now run it with `start-stop-daemon`:

	$ start-stop-daemon --start --background --pidfile /var/run/ipfs.pid --exec `which ipfs` -- daemon 

## Deploying

	$ mkdir ~/ipfs-node

Then run `./deploy.sh` locally. You'll need a .pem file for the ec2 in the parent of this folder. You may get some
errors from forever on first deploy but should deploy cleanly a second time.
