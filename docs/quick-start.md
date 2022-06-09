# Todd Coin Quick Start

todo - add psql and or curl commands to view database/api effects

## Prerequisites

1. docker (version >= 20.10.12)
2. node (version >= v14.17.0)
3. jq (version >= jq-1.6)

Created and Tested on Mac.

## Let's Get Started

```
mkdir -p ~/.todd-coin/quick-start

export TODD_COIN_API_BASE_URL=http://localhost:3000

```

## Start the Todd Coin Data Base

```
docker run --name todd-coin-db \
    -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret \
    -v ~/.todd-coin/quick-start/pg-data:/var/lib/postgresql/data \
    -p 5432:5432 \
    -d docker.io/library/postgres:latest

docker logs -f todd-coin-db

```

Wait for "database system is ready to accept connections". Use ctrl-c to exit.

## Initialize the Todd Coin Database

```
docker run --rm --name todd-coin-tasks \
    -e OPERATION=INIT -e DB_HOST=host.docker.internal \
    docker.io/xilution/todd-coin-tasks:latest

```

## Set Up Task Aliases

```
alias todd-coin-validate="docker run --rm --name todd-coin-tasks  \
    -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest"

alias todd-coin-sync="docker run --rm --name todd-coin-tasks  \
    -e OPERATION=SYNC -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest"

alias todd-coin-mine="docker run --rm --name todd-coin-tasks  \
    -e OPERATION=MINE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest"

```

## Run Through the Todd Coin Tasks

```
todd-coin-validate

todd-coin-sync

todd-coin-validate

todd-coin-mine

todd-coin-validate

```

## Start the Todd Coin API

```
docker run --name todd-coin-api \
    -e DB_HOST=host.docker.internal \
    -p 3000:3000 \
    -d docker.io/xilution/todd-coin-api:latest

docker logs -f todd-coin-api

```

Wait for "Listening on 0.0.0.0:3000". Use ctrl-c to exit.

## Check Out the Todd Coin API

```
open $TODD_COIN_API_BASE_URL

```

check out the api root response

```
open $TODD_COIN_API_BASE_URL/documentation

```

check out the api documentation

```
open $TODD_COIN_API_BASE_URL/metrics

```

check out the api metrics (Prometheus ready)

## Install the Todd Coin CLI (Command Line Interface)

```
npm i -g @xilution/todd-coin-cli@latest

todd-coin --version

```

check out the todd-coin cli version

```
todd-coin --help

```

check out the todd-coin cli options

## Create an Educator (a Todd Coin Participant)

```
todd-coin create-participant \
    $TODD_COIN_API_BASE_URL \
    educator@example.com \
    secret \
    > ~/.todd-coin/quick-start/educator.json && cat ~/.todd-coin/quick-start/educator.json

export TODD_COIN_EDUCATOR_ID=`cat ~/.todd-coin/quick-start/educator.json | jq '.id' -r`

export TODD_COIN_EDUCATOR_KEY_ID=`cat ~/.todd-coin/quick-start/educator.json | jq '.keys | .[0] | .id' -r`

export TODD_COIN_EDUCATOR_PRIVATE_KEY=`cat ~/.todd-coin/quick-start/educator.json | jq '.keys | .[0] | .private' -r`

todd-coin get-access-token \
    $TODD_COIN_API_BASE_URL \
    educator@example.com \
    secret \
    > ~/.todd-coin/quick-start/charity-access-token.json && cat ~/.todd-coin/quick-start/charity-access-token.json

export TODD_COIN_EDUCATOR_ACCESS_TOKEN=`cat ~/.todd-coin/quick-start/charity-access-token.json | jq '.access' -r`

```

## Create the Carefree Elementary (a Todd Coin Organization)

```

todd-coin create-organization \
    $TODD_COIN_API_BASE_URL \
    $TODD_COIN_EDUCATOR_ACCESS_TOKEN \
    "Carefree Elementary" \
    > ~/.todd-coin/quick-start/carefree-elementary.json && cat ~/.todd-coin/quick-start/carefree-elementary.json

export TODD_COIN_CAREFREE_ELEMENTARY_ID=`cat ~/.todd-coin/quick-start/carefree-elementary.json | jq '.id' -r`

todd-coin add-participant-to-organization \
    $TODD_COIN_API_BASE_URL \
    $TODD_COIN_EDUCATOR_ACCESS_TOKEN \
    $TODD_COIN_EDUCATOR_ID \
    $TODD_COIN_CAREFREE_ELEMENTARY_ID

todd-coin add-authorized-signer-to-organization \
    $TODD_COIN_API_BASE_URL \
    $TODD_COIN_EDUCATOR_ACCESS_TOKEN \
    $TODD_COIN_EDUCATOR_ID \
    $TODD_COIN_CAREFREE_ELEMENTARY_ID

todd-coin add-administrator-to-organization \
    $TODD_COIN_API_BASE_URL \
    $TODD_COIN_EDUCATOR_ACCESS_TOKEN \
    $TODD_COIN_EDUCATOR_ID \
    $TODD_COIN_CAREFREE_ELEMENTARY_ID

```

## Create a Volunteer (Another Todd Coin Participant)

```
todd-coin create-participant \
    $TODD_COIN_API_BASE_URL \
    volunteer@example.com \
    secret \
    > ~/.todd-coin/quick-start/volunteer.json && cat ~/.todd-coin/quick-start/volunteer.json

export TODD_COIN_VOLUNTEER_ID=`cat ~/.todd-coin/quick-start/volunteer.json | jq '.id' -r`

todd-coin get-access-token \
    $TODD_COIN_API_BASE_URL \
    volunteer@example.com \
    secret \
    > ~/.todd-coin/quick-start/volunteer-access-token.json && cat ~/.todd-coin/quick-start/volunteer-access-token.json

export TODD_COIN_VOLUNTEER_ACCESS_TOKEN=`cat ~/.todd-coin/quick-start/volunteer-access-token.json | jq '.access' -r`

```

## Check Out all the Environment Variables You've Created

```
env | grep TODD_COIN

```

## Create a Pending Transaction

```
export TODD_COIN_FROM_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`;  \
    sleep 5;  \
    export TODD_COIN_TO_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`

todd-coin create-time-pending-tx \
    $TODD_COIN_API_BASE_URL \
    $TODD_COIN_VOLUNTEER_ACCESS_TOKEN \
    "judged spelling bee" \
    $TODD_COIN_EDUCATOR_ID \
    n/a \
    $TODD_COIN_VOLUNTEER_ID \
    n/a \
    $TODD_COIN_FROM_DATE \
    $TODD_COIN_TO_DATE \
    > ~/.todd-coin/quick-start/pending-tx-1.json && cat ~/.todd-coin/quick-start/pending-tx-1.json

export TODD_COIN_PENDING_TRANSACTION_1_ID=`cat ~/.todd-coin/quick-start/pending-tx-1.json | jq '.id' -r`

```

## Quick Validation

```
todd-coin-validate

```

## Create a Signed Transaction

```
todd-coin sign-pending-tx \
    $TODD_COIN_API_BASE_URL \
    $TODD_COIN_EDUCATOR_ACCESS_TOKEN \
    10 \
    $TODD_COIN_EDUCATOR_ID \
    $TODD_COIN_EDUCATOR_KEY_ID \
    $TODD_COIN_EDUCATOR_PRIVATE_KEY \
    $TODD_COIN_PENDING_TRANSACTION_1_ID \
    > ~/.todd-coin/quick-start/signed-tx-1.json && cat ~/.todd-coin/quick-start/signed-tx-1.json

export TODD_COIN_SIGNED_TRANSACTION_1_ID=`cat ~/.todd-coin/quick-start/signed-tx-1.json | jq '.id' -r`

```

## Update the Signed Transaction

```
todd-coin update-signed-tx \
    $TODD_COIN_API_BASE_URL \
    $TODD_COIN_EDUCATOR_ACCESS_TOKEN \
    15 \
    $TODD_COIN_EDUCATOR_ID \
    $TODD_COIN_EDUCATOR_KEY_ID \
    $TODD_COIN_EDUCATOR_PRIVATE_KEY \
    $TODD_COIN_PENDING_TRANSACTION_1_ID

```

# Run Through the Todd Coin Tasks

```
todd-coin-validate

todd-coin-mine

todd-coin-validate

todd-coin-sync

todd-coin-validate

```

## Clean Up

```
unalias todd-coin-validate

unalias todd-coin-sync

unalias todd-coin-mine

docker stop todd-coin-db todd-coin-api

docker rm todd-coin-db todd-coin-api

rm -rf ~/.todd-coin/quick-start

```
