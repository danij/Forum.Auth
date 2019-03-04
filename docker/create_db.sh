psql -c "CREATE ROLE forumauth WITH LOGIN PASSWORD '1234';"
psql -c "CREATE DATABASE forum_auth WITH OWNER = forumauth ENCODING 'UTF8';"
psql "dbname='forum_auth' user='forumauth' password='1234' host='127.0.0.1'" -f /forum/repos/Forum.Auth/tables.sql
