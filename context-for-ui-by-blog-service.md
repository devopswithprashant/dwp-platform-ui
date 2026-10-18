# UI Service Context — Blog Posts Linked to User Profiles

## Purpose

Use this handoff to update the UI to show blog authors from User Service
profiles and to support authenticated, owner-only blog management. The Blog
Service stores the authenticated user's UUID on each new post and exposes it
as `authorUuid` in blog metadata; profile details are fetched separately from
the User Service.

## Services and identity

- **Auth Service** authenticates users and issues access tokens. The token's
  verified `sub` is the user's canonical UUID.
- **User Service** owns profile information, including public author details.
- **Blog Service** owns blog content and stores the author's UUID. It does not
  create profiles or embed profile information in blog responses.

The UI must not contain the JWT signing secret or try to authorize a write
based solely on client-side identity checks. Send the Auth Service access token
to Blog Service as a bearer token; Blog Service validates it and enforces
ownership. The UI's owner comparison is only for presentation.

## Blog Service API contract

Configure the Blog Service API base URL per environment. The routes below are
relative to it.

| Method | Path | Authentication | Response / behavior |
|---|---|---|---|
| `GET` | `/api/blogs` | Public | Paginated `Page<BlogMetadataResponse>` |
| `GET` | `/api/blogs/{id}/metadata` | Public | `BlogMetadataResponse` |
| `GET` | `/api/blogs/{id}/content` | Public | `BlogContentResponse` containing raw Markdown |
| `POST` | `/api/blogs` | Bearer access token required | `200` with numeric post ID |
| `PUT` | `/api/blogs/{id}` | Owner's bearer access token required | `200` with no response body |
| `DELETE` | `/api/blogs/{id}` | Owner's bearer access token required | `204` with no response body |
| `POST` | `/api/blogs/{id}/publish` | Owner's bearer access token required | `200` with no response body |

Blog metadata includes the existing `authorId` property and the new stable
`authorUuid` property. `authorId` is a legacy numeric value; it is not the
User Service profile ID and must not be used for profile lookup or ownership
checks. Older/anonymous posts may have no `authorUuid`; treat it as unavailable.

Example metadata:

```json
{
  "id": 42,
  "authorId": null,
  "authorUuid": "8c0c0b42-ff2a-4d68-b90f-3b845ca8106a",
  "title": "Building Services",
  "slug": "building-services",
  "status": "PUBLISHED",
  "createdAt": "2026-10-18T12:00:00Z",
  "publishedAt": "2026-10-18T12:30:00Z"
}
```

`GET /api/blogs` returns Spring's paginated response, with metadata entries in
its `content` array. `BlogMetadataResponse` currently exposes the fields shown
above. `BlogContentResponse` returns `postId`, `content`, and `format`
(`MARKDOWN`). Do not expect `displayName`, `bio`, or `avatarUrl` inside the Blog
Service response.

### Authenticated write requests

Attach the current Auth Service token in the HTTP header:

```http
Authorization: Bearer <access-token>
```

Create body:

```json
{
  "title": "Building Services",
  "markdown": "# Article body"
}
```

Update body:

```json
{
  "title": "Updated title",
  "markdown": "# Updated article body"
}
```

Do not send `authorId`, `authorUuid`, `userId`, or an author object in create
or update requests. Blog Service derives the owner from the verified JWT
subject; client-supplied author identity is not authoritative. A successful
create returns a numeric post ID, which the UI can use to navigate to the
newly-created post or fetch its metadata.

## Author profile cards

Use the public User Service endpoint to resolve a blog's `authorUuid`:

```http
GET /api/v1/users/{userId}
```

No reader bearer token is required for this public lookup. The path UUID comes
from `authorUuid`. An example public profile response is:

```json
{
  "userId": "8c0c0b42-ff2a-4d68-b90f-3b845ca8106a",
  "displayName": "Ada",
  "bio": "Engineer",
  "avatarUrl": "https://images.example.test/ada.png",
  "createdAt": "2026-10-18T12:00:00Z"
}
```

Only `userId`, `displayName`, `bio`, `avatarUrl`, and `createdAt` are public
fields on this endpoint. Check that the returned `userId` matches the
requested UUID before associating the response with the post. Do not request
the authenticated `/api/v1/users/me` profile for each author card; that route
is for the current user's own profile.

For a list page, deduplicate author UUIDs and avoid one unbounded request per
post. The public API currently has no batch endpoint. Coordinate any caching
or batching changes with the UI and User Service teams; keep profile lookup
failure separate from blog content loading so public blog content can still
render when a profile cannot be retrieved.

| Profile lookup result | UI behavior |
|---|---|
| `200` | Render the public display name/avatar/bio as appropriate after verifying `userId`. |
| `400` | Treat as an invalid/integration UUID; do not retry unchanged input. |
| `404` | Show a neutral author-unavailable state; do not invent profile details. |
| Network error or `5xx` | Keep the post visible and show a neutral/fallback author state; do not reveal private profile fields. |
| Missing `authorUuid` on a legacy post | Show an anonymous/author-unavailable state; do not infer ownership from `authorId`, title, or name. |

Configure the User Service API origin (and any gateway prefix) per
environment. Do not hardcode a developer hostname.

## UI ownership behavior

Obtain the current user's canonical UUID from the authenticated session or
User Service `/api/v1/users/me` profile (`userId`). On blog metadata, compare it
to `authorUuid` to decide whether to display the edit, delete, and publish
controls:

```text
show owner controls only when currentUser.userId == blog.authorUuid
```

For anonymous/legacy posts or when there is no signed-in user, do not show
owner controls. This comparison is a UX convenience only: always handle the
Blog Service authorization response because the server is authoritative.

- Prompt for confirmation before sending a delete request.
- On `401 Unauthorized`, refresh/re-authenticate through the app's existing
  authentication flow; do not retry a write with a missing or invalid token.
- On `403 Forbidden`, keep the post intact in the UI, remove or refresh stale
  owner controls, and show an access-denied message. Do not retry as a
  different user or alter the request to include an author ID.
- On `404 Not Found`, handle the post as missing/deleted and refresh the
  relevant view.
- On successful delete (`204`), remove the post from the current list/detail
  view. On successful update/publish (`200`), refresh its metadata/content as
  needed.

The public list endpoint currently returns the service's paginated `findAll`
results without filtering by status. Preserve the product's existing draft
visibility rules in the UI and coordinate with the Blog Service team if draft
posts must be hidden from public readers; do not assume that authentication
alone hides drafts.

## Recommended UI flow

1. The visitor can browse public blog metadata and content without signing in.
2. The UI resolves author cards by looking up each non-null `authorUuid` at
   the User Service public profile endpoint.
3. A signed-in user creates a post with only title and Markdown; the UI sends
   the bearer token and no author identity.
4. The Blog Service validates the access token and saves its `sub` as
   `authorUuid`.
5. When viewing a post, the UI compares its `authorUuid` with the current
   profile's `userId` to present owner controls.
6. The UI sends update, delete, and publish requests with the access token;
   Blog Service checks ownership and returns `403` for a different user.

<!-- mermaid-checked: every participant uses `participant Id as "Label"`, no \n in aliases/messages/notes, every alt/opt/loop closed by end, no `:` inside any alias -->
```mermaid
sequenceDiagram
    participant User as "Signed-in User"
    participant UI as "UI Service"
    participant Auth as "Auth Service"
    participant Blog as "Blog Service"
    participant Profile as "User Service"

    User->>UI: Sign in
    UI->>Auth: Authenticate user
    Auth-->>UI: Access token with UUID subject
    UI->>Blog: GET /api/blogs
    Blog-->>UI: Page of blog metadata with authorUuid
    UI->>Profile: GET /api/v1/users/{authorUuid}
    Profile-->>UI: Public profile fields
    UI-->>User: Render posts and author cards
    User->>UI: Create post with title and Markdown
    UI->>Blog: POST /api/blogs with bearer token
    Blog->>Blog: Validate token and store subject as authorUuid
    Blog-->>UI: 200 with numeric post ID
    UI-->>User: Show created post
    User->>UI: Edit, delete, or publish own post
    UI->>Blog: Owner operation with bearer token
    alt Token subject matches authorUuid
        Blog-->>UI: Operation succeeds
    else Token subject does not match authorUuid
        Blog-->>UI: 403 Forbidden
    end
```

## Team integration checklist

- [ ] Add `authorUuid` to blog metadata typings/models and parse it as an optional
      UUID for backwards-compatible legacy posts.
- [ ] Render author information using the User Service public profile endpoint;
      handle `404`, lookup failure, and null UUID without blocking post content.
- [ ] Compare the current profile's `userId` with `authorUuid` for presentation
      of owner actions only.
- [ ] Add the bearer token to create, update, delete, and publish requests.
- [ ] Remove author identity from create/update request payloads.
- [ ] Handle `401`, `403`, and `404` distinctly and refresh views after success.
- [ ] Configure both service API origins for each deployment environment.
- [ ] Verify the UI's policy for showing drafts, since the current public list
      response is not filtered by `status`.

## References

- Blog API implementation: [`src/main/java/com/devopswithprashant/service/blog/api/BlogController.java`](./src/main/java/com/devopswithprashant/service/blog/api/BlogController.java)
- Blog response/request DTOs: [`src/main/java/com/devopswithprashant/service/blog/api/dto/BlogMetadataResponse.java`](./src/main/java/com/devopswithprashant/service/blog/api/dto/BlogMetadataResponse.java), [`src/main/java/com/devopswithprashant/service/blog/api/dto/BlogContentResponse.java`](./src/main/java/com/devopswithprashant/service/blog/api/dto/BlogContentResponse.java), [`src/main/java/com/devopswithprashant/service/blog/api/dto/CreateBlogRequest.java`](./src/main/java/com/devopswithprashant/service/blog/api/dto/CreateBlogRequest.java), and [`src/main/java/com/devopswithprashant/service/blog/api/dto/UpdateBlogRequest.java`](./src/main/java/com/devopswithprashant/service/blog/api/dto/UpdateBlogRequest.java)
- Blog authentication and access rules: [`src/main/java/com/devopswithprashant/service/blog/SecurityConfig.java`](./src/main/java/com/devopswithprashant/service/blog/SecurityConfig.java)
- User Service profile/JWT handoff: [`context-for-blog.md`](./context-for-blog.md)
- Blog API overview: [`README.md`](./README.md)
