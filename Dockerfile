FROM node:8

RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get -y install \
    libusb-dev \
    libusb-1.0.0-dev \
    libudev-dev \
    build-essential \
    libkrb5-dev

RUN npm i npm@latest -g
WORKDIR /opt/ipfs
RUN wget https://dist.ipfs.io/go-ipfs/v0.4.14/go-ipfs_v0.4.14_linux-amd64.tar.gz
RUN tar xvfz go-ipfs_v0.4.14_linux-amd64.tar.gz
RUN cp go-ipfs/ipfs /usr/local/bin
RUN ipfs init
RUN ipfs config Addresses.Gateway /ip4/0.0.0.0/tcp/8080
RUN npm update
RUN npm install -g babel-cli
WORKDIR /uploader
COPY package.json .
RUN npm i node-hid@latest
RUN npm i socks@latest
RUN npm install
COPY . .

EXPOSE 3000
EXPOSE 4001
EXPOSE 5001
EXPOSE 8080

CMD ./scripts/docker_start.sh