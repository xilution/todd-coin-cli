1. export TODD_COIN_API_BASE_URL=http://localhost:3000
2. docker run --name postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -v ~/.todd-coin/pg-data:/var/lib/postgresql/data -d postgres
3. docker run --name todd-coin-tasks -e OPERATION=INIT xilution/todd-coin-tasks
4. docker run --name todd-coin-tasks -e OPERATION=SYNC xilution/todd-coin-tasks
5. docker run --name todd-coin-api -d xilution/todd-coin-api
6. mkdir -p ~/.todd-coin/quick-start
7. todd-coin create-participant $TODD_COIN_API_BASE_URL tbrunia20@gmail.com secret > ~/.todd-coin/quick-start/participant-1.json && cat ~/.todd-coin/quick-start/participant-1.json
8. export TODD_COIN_PARTICIPANT_1_ID=`cat ~/.todd-coin/quick-start/participant-1.json | jq '.id' -r`
9. export TODD_COIN_PARTICIPANT_1_PRIVATE_KEY=`cat ~/.todd-coin/quick-start/participant-1.json | jq '.keys | .[0] | .private' -r`
10. todd-coin create-participant $TODD_COIN_API_BASE_URL tbrunia21@gmail.com secret > ~/.todd-coin/quick-start/participant-2.json && cat ~/.todd-coin/quick-start/participant-2.json
11. export TODD_COIN_PARTICIPANT_2_ID=`cat ~/.todd-coin/quick-start/participant-2.json | jq '.id' -r`
12. todd-coin get-access-token $TODD_COIN_API_BASE_URL tbrunia6@gmail.com secret > ~/.todd-coin/quick-start/access-token.json && cat ~/.todd-coin/quick-start/access-token.json
13. export TODD_COIN_ACCESS_TOKEN=`cat ~/.todd-coin/quick-start/access-token.json | jq '.access' -r`
14. export TODD_COIN_FROM_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`
15. export TODD_COIN_TO_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`
16. env | grep TODD_COIN
17. todd-coin create-pending-transaction $TODD_COIN_API_BASE_URL $TODD_COIN_ACCESS_TOKEN "just cause" $TODD_COIN_PARTICIPANT_1_ID $TODD_COIN_PARTICIPANT_1_ID $TODD_COIN_FROM_DATE $TODD_COIN_TO_DATE > ~/.todd-coin/quick-start/pending-transaction-1.json && cat ~/.todd-coin/quick-start/pending-transaction-1.json
18. export TODD_COIN_PENDING_TRANSACTION_1_ID=`cat ~/.todd-coin/quick-start/pending-transaction-1.json | jq '.id' -r`
19. todd-coin sign-pending-transaction $TODD_COIN_API_BASE_URL $TODD_COIN_ACCESS_TOKEN 10 $TODD_COIN_PARTICIPANT_1_PRIVATE_KEY $TODD_COIN_PENDING_TRANSACTION_1_ID > ~/.todd-coin/quick-start/signed-transaction-1.json && cat ~/.todd-coin/quick-start/signed-transaction-1.json
20. docker run -e OPERATION=MINE xilution/todd-coin-tasks
21. docker run -e OPERATION=SYNC xilution/todd-coin-tasks
22. rm -rf ~/.todd-coin/quick-start
23. docker stop postgres todd-coin-api

participant 1 is a member of a charity
participant 2 is a volunteer

in the mobile app, when a volunteer creates a pending transaction, they should be able to look up a participant by their email address
the volunteer can create an unclaimed participant with the email address
the todd-coin api or the tasks will email the owner of the account inviting them to activate their account and sign the transaction
