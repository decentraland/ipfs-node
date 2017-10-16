#!/bin/sh

git archive master | gzip > /tmp/master.tar.gz
scp -i ../ipfs-node-ami.pem /tmp/master.tar.gz ubuntu@ec2-54-70-30-4.us-west-2.compute.amazonaws.com:/tmp

RELEASE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`
DESTINATION="~/ipfs-node"

ssh -i ../ipfs-node-ami.pem ubuntu@ec2-54-70-30-4.us-west-2.compute.amazonaws.com <<ENDS
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
