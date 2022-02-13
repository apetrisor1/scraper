V1 Scraper started on schedule
Before start, scraper prepared by calling /start
Whenever user wants, scraper can be stopped by calling /stop
TODO: When scraper is detected as stopped, schedule can be shut down programatically
scraper  <----> proxy 1  <----> Fresh NFTS API
         <----> proxy 2  <----> Fresh NFTS API
         <----> proxy 3  <----> Fresh NFTS API
         <----> proxy 4  <----> Fresh NFTS API
         <----> proxy 5  <----> Fresh NFTS API
         .....    |
                  |
                 \ /
        Each proxy inserts latest entry ID and timestampt into dynamoDB
        Each proxy inserts entry into AWS Opensearch


Also tried V2, not an option because proxy must schedule its own call to the
next proxy and then has to wait, and we get charged for the execution time
V2 Scraper starts once, lambdas trigger each other
scraper  ----> dynamoDB: inserts lambda list & running status: true
scraper  ----> proxy 1  ----> Fresh NFTS API  --> proxy1 inserts in DBs
proxy1   ----> proxy 2  ----> Fresh NFTS API  --> proxy2 inserts in DBs
proxy2   ----> proxy 3  ----> Fresh NFTS API  --> proxy3 inserts in DBs
proxy3   ----> proxy 4  ----> Fresh NFTS API  --> proxy4 inserts in DBs
proxy4   ----> proxy 5  ----> Fresh NFTS API  --> proxy5 inserts in DBs
         .....
scrapper can stop proxy chain ----> dynamoDB: inserts running status: false

Maybe investigate:
V3 Scraper is started once, SQS triggers next invocations
scraper  ----> proxy 1  ----> Fresh NFTS API  --> proxy inserts in DBs -> SQS -> scraper
         ----> proxy 2  ----> Fresh NFTS API  --> proxy inserts in DBs -> SQS -> scraper
         ----> proxy 3  ----> Fresh NFTS API  --> proxy inserts in DBs -> SQS -> scraper
         ----> proxy 4  ----> Fresh NFTS API  --> proxy inserts in DBs -> SQS -> scraper
         ----> proxy 5  ----> Fresh NFTS API  --> proxy inserts in DBs -> SQS -> scraper
         .....
    

