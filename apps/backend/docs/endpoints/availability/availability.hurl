# Namefi Astra Availability API - Hurl

# Variables
# Use environment variables when invoking hurl, e.g.:
#   AVAILABILITY_API_AUTH_KEY=... BASE_URL=http://localhost:3001 hurl apps/backend/requests/availability.hurl
# Defaults (can be overridden by env when running hurl)

# Set defaults using Hurl 'Set-Variable' syntax
# Note: These are only used if not provided by environment

# Base URL
{%-
  set base_url = env["BASE_URL"] if env["BASE_URL"] else "http://localhost:3001"
-%}

# Authorization token (optional)
{%-
  set auth_token = env["AVAILABILITY_API_AUTH_KEY"] if env["AVAILABILITY_API_AUTH_KEY"] else ""
-%}

# Domain to test
{%-
  set domain = env["TEST_DOMAIN"] if env["TEST_DOMAIN"] else "available.today"
-%}

# GET single domain availability (with Authorization if provided)
GET {{ base_url }}/v1/availability?domain={{ domain }}
Authorization: Bearer {{ auth_token }}
Accept: application/json

HTTP 200, 400, 401, 429

# GET single domain availability (no Authorization)
GET {{ base_url }}/v1/availability?domain={{ domain }}
Accept: application/json

HTTP 200, 400, 429

# POST bulk domain availability
POST {{ base_url }}/v1/availability/bulk
Authorization: Bearer {{ auth_token }}
Content-Type: application/json
Accept: application/json

{
  "domains": [
    "available.today",
    "ends.today",
    "promos.today"
  ]
}

HTTP 200, 400, 401, 429
