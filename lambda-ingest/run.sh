#! /bin/bash

docker run --name test --platform linux/amd64 -p 9000:8080 captest
