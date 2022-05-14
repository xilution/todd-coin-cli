1. mkdir -p ~/.todd-coin/quick-start
2. docker run --name todd-coin-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -v ~/.todd-coin/quick-start/pg-data:/var/lib/postgresql/data -p 5432:5432 -d docker.io/library/postgres:latest
3. docker logs -f todd-coin-db
   1. wait for "database system is ready to accept connections"
   2. ctrl-c to exit
4. docker run --rm --name todd-coin-tasks -e OPERATION=INIT -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
5. docker run --rm --name todd-coin-tasks -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
6. docker run --rm --name todd-coin-tasks -e OPERATION=SYNC -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
7. docker run --rm --name todd-coin-tasks -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
8. docker run --rm --name todd-coin-tasks -e OPERATION=MINE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest

9. docker run --name todd-coin-api -e DB_HOST=host.docker.internal -p 3000:3000 -d docker.io/xilution/todd-coin-api:latest
10. docker logs -f todd-coin-api
    1. wait for "Listening on 0.0.0.0:3000"
    2. ctrl-c to exit
11. export TODD_COIN_API_BASE_URL=http://localhost:3000
12. open $TODD_COIN_API_BASE_URL
    1. check out the api root response
13. open $TODD_COIN_API_BASE_URL/documentation
    1. check out the api documentation
14. open $TODD_COIN_API_BASE_URL/metrics

    1. check out the api metrics (Prometheus ready)

15. npm i -g @xilution/todd-coin-cli@latest

## Educator

16. todd-coin create-participant $TODD_COIN_API_BASE_URL educator@example.com secret > ~/.todd-coin/quick-start/educator.json && cat ~/.todd-coin/quick-start/educator.json
17. export TODD_COIN_EDUCATOR_ID=`cat ~/.todd-coin/quick-start/educator.json | jq '.id' -r`
18. export TODD_COIN_EDUCATOR_KEY_ID=`cat ~/.todd-coin/quick-start/educator.json | jq '.keys | .[0] | .id' -r`
19. export TODD_COIN_EDUCATOR_PRIVATE_KEY=`cat ~/.todd-coin/quick-start/educator.json | jq '.keys | .[0] | .private' -r`
20. todd-coin get-access-token $TODD_COIN_API_BASE_URL educator@example.com secret > ~/.todd-coin/quick-start/charity-access-token.json && cat ~/.todd-coin/quick-start/charity-access-token.json
21. export TODD_COIN_EDUCATOR_ACCESS_TOKEN=`cat ~/.todd-coin/quick-start/charity-access-token.json | jq '.access' -r`

## Carefree Elementary

22. todd-coin create-organization $TODD_COIN_API_BASE_URL $TODD_COIN_EDUCATOR_ACCESS_TOKEN "Carefree Elementary" > ~/.todd-coin/quick-start/carefree-elementary.json && cat ~/.todd-coin/quick-start/carefree-elementary.json
23. export TODD_COIN_CAREFREE_ELEMENTARY_ID=`cat ~/.todd-coin/quick-start/carefree-elementary.json | jq '.id' -r`
24. todd-coin add-participant-to-organization $TODD_COIN_API_BASE_URL $TODD_COIN_EDUCATOR_ACCESS_TOKEN $TODD_COIN_EDUCATOR_ID $TODD_COIN_CAREFREE_ELEMENTARY_ID
25. todd-coin add-authorized-signer-to-organization $TODD_COIN_API_BASE_URL $TODD_COIN_EDUCATOR_ACCESS_TOKEN $TODD_COIN_EDUCATOR_ID $TODD_COIN_CAREFREE_ELEMENTARY_ID
26. todd-coin add-administrator-to-organization $TODD_COIN_API_BASE_URL $TODD_COIN_EDUCATOR_ACCESS_TOKEN $TODD_COIN_EDUCATOR_ID $TODD_COIN_CAREFREE_ELEMENTARY_ID

## Volunteer

27. todd-coin create-participant $TODD_COIN_API_BASE_URL volunteer@example.com secret > ~/.todd-coin/quick-start/volunteer.json && cat ~/.todd-coin/quick-start/volunteer.json
28. export TODD_COIN_VOLUNTEER_ID=`cat ~/.todd-coin/quick-start/volunteer.json | jq '.id' -r`
29. todd-coin get-access-token $TODD_COIN_API_BASE_URL volunteer@example.com secret > ~/.todd-coin/quick-start/volunteer-access-token.json && cat ~/.todd-coin/quick-start/volunteer-access-token.json
30. export TODD_COIN_VOLUNTEER_ACCESS_TOKEN=`cat ~/.todd-coin/quick-start/volunteer-access-token.json | jq '.access' -r`

31. env | grep TODD_COIN

32. export TODD_COIN_FROM_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"` ; sleep 5 ; export TODD_COIN_TO_DATE=`date -u +"%Y-%m-%dT%H:%M:%SZ"`
33. todd-coin create-time-pending-tx $TODD_COIN_API_BASE_URL $TODD_COIN_VOLUNTEER_ACCESS_TOKEN "judged spelling bee" $TODD_COIN_EDUCATOR_ID n/a $TODD_COIN_VOLUNTEER_ID n/a $TODD_COIN_FROM_DATE $TODD_COIN_TO_DATE > ~/.todd-coin/quick-start/pending-tx-1.json && cat ~/.todd-coin/quick-start/pending-tx-1.json
34. export TODD_COIN_PENDING_TRANSACTION_1_ID=`cat ~/.todd-coin/quick-start/pending-tx-1.json | jq '.id' -r`
35. docker run --rm --name todd-coin-tasks -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
36. todd-coin sign-pending-tx $TODD_COIN_API_BASE_URL $TODD_COIN_EDUCATOR_ACCESS_TOKEN 10 $TODD_COIN_EDUCATOR_ID $TODD_COIN_EDUCATOR_KEY_ID $TODD_COIN_EDUCATOR_PRIVATE_KEY $TODD_COIN_PENDING_TRANSACTION_1_ID > ~/.todd-coin/quick-start/signed-tx-1.json && cat ~/.todd-coin/quick-start/signed-tx-1.json
37. export TODD_COIN_SIGNED_TRANSACTION_1_ID=`cat ~/.todd-coin/quick-start/signed-tx-1.json | jq '.id' -r`
38. todd-coin update-signed-tx $TODD_COIN_API_BASE_URL $TODD_COIN_EDUCATOR_ACCESS_TOKEN 15 $TODD_COIN_EDUCATOR_ID $TODD_COIN_EDUCATOR_KEY_ID $TODD_COIN_EDUCATOR_PRIVATE_KEY $TODD_COIN_PENDING_TRANSACTION_1_ID > ~/.todd-coin/quick-start/signed-tx-1.json && cat ~/.todd-coin/quick-start/signed-tx-1.json

39. docker run --rm --name todd-coin-tasks -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
40. docker run --rm --name todd-coin-tasks -e OPERATION=MINE -e MINER_PARTICIPANT_ID=$TODD_COIN_EDUCATOR_ID -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
41. docker run --rm --name todd-coin-tasks -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
42. docker run --rm --name todd-coin-tasks -e OPERATION=SYNC -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
43. docker run --rm --name todd-coin-tasks -e OPERATION=VALIDATE -e DB_HOST=host.docker.internal docker.io/xilution/todd-coin-tasks:latest
44. docker stop todd-coin-db todd-coin-api
45. docker rm todd-coin-db todd-coin-api
46. rm -rf ~/.todd-coin/quick-start

participant 1 is a teacher at Carefree Elementary
participant 2 is a volunteer

need to create a node, an organization, an org/participant reference,

in the mobile app, when a volunteer creates a pending transaction, they should be able to look up a participant by their email address
the volunteer can create an unclaimed participant with the email address
the todd-coin api or the tasks will email the owner of the account inviting them to activate their account and sign the transaction
