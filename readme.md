# IPFS Upload node

This is a node.js express app that uses the go-ipfs client (the js-ipfs client [doesn't support](https://github.com/ipfs/js-ipfs/pull/856) the DHT yet) to upload scenes to our IPFS node.

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

*todo:* harden, set up strict iptables.

## Deploying

	$ mkdir ~/ipfs-node

Run `./deploy.sh`. You'll need a .pem file for the ec2 in the parent of this folder.