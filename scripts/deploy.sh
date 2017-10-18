#!/bin/sh

HOSTNAME="ec2-54-70-30-4.us-west-2.compute.amazonaws.com"
USER="ubuntu"
PEM_FILE="../ipfs-node-ami.pem"

RELEASE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`
DESTINATION="~/ipfs-node"

git archive master | gzip > /tmp/master.tar.gz
scp -i $PEM_FILE /tmp/master.tar.gz $USER@$HOSTNAME:/tmp

ssh -i $PEM_FILE $USER@$HOSTNAME <<ENDS
  cd $DESTINATION/current
  forever stop server.js

  mkdir -p $DESTINATION/$RELEASE
  cd $DESTINATION/$RELEASE
  tar xvfz /tmp/master.tar.gz
  rm $DESTINATION/current
  ln -s $DESTINATION/$RELEASE $DESTINATION/current

  cd $DESTINATION/current
  npm install
  forever start -a -l server.log server.js
ENDS

echo " * Deploy complete"    
