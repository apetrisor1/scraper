#!/bin/bash

cd $PWD

FILE=./proxy-urls.txt

if [ -s "$FILE" ]; then
    echo "\nOK: Environment variables file: $FILE exists and is not empty.\n"

    echo \\nPROXY_DATA_URLS=$(awk -v RS='' '{gsub("\n", ","); print}' $FILE) >> .env
    echo "Filled .env with the required values.\n"

    # Deploy is done in this step
    ENDPOINT=$(sls deploy | grep endpoint | sed 's/endpoint: ANY - //g')

    echo "\nUsage:\nPOST $ENDPOINT/start to prepare the scrapper"
    echo "\nSet up a cronjob to hit $ENDPOINT/ to run the scrapper on a loop."
    echo "\nPOST $ENDPOINT/stop to stop the scrapper.\n"
else 
    echo "\nError"
    echo "$FILE does not exist or is empty!"
    echo "\nTo recreate the file, run command:"
    echo "cd ../proxy && sh ./detail.sh && cd ../entry"
    echo "\nThen retry this script."
    exit 1
fi

exit 0
