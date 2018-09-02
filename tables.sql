CREATE TABLE logins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(128) UNIQUE NOT NULL,
    email_alphanumeric VARCHAR(128) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    password_details VARCHAR(255) NOT NULL,
    auth VARCHAR(128) UNIQUE NOT NULL,
    min_age_at_registration INT NOT NULL,
    created TIMESTAMPTZ DEFAULT now(),
    enabled BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE login_confirmations (
    
    id VARCHAR(128) PRIMARY KEY,
    login_id INT NOT NULL REFERENCES logins(id) ON UPDATE CASCADE ON DELETE CASCADE,
    expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE domain_blacklist (
    domain VARCHAR(128) PRIMARY KEY
);
