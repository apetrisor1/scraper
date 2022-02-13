#!/bin/bash

cd $PWD

HOW_MANY="${1:-2}"

# Creating a backup of serverless.yml
cp ./serverless.yml ./backup.yml

rm ../scrape/proxy-urls.txt

echo ""
echo "Removing $HOW_MANY proxies from AWS..."

for (( i=1; i<=$HOW_MANY; i++ ))
do
  perl -i -pe"s/service: proxy.*/service: proxy$i/g" ./serverless.yml

  sls remove
done

# Deleting serverless.yml backup
cp ./backup.yml ./serverless.yml && rm ./backup.yml

echo ""
echo "Finished removing $HOW_MANY proxies to AWS."