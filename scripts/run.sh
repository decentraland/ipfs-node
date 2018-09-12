#!/bin/bash
# Make sure this script is available on the remote machine
set -e # Abort script at first error, when a command exits with non-zero status
set -i # Script runs in interactive mode

if [[ $# -eq 0 ]] ; then
    echo 'Missing repository name:tag'
    exit 0
fi

AWS_ACCESS_KEY_ID=$(sudo aws --profile default configure get aws_access_key_id)
AWS_SECRET_ACCESS_KEY=$(sudo aws --profile default configure get aws_secret_access_key)
LAND_REGISTRY_CONTRACT_ADDRESS=0x7a73483784ab79257bb11b96fd62a2c3ae4fb75b
RPC_URL=https://ropsten.infura.io/
REDIS_HOST=redis.vmryun.0001.use1.cache.amazonaws.com
REDIS_PORT=6379
S3_BUCKET=ipfs.decentraland.zone
S3_URL=https://s3.amazonaws.com

docker stop "$(docker ps -q --filter ancestor=dbhvk/dcl-ipfs-node)" || true
docker rmi -f "$1" || true
docker pull "$1:latest"
docker run -t -p 3000:3000  \
    -e "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" \
    -e "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" \
    -e "LAND_REGISTRY_CONTRACT_ADDRESS=$LAND_REGISTRY_CONTRACT_ADDRESS" \
    -e "RPC_URL=$RPC_URL" \
    -e "REDIS_HOST=$REDIS_HOST" \
    -e "REDIS_PORT=$REDIS_PORT" \
    -e "S3_BUCKET=$S3_BUCKET" \
    -e "S3_URL=$S3_URL" \
    --restart on-failure "$1:latest"