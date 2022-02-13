#!/bin/bash

cd $PWD

FILE=./proxy-urls.txt

if [ -s "$FILE" ]; then
    echo "\nOK: Environment variables file: $FILE exists and is not empty.\n"

    echo PROXY_DATA_URLS=$(awk -v RS='' '{gsub("\n", ","); print}' $FILE) > .env
    echo "Filled .env with the required values.\n"

    sls deploy
else 
    echo "\nError"
    echo "$FILE does not exist or is empty!"
    echo "\nTo recreate the file, run command:"
    echo "cd ../proxy && sh ./detail.sh && cd ../scrape"
    echo "\nThen retry this script."
    exit 1
fi

exit 0
