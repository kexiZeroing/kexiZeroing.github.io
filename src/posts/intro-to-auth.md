---
layout: "../layouts/BlogPost.astro"
title: "Intro to Authorization and Authentication"
slug: intro-to-auth
description: ""
added: "Nov 28 2022"
tags: [web]
updatedDate: "Feb 17 2023"
---

> This post is my learning notes from the article [Authorization and Authentication for Everyone](https://maida.kim/2020/07/authorization-and-authentication-for-everyone) wrote by @KimMaida.

In a broad sense, authentication refers to the process of verifying that a user is who they say they are. Authorization deals with granting or denying rights to access resources.

### Before OAuth
Let’s say you used an app called HireMe123. HireMe123 wants to set up a calendar event on the user’s behalf. HireMe123 doesn’t have its own calendar; it wants to use another service called MyCalApp to add events.

Once you were logged into HireMe123, HireMe123 would ask you for your MyCalApp login credentials. You would enter your MyCalApp username and password into HireMe123’s site. HireMe123 then used your MyCalApp login to gain access to MyCalApp’s API, and could then create calendar events using your MyCalApp credentials.

This approach relied on sharing a user’s personal credentials from one app with a completely different app, and this is not good. HireMe123 had the same amount of access that you did, because they used your credentials to gain that access. It meant that HireMe123 could read all your calendar events, delete events, modify your calendar settings, etc.

### Enter OAuth
OAuth is not an authentication spec. OAuth deals with delegated authorization. Remember that authentication is about verifying the identity of a user. Authorization deals with granting or denying access to resources. OAuth 2.0 grants access to applications on the behalf of users without exposing credentials.

An authorization server is a set of endpoints to interact with the user and issue tokens, which can limit access to its API when called by third party clients without the risks of sharing login information or providing too much access.

Let’s assume you’re already logged in with HireMe123 through whatever authentication HireMe123 has set up for itself. HireMe123 now wants to create events on your behalf. MyCalApp now has an authorization server. Let’s also assume that HireMe123 has already registered as a known client with MyCalApp, which means that MyCalApp’s authorization server recognizes HireMe123 as an entity that may ask for access to its API. HireMe123 sends an authorization request to MyCalApp’s authorization server. In response, MyCalApp’s authorization server prompts you — the user — to log in with MyCalApp. You authenticate with MyCalApp.

The MyCalApp authorization server then prompts you for your consent to allow HireMe123 to access MyCalApp’s APIs on your behalf, specifically let HireMe123 add calendar events (but no more than that). If you say yes and grant your consent, then the MyCalApp authorization server will send an authorization code to HireMe123. Now, we need to turn the code into an access token by having the server make a request to the token endpoint. MyCalApp will then issue an access token to HireMe123. HireMe123 can use that access token to call the MyCalApp API within the scope of permissions that were accepted by you and create events for you.

### The Login Problem
At this point, I hope it’s been made clear that OAuth is for delegated access. It doesn’t cover authentication. So why are authentication and OAuth so often mentioned in the same breath?

The thing that happened after OAuth 2.0 established a way to access third party APIs was that apps also wanted to log users in with other accounts. Let’s say HireMe123 wanted a MyCalApp user to be able to log into HireMe123 using their MyCalApp account, despite not having signed up for a HireMe123 account.

If HireMe123 assumes successfully calling MyCalApp’s API with an access token means the user can be considered authenticated with HireMe123, we run into problems because we have no way to verify the access token was issued to a particular individual.
- Someone could have stolen the access token from a different user.
- The access token could have been obtained from another client (not HireMe123) and injected into HireMe123.

It quickly became evident that formalization of authentication on top of OAuth 2.0 was necessary to allow logins with third party applications while keeping apps and their users safe.

### OpenID Connect
This brings us to the specification called OpenID Connect, or OIDC, which is on top of OAuth 2.0 that says how to authenticate users.

OIDC is an identity layer for authenticating users with an authorization server. Remember that an authorization server issues tokens. Tokens are encoded pieces of data for transmitting information between parties. In the case of OIDC and authentication, the authorization server issues ID tokens.

ID tokens provide information about the authentication event and they identify the user. ID tokens are intended for the client. They’re a fixed format that the client can parse and validate to extract identity information from the token and thereby authenticate the user. **OIDC declares a fixed format for ID tokens, which is JSON Web Token (JWT)**. It is composed of three URL-safe string segments concatenated with periods `.`:

- The first segment is the header segment, containing a signing algorithm and token type.
- The second segment is the payload segment, containing data claims, which are statements about the user and the authentication event.
- The final segment is the crypto segment, or signature. JWTs are signed so they can’t be modified in transit.

> The details of how this works shouldn’t trouble you or keep you from effectively using an authorization server with token-based authentication.
> - To further demystify JWT, read [Signing and Validating JSON Web Tokens For Everyone](https://maida.kim/2020/09/signing-and-validating-json-web-tokens-jwt-for-everyone) also by @KimMaida.
> - [JWT.io](https://jwt.io) provides a debugger tool to decode, verify and generate JWT.

Now that we know about the anatomy of a JWT, let’s talk more about the claims. ID tokens provide identity information, which is present in the claims.

```json
{
  "iss": "https://{you}.authz-server.com",
  "sub": "auth0|123456",
  "aud": "YOUR_CLIENT_ID",
  "exp": 1570019636365,
  "iat": 1570016110289,
  "nonce": "3yAjXLPq8EPP0S",
  "name": "Jane Doe",
  "gender": "female",
  "birthdate": "0000-10-31",
  "email": "janedoe@example.com",
  "picture": "http://example.com/janedoe/me.jpg"
}
```

Some of the required authentication claims in an ID token include:
- iss (issuer): the issuer of the JWT, e.g., the authorization server
- aud (audience): the intended recipient of the JWT; for ID tokens, this must be the client ID of the application receiving the token
- exp (expiration time): expiration time; the ID token must not be accepted after this time
- iat (issued at time): time at which the ID token was issued

Claims also include statements about the end user. Some of the standard profile claims in an ID token include: sub (subject) which is the unique identifier for the user, name, email, birthdate, picture...

The `nonce` is a cryptographically random string that the client creates and sends with an authorization request. The authorization server then places the nonce in the token that is sent back to the app. The app verifies that the nonce in the token matches the one sent with the authorization request. This way, the app can verify that the token came from the place it requested the token from in the first place.

In practice, when a user wants to log in, the app sends an request to the authorization server. The user’s credentials are verified by the authorization server, and if everything checks out, the authorization server issues an ID token to the application. The client application then decodes the ID token (which is a JWT) and verifies it. This includes validating the signature, and we must also verify the claims. Once we’ve established the authenticity of the ID token, the user is authenticated. We also now have access to the identity claims and know who this user is. The [OpenID Connect Playground](https://openidconnect.net) is a debugger that lets developers explore and test OIDC calls and responses step-by-step.

### Accessing APIs with Access Tokens
Access tokens are used for granting access to resources. Unlike ID tokens, access tokens have no defined format. They do not have to be (and aren’t necessarily) JWT. However, many identity solutions use JWTs for access tokens because the format enables validation.

Access tokens are opaque to the client. They can change at any time. They should have short expiration times, so a user may frequently get new ones. *Refresh tokens are used to obtain a renewed access token without having to re-authenticate the user.* The client application should never contain code that relies on the contents of the access token.

The app sends an authorization request to the authorization server, requesting an access token to call an API. Then when our app wants to interact with the API, we attach the access token to the request header (Authorization header with the Bearer Token). This token has some important information in it, such as:
- sub: (my MyCalApp user ID)
- aud: MyCalAppAPI (audience stating this token is intended for the MyCalApp API)
- scope: `write:events` (scope saying HireMe123 has permission to use the API to write events to my calendar)

Remember when granting consent to allow HireMe123 to use the user’s privileges to access MyCalApp? HireMe123 could ask for a variety of different scopes, for example: `write:events`, `read:events`, `write:settings`, `read:settings`. Scopes are for delegated permissions for an application. It is possible to add different scopes to individual users if your authorization server provides Role-Based Access Control (RBAC).

> The client, in OAuth terminology, is the component that makes requests to the resource server, in your case, the client is the server of a web application (NOT the browser). Therefore, the access token should be stored on the web application server only. It should not be exposed to the browser, and it doesn't need to, because the browser never makes any direct requests to the resource server. It talks to the web application server instead, which in turn makes requests to the resource server using the access token.

### Summary of ID Tokens and Access Tokens
ID tokens are JSON web tokens meant for use by the application only. For example, if there's an app that uses Google to log in users and to sync their calendars, Google sends an ID token to the app that includes information about the user. The app then parses the token's contents and uses the information (including details like name and profile picture) to customize the user experience. Be sure to validate ID tokens before using the information it contains.

Access tokens are used to inform an API that the bearer of the token has been authorized to access the API and perform a predetermined set of actions (specified by the scopes granted). For example, Google sends an access token to the app after the user logs in and provides consent for the app to read or write to their Google Calendar. Whenever the app wants to write to Google Calendar, it sends a request to the Google Calendar API, including the access token in the HTTP Authorization header. Access tokens must never be used for authentication; they cannot tell if the user has authenticated.

<img alt="id-access-token" src="https://raw.githubusercontent.com/kexiZeroing/blog-images/main/008vxvgGly1h8kxztv16ij30u01skaju.jpg" width="600">

*(above picture comes from https://auth0.com/blog/id-token-access-token-what-is-the-difference)*

### How to securely store JWTs
A JWT needs to be stored in a safe place inside the user’s browser. If you store it inside local storage, it’s accessible by any script inside your page. This is as bad as it sounds; an XSS attack could give an external attacker access to the token.

Storing the JWT token in a httponly, secure, same-site cookie is currently considered as the most secure option for SPAs, but in this scenario you will not be able to add its content to the Authorization header. You either need to store tokens directly in the JS code (e.g. in local storage - taking into consideration the risk), or you need to add a proxy between the APIs and your SPA. The proxy will extract the token from the cookie and place it in the Authorization header.

```js
// https://github.com/auth0/node-jsonwebtoken
const jwt = require("jsonwebtoken");

// create a middleware to check if we have the cookie "access_token"
const authorization = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.sendStatus(403);
  }
  try {
    const data = jwt.verify(token, "YOUR_SECRET_KEY");
    req.userId = data.id;
    req.userRole = data.role;
    return next();
  } catch {
    return res.sendStatus(403);
  }
};
```
