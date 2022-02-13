# Pre-requisites

Make sure you have the correct ```~/.aws/credentials```

```
npm install -g serverless
```

# Deploy resources first as a separate step

This is done because we'll be deploying multiple proxies at once and we need to give IAM permissions for lambdas
to that specific dynamoDB.

```
cd root/infrastructure
sh deploy.sh
```

Copy the DB ARN into the IAM part of ```proxy/serverless.yml``` and ```scrape/serverless.yml```

# Deploying proxies
First you must deploy the <b>Proxy</b> service.
```
cd root/proxy
npm install
touch .env
```
Fill the ```PARAS_FRESH_DATA_URL``` endpoint in .env

Deploy your desired number of proxies (see below).
```
Example: sh deploy.sh 5
```

# Deploying multiple proxy Lambdas at once

Run ```deploy.sh``` with your desired number of proxies as an argument.

Note: If you use ```deploy.sh```, you will have to <b>destroy</b> and <b>get information</b> about the lambdas with ```destroy.sh``` and ```detail.sh``` respectively, as the Serverless service names will be proxy1, proxy2 etc. instead of proxy, which breaks the Serverless CLI functionality.

# Destroying multiple proxy Lambdas at once

Run ```destroy.sh```, with your current number of proxies as an argument (must match your current number of proxies to delete all lambdas).

```
Example: sh destroy.sh 5
```

# Retrieving info about multiple proxy Lambdas at once

Run ```detail.sh```, with your current number of proxies as an argument (must match your current number of proxies to get info from all lambdas).

```
Example: sh detail.sh 5
```

# Using the proxy URLS

The scripts ```deploy.sh``` and ```detail.sh``` create a file in the <b>scrape</b> folder that holds the proxy lambdas URLs. This is then automatically parsed by the scraper deploy script to fill in its' ```.env``` values.

# Deploying scraper
```
cd root/scrape
npm install
sh deploy.sh
```
The scraper deploy script fils the PROXY_DATA_URLS in ```.env``` from ```proxy-urls.txt``` and then deploys the scraper using the Serverless CLI.

# Naming conventions

The proxy deploy and destroys script rely on the Serverless proxy service being named "proxy". Do not change that name in "serverless.yml" unless adjusting the scripts as well.

The proxy deploy and detail scripts rely on the Serverless scrape service being placed in a folder named "scrape". Do not change the folder name unless adjusting the detail script as well.

The scrape service relies on the ```.env``` key <b>PROXY_DATA_URLS</b>. Do not change that name.

