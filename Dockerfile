FROM node:latest

RUN apt-get update
RUN apt-get upgrade -y

WORKDIR /opt/ipfs
RUN wget https://dist.ipfs.io/go-ipfs/v0.4.11/go-ipfs_v0.4.11_linux-amd64.tar.gz
RUN tar xvfz go-ipfs_v0.4.11_linux-amd64.tar.gz
RUN cp go-ipfs/ipfs /usr/local/bin
RUN ipfs init
RUN ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080

WORKDIR /uploader
COPY package.json .
RUN npm install
COPY . .

EXPOSE 3000
EXPOSE 4001
EXPOSE 5001
EXPOSE 8080

CMD ./scripts/docker_start.sh
