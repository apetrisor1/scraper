#!/bin/bash

cd $PWD

aws dynamodb create-table --cli-input-json file://lambda-table.json --endpoint-url https://dynamodb.eu-central-1.amazonaws.com --profile scraper
