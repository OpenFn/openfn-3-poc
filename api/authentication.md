# Authentication

Apart from the token endpoints and webhooks, every endpoint takes a bearer token
in the `Authorization` header:

```
Authorization: Bearer <token>
```

Lightning accepts these kinds of token. Each endpoint section says which ones
it takes.

| Token | Who holds it | How to get one |
| --- | --- | --- |
| Personal access token | A person | Create one in the app under your user profile. It acts as that person, with their project roles. |
| Service account access token | Automation | Trade a signed assertion at `POST /api/oauth/token` (see below). It lasts five minutes and carries scopes. |
| Run token | A running job | Issued by Lightning to a run. Only used by the collections item API. |
| GitHub sync token | Lightning's GitHub integration | Created when a project is connected to a repository. Only used by provisioning, for that project. |

## Service account tokens

A service account signs in with an RSA key pair instead of a password. The
instance operator sets the public key as `SERVICE_ACCOUNT_PUBLIC_KEY`, and your
automation keeps the private key. Each instance has at most one service
account. Changing or removing the key revokes every token already issued.

### Discover the token endpoint

Status: **Public**

```
GET /.well-known/oauth-authorization-server
```

Returns RFC 8414 metadata. Use its `token_endpoint` value exactly as given,
because it is also the `aud` of your assertion.

### Request a token

Status: **Public**

```
POST /api/oauth/token
Content-Type: application/x-www-form-urlencoded
```

This is the OAuth 2.0 client credentials grant with `private_key_jwt` client
authentication ([RFC 7523](https://www.rfc-editor.org/rfc/rfc7523#section-2.2)).
The body must be form encoded. JSON is refused.

| Field | Value |
| --- | --- |
| `grant_type` | `client_credentials` |
| `client_assertion_type` | `urn:ietf:params:oauth:client-assertion-type:jwt-bearer` |
| `client_assertion` | A JWT signed with RS256 by the private key |
| `scope` | Space-separated scopes. Required: a request with no `scope` is refused. |

The assertion's claims:

| Claim | Value |
| --- | --- |
| `iss`, `sub` | Both the service account's id: the public key's RFC 7638 thumbprint. Write `e`, `kty` and `n` as JSON in that order with no spaces, hash with SHA-256, then base64url encode. |
| `aud` | The `token_endpoint` from the metadata document, exactly. |
| `iat` | Now, in seconds. At most five seconds ahead of Lightning's clock. |
| `exp` | At most 60 seconds after `iat`. |
| `jti` | A new unique value for every assertion. Each assertion works once. |

A successful response:

```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 300,
  "scope": "projects:write credentials:write collections:write"
}
```

There is no refresh token. Sign a new assertion when you need a new token.

Failures follow OAuth's error format rather than the problem documents the
rest of the API uses:

| Status | `error` | Meaning |
| --- | --- | --- |
| 400 | `invalid_request` | A field is missing or malformed, or the body isn't form encoded. |
| 400 | `unsupported_grant_type` | `grant_type` isn't `client_credentials`. |
| 400 | `invalid_scope` | `scope` is missing or names a scope that doesn't exist. |
| 401 | `invalid_client` | The assertion was refused. The instance's logs say why. |

### Node.js example

No extra packages needed:

```js
import { createHash, createPrivateKey, createPublicKey, randomUUID, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const lightning = 'https://lightning.example.org';
const key = createPrivateKey(readFileSync('service-account.key'));

const { token_endpoint } = await fetch(
  `${lightning}/.well-known/oauth-authorization-server`
).then(r => r.json());

const { e, kty, n } = createPublicKey(key).export({ format: 'jwk' });
const id = createHash('sha256').update(JSON.stringify({ e, kty, n })).digest('base64url');

const encode = v => Buffer.from(JSON.stringify(v)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const unsigned = `${encode({ alg: 'RS256' })}.${encode({
  iss: id, sub: id, aud: token_endpoint, iat: now, exp: now + 60, jti: randomUUID(),
})}`;
const signature = sign('sha256', Buffer.from(unsigned), key).toString('base64url');

const { access_token } = await fetch(token_endpoint, {
  method: 'POST',
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: `${unsigned}.${signature}`,
    scope: 'projects:write credentials:write collections:write',
  }),
}).then(r => r.json());
```

## Scopes

A service account token can only do what its scopes allow. Within those
scopes it acts on every project as if it held every role, but it never appears
as a project member.

| Scope | Allows |
| --- | --- |
| `users:read` | Listing and reading users |
| `users:write` | Creating and changing users |
| `projects:write` | Reading, creating and changing projects |
| `credentials:write` | Reading, creating and replacing credentials |
| `collections:write` | Reading, creating and renaming collections |

Projects, credentials and collections have no read scopes. Their `GET` routes
need the same `:write` scope as their `PUT` routes.
