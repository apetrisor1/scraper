#!/bin/bash

TIMER=${2:-60}

curl --location --request POST "$1/start"

sleep 3

while true
do

  echo ""
  curl --location --request POST $1

  sleep $TIMER
done

