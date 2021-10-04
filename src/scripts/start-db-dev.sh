#!/bin/bash
set -e

SERVER="http_pub_sub_db_server";
PW="mysecretpassword";
DB="http_pub_sub_db";


# Uncomment this after first run
# echo "starting container in case it's not up"
# docker start http_pub_sub_db_server

# Comment this out after first run
echo "echo starting new fresh instance of [$SERVER]"
  docker run --name $SERVER -e POSTGRES_PASSWORD=$PW \
  -e PGPASSWORD=$PW \
  -p 5432:5432 \
  -d postgres

# To have a clean slate use run remove-db--test-server.sh with the db and server variable values for dev  in lines 4 - 6 here

# wait for pg to start
echo "sleep wait for pg-server [$SERVER] to start";
sleep 3;

# create the db 
# echo "CREATE DATABASE $DB ENCODING 'UTF-8';" | docker exec -i $SERVER psql -U postgres
# echo "\l" | docker exec -i $SERVER psql -U postgres