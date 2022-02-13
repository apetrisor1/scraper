# Description
This project uses AWS lambda to hit an API URL through multiple proxies once every N seconds and stores the retrieved data in an ElasticSearch like database.

Scrape lambda (entry point) triggered by any cron mechanism, which should call ```entryURL/``` (URL received after deploying <b>scrape</b>).

Scrape lambda hits each proxy lambda in a round-robin fashion, proxy hits the URL we're interested in
and stores the data.

The latest used proxy is stored in dynamoDB for the round-robin mechanism.
The busy status of proxies is stored in dynamoDB to avoid race-conditions. Each proxy sets that status to busy when it starts working and sets it to free when done. If the scrape lambda hits a proxy while another one is busy, that call is dropped, but doesn't stop the cron.

Before start, scraper must be prepared by calling ```entryURL/start```. This sets the list of proxies in dynamoDB, and all statuses as ready for work.

Whenever user wants, scraper can be stopped by calling ```entryURL/stop```. This sets the overall status to busy, which prevents further calls to proxies.

<b>TODO: When scraper is detected as stopped, cron to be shut down programatically.</b>

Cron -> |Entry  | -> | Proxy   | -> API | -> | Proxy   | -> | ElasticSearch & dynamoDB
---     | ---   | ---| ---     | ---    | ---| ---     | ---| ---
Cron -> |Scrape | -> | Proxy#1 | -> API | -> | Proxy#2 | -> | ElasticSearch & dynamoDB
Cron -> |Scrape | -> | Proxy#2 | -> API | -> | Proxy#3 | -> | ElasticSearch & dynamoDB
Cron -> |Scrape | -> | Proxy#3 | -> API | -> | Proxy#4 | -> | ElasticSearch & dynamoDB
Cron -> |Scrape | -> | Proxy#1 | -> API | -> | Proxy#4 | -> | ElasticSearch & dynamoDB
..... and so on

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
Fill the ```DATA_URL``` endpoint in .env. <b>Taking data from here.</b>

Fill the ```OPENSEARCH``` credentials in .env. <b>Putting data here.</b>

Deploy your desired number of proxies (see below).
```
Example: sh deploy.sh 5
```

# Deploying multiple proxy Lambdas at once

Run ```deploy.sh``` with your desired number of proxies as an argument.

Note: If you use ```deploy.sh```, you will have to <b>destroy</b> and <b>get information</b> about the lambdas with ```destroy.sh``` and ```detail.sh``` respectively, as the Serverless service names will be proxy1, proxy2 etc. instead of proxy, which breaks the Serverless CLI functionality.

# Destroying multiple proxy Lambdas at once

Run ```destroy.sh```, with your current number of proxies as an argument (must match your current number of proxies to delete all lambdas and their associated resources).

```
Example: sh destroy.sh 5
```

Run ```detail.sh```, with your current number of proxies as an argument (must match your current number of proxies to get info from all lambdas) to re-populate the root/scrape/proxy-urls.txt document, needed when deploying the scraper.

```
Example: sh detail.sh 5
```

# Deploying scraper
```
cd root/scrape
npm install
sh deploy.sh
```
The scraper deploy script fils the PROXY_DATA_URLS in ```.env``` from ```proxy-urls.txt``` and then deploys the scraper using the Serverless CLI.

# Naming conventions

The proxy scripts rely on the proxy service being named "proxy". Do not change that name in "serverless.yml" unless adjusting the scripts as well.

The proxy scripts rely on the scrape service being placed in a folder named "scrape". Do not change the folder name unless adjusting the scripts as well.

The scrape service relies on the ```.env``` key <b>PROXY_DATA_URLS</b>.

# Use-case specific functions
```extractFormattedData```, ```replacer```. Adjust these to fit your needs.

# License
Copyright 2022 Adrian Petrisor (adrian.petrisor@outlook.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.