# WaveAuth
This is the authentication tool used by the MCPE Wave client. This handles and validates all sessions.

The admin template is using [Argon](https://www.creative-tim.com/product/argon-dashboard).

## Requirements:
- MySQL or MariaDB 8
- NodeJS

## TODO:
- Make account page (maybe)
- Make admin dashboard

## Installation:
1. Change the credentials in db.js to your actual database.
2. Run setup.sql
3. Run npm install
4. Run node app.js in tmux or something similar.

REMEMBER THAT THE PORT IT IS ATTACHED TO MUST BE OPENED

## Tips:
I advise you to run this behind a nginx/apache reverse proxy so you can do requests directly to a subdomain instead of an ip with a port and that you set some kind of request per ip limit so that ddos attacks don't work.

# API Usage:
NOTE: All POST requests listed here use x-www-form-urlencoded and return JSON. 
If you can't be bothered with understanding the following examples you can always checkout our [Postman collection](https://www.getpostman.com/collections/2aebe554d5cf4e3a407a):

## Session API:

### /api/session/create [POST]
**Description:** Create a session in our database.

**Fields:**
- username: The users' username. Example: Todoe56
- password: The users' password. Example: 1234567890
- deviceId: The device id. Example: 
- deviceName: The device name. Example: DESKTOP-30KON23

**Example Response:**
```json
{
    "status": 200,
    "message": "Your session for DESKTOP-30KON23 has been created and activated! It will last 30 days.",
    "token": "xmujmgrb89wa7cgt05az4tco2xm3rteivpenk7xmmdkh5a4d59"
}
```

```json
{
    "status": 200,
    "message": "Token for this device already found.",
    "token": "g90a656ajug1safyk047vwezb2gsay2gyyhemkmkn0hyerw4q2"
}
```
The token value must be stored as it's used to validate and destroy the session.

**Example Error:**
```json
{
    "status": 401,
    "message": "Incorrect username."
}
```
&nbsp;

&nbsp;

&nbsp;
### /api/session/validate [POST]
**Description:** Validate a session using the token

**Fields:**
- username: The users' username. Example: Todoe56
- token: The session's token that we previously got. Example: xmujmgrb89wa7cgt05az4tco2xm3rteivpenk7xmmdkh5a4d59
- deviceId: The device id. Example:

**Example Response:**
```json
{
  "status": 200,
  "valid": true,
  "message": "All good, go ahead."
}
```

**Example Error:**
```json
{
  "status": 400,
  "valid": false,
  "message": "Invalid Session."
}
```
&nbsp;

&nbsp;

&nbsp;
### /api/session/destroy [POST]
**Description:** Destroy a session, can be used to logout.

**Fields:**
- username: The users' username. Example: Todoe56
- token: The session's token that we previously got. Example: xmujmgrb89wa7cgt05az4tco2xm3rteivpenk7xmmdkh5a4d59
- deviceId: The device id. Example:

**Example Response:**
```json
{
  "status": 200,
  "message": "The session has been destroyed successfully."
}
```

**Example Error:**
```json
{
  "status": 400,
  "message": "Invalid Session."
}
```
&nbsp;

&nbsp;

&nbsp;

## Users API:

### /api/users/:id?t= [GET]
**Description:** Get a user's information.

**Fields:**
- id: It can be either the user's id or a token of one of their sessions. Example: 1. Example: f9az9592ny0eink4al2k3ktzt7p9ekcd8o9ixm7jq0gae0qn8d.

**Query:**
- t: Type of id provided, either "id" or "token".

**Example Response:**
```json
{
  "status": 200,
  "message": "All good.",
  "data": {
    "id": 1,
    "username": "Todo56",
    "max_sessions": 3,
    "enabled": true,
    "permission": 1,
    "active_sessions": [
      {
        "session_id": 1,
        "user_id": 1,
        "token": "f9az9592ny0eink4al2k3ktzt7p9ekcd8o9ixm7jq0gae0qn8d",
        "created_at": "1608721957321",
        "valid_until": "1611313957321",
        "device_id": "10319874872349079",
        "device_name": "DESKTOP-30KON23",
        "enabled": 1
      },
      {
        "session_id": 4,
        "user_id": 1,
        "token": "xlyodc1dk08sce7qmpdb09czze5h3krodiq3byy597fz05qcss",
        "created_at": "1608724702994",
        "valid_until": "1611316702994",
        "device_id": "10319874872349079",
        "device_name": "DESKTOP-30KON23",
        "enabled": 1
      }
    ],
    "created_at": "1608727642000"
  }
}
```

**Example Error:**
```json
{
  "status": 400,
  "message": "Invalid Session."
}
```
&nbsp;

&nbsp;

&nbsp;
### /api/downloads/beta [GET]
**Description:** Download the beta version of the client.

**Header:**
- auth: Must be a session token. Example: f9az9592ny0eink4al2k3ktzt7p9ekcd8o9ixm7jq0gae0qn8d.

**Example Response:**
Just downloads a file called Beta.dll

**Example Error:**
```json
{
  "status": 400,
  "message":"Invalid Session."
}
```
