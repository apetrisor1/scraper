#!/bin/bash

cd $PWD

HOW_MANY="${1:-2}"
  
# Creating a backup of serverless.yml
cp ./serverless.yml ./backup.yml

rm ../entry/proxy-urls.txt

echo ""
echo "Updating --function scrape for $HOW_MANY proxies in AWS..."

for (( i=1; i<=$HOW_MANY; i++ ))
do
  perl -i -pe"s/service: proxy.*/service: proxy$i/g" ./serverless.yml
  sls deploy --function scrape
  sls info | grep endpoint | sed 's/endpoint: ANY - //g' >> ../entry/proxy-urls.txt
done

# Deleting serverless.yml backup
cp ./backup.yml ./serverless.yml && rm ./backup.yml

echo ""
echo "Finished updating --function scrape for $HOW_MANY proxies in AWS..."
