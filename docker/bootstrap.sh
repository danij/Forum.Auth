#!/bin/bash
HOSTNAME="$1"

mkdir /forum/config/Forum.Auth
mkdir /forum/data/sqldb
mkdir /forum/logs/sqldb
mkdir /forum/logs/Forum.Auth
chown postgres /forum/data/sqldb
chown postgres /forum/logs/sqldb

su -c '/usr/lib/postgresql/10/bin/initdb -D /forum/data/sqldb -E utf8' postgres
su -c '/usr/lib/postgresql/10/bin/pg_ctl -D /forum/data/sqldb -l /forum/logs/sqldb/logfile start' postgres

cp /forum/repos/Forum.Auth/docker/create_db_auth.sh /tmp/create_db_auth.sh
chmod +x /tmp/create_db_auth.sh
su -c '/tmp/create_db_auth.sh' postgres

cp /forum/repos/Forum.Auth/docker/start.sh /forum/start/Forum.Auth.sh
chmod +x /forum/start/Forum.Auth.sh

sed -i 's#bin/www#/forum/repos/Forum.Auth/bin/www#' /forum/start/Forum.Auth.sh
sed -i 's#forum-auth.log#/forum/logs/Forum.Auth/forum-auth.log#' /forum/start/Forum.Auth.sh
sed -i 's#PGUSER="auth user"#PGUSER="forumauth"#' /forum/start/Forum.Auth.sh
sed -i 's#PGPASSWORD="password"#PGPASSWORD="1234"#' /forum/start/Forum.Auth.sh
sed -i 's#PGDATABASE="auth database"#PGDATABASE="forum_auth"#' /forum/start/Forum.Auth.sh
sed -i "s#dani.forum#$HOSTNAME#" /forum/start/Forum.Auth.sh

cp /forum/repos/Forum.Auth/change_password_notification.html /forum/config/Forum.Auth
rm /forum/repos/Forum.Auth/change_password_notification.html
ln -s /forum/config/Forum.Auth/change_password_notification.html /forum/repos/Forum.Auth/change_password_notification.html
cp /forum/repos/Forum.Auth/register_confirmation_template.html /forum/config/Forum.Auth
rm /forum/repos/Forum.Auth/register_confirmation_template.html
ln -s /forum/config/Forum.Auth/register_confirmation_template.html /forum/repos/Forum.Auth/register_confirmation_template.html
cp /forum/repos/Forum.Auth/reset_password_confirmation_template.html /forum/config/Forum.Auth
rm /forum/repos/Forum.Auth/reset_password_confirmation_template.html
ln -s /forum/config/Forum.Auth/reset_password_confirmation_template.html /forum/repos/Forum.Auth/reset_password_confirmation_template.html
