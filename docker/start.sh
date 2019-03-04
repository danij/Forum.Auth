#!/bin/sh

export AUTH_COOKIE_SIZE="32"
export AUTH_SECONDS="600"
export AUTH_REGISTER_URL="http://127.0.0.1:18081/"
export DOUBLE_SUBMIT_COOKIE_SIZE="32"
export PREFIX="while(1);"
export TRUST_FORWARDED_IP="true" #only when the service is only exposed behind a reverse proxy
export EXPECTED_ORIGIN="https://dani.forum"
export SECURE_COOKIES="true" #true if using HTTPS, false if using HTTP for testing

export PGHOST="127.0.0.1"
export PGUSER="auth user"
export PGPASSWORD="password"
export PGDATABASE="auth database"
export ENABLE_CUSTOM_AUTH="true"
export PASSWORD_MIN_LENGTH="8"
export EMAIL_SMTP="smtp server"
export EMAIL_PORT="587"
export EMAIL_SECURE="true"
export EMAIL_USER="username"
export EMAIL_PASSWORD="password"
export EMAIL_FROM_NAME="Forum Account Registration"
export EMAIL_FROM_EMAIL="email address"
export REGISTER_MIN_AGE="18"
export REGISTER_AUTH_SIZE="32"
export REGISTER_CONFIRMATION_SIZE="32"
export REGISTER_CONFIRMATION_TITLE="Forum Registration Confirmation"
export REGISTER_CONFIRMATION_URL="https://dani.forum/auth/custom/confirm"
export REGISTER_CONFIRMATION_REDIRECT_URL="https://dani.forum"
export REGISTER_TIMEOUT_SECONDS="600"
export REGISTER_CUSTOM_AUTH_THROTTLING="30" #only allow registration calls every n seconds/IP
export LOGIN_CUSTOM_AUTH_THROTTLING="5" #only allow login calls every n seconds/IP
export CHANGE_PASSWORD_CUSTOM_AUTH_THROTTLING="5" #only allow change password calls every n seconds/IP
export RESET_PASSWORD_CUSTOM_AUTH_THROTTLING="5" #only allow reset password calls every n seconds/IP
export RESET_PASSWORD_CONFIRMATION_TITLE="Forum Reset Password Confirmation"
export RESET_PASSWORD_CONFIRMATION_URL="https://dani.forum/auth/custom/confirm_reset_password"
export RESET_PASSWORD_TIMEOUT_SECONDS="600"
export RESET_PASSWORD_NEW_PASSWORD_SIZE="16"
export PASSWORD_CHANGE_NOTIFICATION_TITLE="Forum Password Change Notification"
export RECAPTCHA_SECRET_KEY="from the reCAPTCHA admin page" #to prevent robots from registering accounts

node bin/www > forum-auth.log