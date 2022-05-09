1. export TODD_COIN_API_BASE_URL=http://localhost:3000
2. docker run --name todd-coin-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -v ~/.todd-coin/pg-data:/var/lib/postgresql/data -p 5432:5432 -d docker.io/library/postgres:latest
3. docker logs -f todd-coin-db
   1. wait for "database system is ready to accept connections"
   2. ctrl-c to exit
4. docker run --rm --name todd-coin-tasks -e OPERATION=INIT -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
5. docker run --rm --name todd-coin-tasks -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
6. docker run --rm --name todd-coin-tasks -e OPERATION=SYNC -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
7. docker run --rm --name todd-coin-tasks -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
8. docker run --name todd-coin-api -e DB_HOST=host.docker.internal -p 3000:3000 -d docker.io/xilution/todd-coin-api:latest
9. open http://localhost:3000/documentation
10. docker logs -f todd-coin-api
    1. wait for "Listening on 0.0.0.0:3000"
    2. ctrl-c to exit
11. mkdir -p ~/.todd-coin/quick-start
12. npm i -g @xilution/todd-coin-cli@latest
13. todd-coin create-participant $TODD_COIN_API_BASE_URL jdoe1@example.com secret > ~/.todd-coin/quick-start/participant-1.json && cat ~/.todd-coin/quick-start/participant-1.json
14. export TODD_COIN_PARTICIPANT_1_ID=`cat ~/.todd-coin/quick-start/participant-1.json | jq '.id' -r`
15. export TODD_COIN_PARTICIPANT_1_KEY_ID=`cat ~/.todd-coin/quick-start/participant-1.json | jq '.keys | .[0] | .id' -r`
16. export TODD_COIN_PARTICIPANT_1_PRIVATE_KEY=`cat ~/.todd-coin/quick-start/participant-1.json | jq '.keys | .[0] | .private' -r`
17. todd-coin create-participant $TODD_COIN_API_BASE_URL jdoe2@example.com secret > ~/.todd-coin/quick-start/participant-2.json && cat ~/.todd-coin/quick-start/participant-2.json
18. export TODD_COIN_PARTICIPANT_2_ID=`cat ~/.todd-coin/quick-start/participant-2.json | jq '.id' -r`
19. todd-coin get-access-token $TODD_COIN_API_BASE_URL jdoe1@example.com secret > ~/.todd-coin/quick-start/access-token.json && cat ~/.todd-coin/quick-start/access-token.json
20. export TODD_COIN_ACCESS_TOKEN=`cat ~/.todd-coin/quick-start/access-token.json | jq '.access' -r`
21. export TODD_COIN_FROM_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`
22. export TODD_COIN_TO_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`
23. env | grep TODD_COIN
24. todd-coin create-pending-transaction $TODD_COIN_API_BASE_URL $TODD_COIN_ACCESS_TOKEN "just cause" $TODD_COIN_PARTICIPANT_1_ID $TODD_COIN_PARTICIPANT_1_ID $TODD_COIN_FROM_DATE $TODD_COIN_TO_DATE > ~/.todd-coin/quick-start/pending-transaction-1.json && cat ~/.todd-coin/quick-start/pending-transaction-1.json
25. export TODD_COIN_PENDING_TRANSACTION_1_ID=`cat ~/.todd-coin/quick-start/pending-transaction-1.json | jq '.id' -r`
26. docker run --rm --name todd-coin-tasks -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
27. todd-coin sign-pending-transaction $TODD_COIN_API_BASE_URL $TODD_COIN_ACCESS_TOKEN 10 $TODD_COIN_PARTICIPANT_1_ID $TODD_COIN_PARTICIPANT_1_KEY_ID $TODD_COIN_PARTICIPANT_1_PRIVATE_KEY $TODD_COIN_PENDING_TRANSACTION_1_ID > ~/.todd-coin/quick-start/signed-transaction-1.json && cat ~/.todd-coin/quick-start/signed-transaction-1.json
28. docker run --rm --name todd-coin-tasks -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
29. docker run --rm --name todd-coin-tasks -e OPERATION=MINE -e MINER_PARTICIPANT_ID=$TODD_COIN_PARTICIPANT_1_ID -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
30. docker run --rm --name todd-coin-tasks -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
31. docker run --rm --name todd-coin-tasks -e OPERATION=SYNC -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
32. docker run --rm --name todd-coin-tasks -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
33. docker stop todd-coin-db todd-coin-api
34. docker rm todd-coin-db todd-coin-api
35. rm -rf ~/.todd-coin/quick-start ~/.todd-coin/pg-data

participant 1 is a member of a charity
participant 2 is a volunteer

need to create a node, an organization, an org/participant reference,

in the mobile app, when a volunteer creates a pending transaction, they should be able to look up a participant by their email address
the volunteer can create an unclaimed participant with the email address
the todd-coin api or the tasks will email the owner of the account inviting them to activate their account and sign the transaction
