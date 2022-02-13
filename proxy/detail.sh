#!/bin/bash

cd $PWD

HOW_MANY="${1:-2}"

# Creating a backup of serverless.yml
cp ./serverless.yml ./backup.yml

rm ../scrape/proxy-urls.txt

echo ""
echo "Creating file ../scrape/proxy-urls with the URLs of $HOW_MANY proxies from AWS..."

for (( i=1; i<=$HOW_MANY; i++ ))
do
  perl -i -pe"s/service: proxy.*/service: proxy$i/g" ./serverless.yml

  sls info | grep endpoint | sed 's/endpoint: ANY - //g' >> ../scrape/proxy-urls.txt
done

# Deleting serverless.yml backup
cp ./backup.yml ./serverless.yml && rm ./backup.yml

echo ""
echo "Retrieved endpoint information about $HOW_MANY proxies from AWS."
echo "Created ../scrape/proxy-urls.txt"