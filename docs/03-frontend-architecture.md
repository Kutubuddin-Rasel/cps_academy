# CPS Academy — Frontend Architecture

**Status:** As-built architecture  
**Last updated:** 2026-08-31  
**Runtime:** Next.js 16.3.3 · React 19 · TypeScript · Tailwind CSS  
**Hosting:** Vercel  
**Backend:** Strapi 5 REST API on Railway

---

## 1. Frontend Goals

The frontend is designed for a small but complete LMS rather than as a general-purpose frontend framework.

The main goals are:

1. keep backend contracts explicit and typed;
2. keep authenticated state small and understandable;
3. preserve backend authority for security/business rules;
4. use Server Components where they materially help public reads;
5. use Client Components only where browser auth or interaction requires them;
6. prevent accidental caching of private data;
7. keep feature ownership obvious enough to explain during review.

The architecture deliberately avoids state-management and data-fetching libraries that the project does not need.

---

## 2. High-Level Dependency Direction

```text
App Router page/layout
        ↓
Feature component/screen
        ↓
Feature API function
        ↓
Shared HTTP boundary
        ↓
Strapi REST API
```

Supporting direction:

```text
app → features → lib
  \       ↓
   → shared components
```

### Rules

- `app/` coordinates routes and page composition.
- Feature modules own endpoint semantics and feature-specific UI.
- `lib/` owns transport/environment primitives, not LMS feature logic.
- Raw `fetch()` is centralized behind the request boundary.
- Network results are parsed from `unknown` at feature API boundaries.
- Components consume typed application data rather than raw Strapi payloads.

---

## 3. Source Organization

The implemented application is feature-oriented.

```text
frontend/src/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── globals.css
│   ├── courses/
│   ├── blog/
│   ├── learn/
│   ├── manage/
│   ├── admin/
│   ├── login/
│   └── register/
│
├── features/
│   ├── auth/
│   ├── courses/
│   ├── learning/
│   ├── quizzes/
│   ├── course-management/
│   ├── blog/
│   └── admin/
│
└── lib/
    ├── api/
    └── env/
```

Features contain their own API functions, parsers/types, and UI responsibilities instead of routing everything through one generic service layer.

---

## 4. Server Components vs Client Components

### 4.1 Default

Components remain Server Components unless they require browser-only behavior such as:

- `useState` / `useEffect`;
- event handlers;
- Auth Context;
- `sessionStorage`;
- authenticated browser API calls;
- client navigation decisions.

### 4.2 Public data

Public Course and published Blog data can be read from Server Components through the anonymous cached request boundary.

Examples include public:

- landing-page previews;
- Course catalog/detail;
- Blog list/detail.

### 4.3 Authenticated data

Authenticated operations use browser Client Components because the JWT is stored in browser session storage.

Examples:

- My Courses;
- Student Course overview;
- Lesson learning;
- Quiz taking/history;
- Course management;
- Blog management;
- Admin dashboard.

A route page may still be a thin Server Component that renders a Client Component feature screen.

---

## 5. Authentication Architecture

### 5.1 Storage choice

The frontend stores only the Strapi JWT under:

```text
sessionStorage["cps_academy:token"]
```

The token is intentionally session-scoped: closing the browser session clears the persisted browser token.

The frontend does **not** persist a trusted copy of:

- LMS role;
- permission matrix;
- Course progress;
- Quiz correctness;
- current user identity.

### 5.2 AuthProvider

`AuthProvider` owns the session lifecycle.

Its responsibilities include:

- restore stored session on mount;
- login;
- registration;
- session refresh;
- logout;
- abort stale in-flight auth requests;
- expose one discriminated Auth state through Context.

The state model distinguishes:

```text
loading
unauthenticated
authenticated
error
```

### 5.3 Session restoration

```text
AuthProvider mounts
  ↓
get token from sessionStorage
  ↓
GET /api/me with Bearer JWT
  ├─ valid → authenticated user + token
  ├─ 401   → unauthenticated + clear invalid token
  └─ other → recoverable error state
```

`/api/me` is authoritative for username/email/LMS role.

### 5.4 Logout

Logout aborts the active auth request, removes the stored token, and moves the provider to `unauthenticated`.

The provider does not claim logout succeeded if browser storage could not be cleared.

---

## 6. Frontend Route Protection

`ProtectedShell` provides UX-level protection for authenticated pages.

It:

- waits while session restoration is loading;
- shows recovery UI for session errors;
- redirects unauthenticated users to Login;
- optionally checks an allowed LMS role list;
- shows an Access Denied state when a signed-in role is not appropriate.

This is **not** the security boundary.

The code explicitly treats frontend role checks as UX. Strapi must still authorize every protected API operation.

That distinction allows the frontend to remain helpful without duplicating backend authority.

---

## 7. Shared HTTP Boundary

The final frontend has two intentionally different request paths.

```text
                    ┌────────────────────────┐
                    │ Shared request executor│
                    │ timeout/error/JSON     │
                    └────────────┬───────────┘
                                 │
                 ┌───────────────┴────────────────┐
                 │                                │
          apiRequest()                    publicApiRequest()
          private/auth                    anonymous public
          no-store                        60s revalidation
```

---

## 8. Private Request Boundary — `apiRequest`

`apiRequest` is used for authenticated reads and all mutations.

Its option type deliberately omits caller control over:

- `body` serialization details;
- `cache`;
- Next.js `next` cache configuration.

The helper itself forces:

```text
cache: no-store
```

and removes caller ability to opt a private request into shared caching.

When a token is supplied it adds:

```http
Authorization: Bearer <token>
```

It also:

- defaults `Accept: application/json`;
- adds JSON `Content-Type` when a body exists;
- serializes the body;
- uses `credentials: omit`;
- applies a 15-second timeout;
- composes an external AbortSignal with the timeout;
- handles `204 No Content`;
- parses JSON as `unknown`;
- converts non-success Strapi responses into `ApiError`;
- reports an unreadable successful response as an API failure.

### Why all mutations are no-store

Caching a mutation or authenticated response would be incorrect and potentially unsafe.

Course writes, Enrollment, Lesson completion, Quiz submission, role changes, and Blog management all remain behind this boundary.

---

## 9. Public Cached Boundary — `publicApiRequest`

Public caching is deliberately **not** a switch on the private helper.

A separate helper exists so a developer cannot accidentally combine a Bearer JWT with shared caching.

The helper accepts only:

```text
endpoint
optional AbortSignal
```

It does not accept:

- token;
- method;
- body;
- arbitrary request headers;
- caller-defined cache behavior.

### 9.1 Allowed endpoint shapes

The implementation allows only:

```text
/api/catalog/courses
/api/catalog/courses/:courseDocumentId
/api/blog
/api/blog/:documentId
```

Query strings/fragments and unrelated private paths are rejected.

`/api/blog/manage` is explicitly not a public cached detail path.

### 9.2 Fixed request policy

The helper constructs:

```text
method: GET
Authorization: absent
credentials: omit
cache: force-cache
next.revalidate: 60
```

The shared executor also defensively rejects a cached-public request if it somehow contains:

- a non-GET method;
- a body;
- an Authorization header.

This creates both a **type-level boundary** and a **runtime boundary** around shared cacheable data.

---

## 10. Public Course Catalog Server/Client Split

`/courses` is the clearest example of the final Next.js boundary.

```text
app/courses/page.tsx
Server Component
  ↓
getPublicCourses()
  ↓
publicApiRequest()
  ↓
strict Course parser
  ↓
PublicCourseCatalog(courses)
Client Component
  ↓
only if authenticated Student:
  getEnrollments()
  getCourseProgress()
```

### 10.1 Server responsibility

The Server Component:

- fetches the public Course catalog;
- parses it;
- passes the initial array to the UI;
- passes a request error message if the public request fails.

The public Course list no longer waits for a browser `useEffect` before rendering.

### 10.2 Client responsibility

`PublicCourseCatalog` is still a Client Component because Student-specific state depends on Auth Context.

Its effect performs only private Student calls:

- Enrollment list;
- backend-authoritative Course progress.

It does **not** refetch the public catalog.

### 10.3 Retry behavior

If the server public fetch failed, “Try again” uses `router.refresh()` to rerun the Server Component path rather than recreating an anonymous public fetch inside the client.

### 10.4 Student action state

The Course card may present actions such as:

- View course
- Start
- Continue
- Review

These labels are derived from private Enrollment/progress state after the authenticated Student data is loaded.

The frontend does not manufacture Course progress.

---

## 11. Public Cache Consistency Model

The public Course/Blog cache uses a **60-second revalidation window**.

That means public authoring changes may be eventually consistent for roughly one minute.

Example:

```text
Content Manager publishes Blog
  ↓
private mutation succeeds immediately
  ↓
public Blog page may still show cached version
  ↓
within revalidation window
  ↓
new public representation becomes visible
```

This trade-off is accepted because:

- public Course/Blog data is non-sensitive;
- the assignment does not require instant public invalidation;
- direct browser→Strapi mutations do not have a trusted Vercel revalidation secret path;
- adding a second secure invalidation API solely for this project would add disproportionate complexity.

Authenticated management screens remain uncached and do not inherit this staleness.

---

## 12. Feature API Modules

Endpoint meaning remains inside feature modules.

Examples:

```text
features/auth/api.ts
features/courses/api.ts
features/learning/api.ts
features/quizzes/api.ts
features/course-management/...
features/blog/api.ts
features/admin/api.ts
```

### Course split

The Course feature illustrates the boundary:

```text
getPublicCourses     → publicApiRequest
getPublicCourse      → publicApiRequest

getCourses           → apiRequest
getCourse            → apiRequest
getEnrollments       → apiRequest
enrollInCourse       → apiRequest
```

### Blog split

```text
getPublishedPosts    → publicApiRequest
getPublishedPost     → publicApiRequest

getManagedPosts      → apiRequest
createBlogPost       → apiRequest
updateBlogPost       → apiRequest
publishBlogPost      → apiRequest
unpublishBlogPost    → apiRequest
deleteBlogPost       → apiRequest
```

This makes caching a property of the **data classification**, not a page-specific convention.

---

## 13. Runtime Parsing

HTTP responses enter the application as `unknown`.

Feature API functions call endpoint-specific parsers before returning data to components.

Examples of parsed shapes include:

- Current user;
- Course list/detail;
- public Course catalog/detail;
- Enrollment;
- Course Lessons/progress;
- Quiz take/attempt history;
- managed Blog/public Blog;
- Admin users/stats.

The project intentionally uses small manual parsers instead of introducing Zod solely for this assignment.

Benefits:

- malformed backend responses fail at the boundary;
- UI components receive stable types;
- Strapi response details do not leak through the whole component tree.

---

## 14. State Ownership

| State | Owner |
|---|---|
| JWT/current authenticated user | `AuthProvider` |
| Public Course catalog | Server Component + public revalidated cache |
| Student Course Enrollment/progress overlay | Course Client Component |
| My Courses | Course feature screen |
| Student Course Lesson/progress/Quiz summary | Learning feature |
| Lesson content/completion interaction | Learning feature |
| Quiz selections | Quiz screen local state |
| Quiz history/result | Quiz feature |
| Managed Course content | Course-management feature |
| Staff Student progress | Course-management feature |
| Blog management list/editor state | Blog feature |
| Admin users/stats | Admin feature |
| Temporary form/modal/error state | owning component |

Server data is not mirrored into a global Redux-style store.

---

## 15. Learning UI and Backend Authority

The Student learning experience may display:

- completed Lessons;
- current/available Lesson;
- locked Lessons;
- progress;
- next Lesson;
- Quiz attempts.

Those presentation states are driven by backend responses.

For example:

```text
frontend locked state
        ↑
backend Course Lesson response
        ↑
authoritative prerequisite check
```

A Student cannot bypass sequential learning by manually navigating to a later Lesson because the learning endpoint performs the same prerequisite check on the backend.

---

## 16. Quiz UI and Backend Authority

The frontend owns only the Student's current selections.

It never receives or computes the answer key.

```text
Quiz UI
  ↓
{ questionKey, selectedOptionKey }[]
  ↓
Strapi grading
  ↓
{ score, total, percentage }
```

Previous attempts are loaded from the backend.

The frontend can display the score but is not its source of truth.

---

## 17. Blog Content Rendering

Blog authoring converts the application's simple editor representation into the small Strapi Blocks subset used by CPS Academy.

Public reading renders structured Blocks as React content.

The frontend does not need to inject arbitrary HTML to render Blog content.

This avoids making `dangerouslySetInnerHTML` part of the normal Blog path.

---

## 18. Role-Aware UX

The frontend uses `/api/me` role state for navigation and UX guards.

Typical destinations/capabilities are:

### Student

- Courses
- My Courses
- learning
- Quiz
- Blog

### Instructor

- managed Courses
- owned Course content
- owned Course Student progress
- public content

### Content Manager

- all managed Courses
- Instructor assignment
- Course Student progress
- Blog management
- public content

### Admin

- Admin dashboard
- user roles/stats
- all managed Courses
- Blog management
- public content

A user with no LMS role may remain authenticated but sees restricted UX.

Again, the frontend does not replace the backend permission matrix.

---

## 19. Instructor Directory Integration

Course creation by Admin/Content Manager requires choosing a valid Instructor.

The final backend provides:

```text
GET /api/instructors
```

Allowed:

```text
Admin
Content Manager
```

Response intentionally exposes only:

```text
id
username
```

The frontend uses this safe directory rather than guessing internal User IDs or broadening Admin user endpoints.

---

## 20. Error and Cancellation Behavior

The HTTP boundary and feature screens support:

- structured `ApiError`;
- Strapi error message parsing;
- network failure messaging;
- timeout;
- AbortController cancellation;
- `401` session handling;
- meaningful backend `409` conflict messages.

Feature effects abort requests on cleanup where appropriate so outdated work does not update the current screen.

---

## 21. TypeScript Contract

The project keeps strict TypeScript boundaries and avoids using type assertions as an escape hatch.

Project conventions include avoiding:

- explicit `any`;
- `as unknown as ...`;
- `@ts-ignore`;
- `@ts-expect-error`;
- compiler weakening;
- unnecessary non-null assertions.

Untrusted request/response values are narrowed using guards/parsers.

This is especially important around Strapi's dynamic Content API shapes.

---

## 22. Accessibility and UI Rules

The frontend architecture treats accessibility as part of component behavior rather than separate polish.

Important conventions include:

- semantic buttons/links;
- visible labels;
- keyboard-focus visibility;
- sufficiently large action targets;
- text accompanying semantic colors;
- visible actions rather than hover-only critical controls;
- readable Lesson/Blog widths;
- responsive management tables;
- actionable error states.

The frontend uses Tailwind/global CSS without introducing a large component framework.

---

## 23. Dependencies Deliberately Not Added

The application does not currently need:

- Redux / Redux Toolkit;
- Zustand;
- MobX;
- TanStack Query;
- SWR;
- Zod;
- Material UI;
- Chakra;
- Ant Design;
- a generic CRUD framework;
- a frontend BFF proxy layer.

These were avoided because the application has a small number of explicit feature boundaries and the additional abstraction would make the hiring assignment harder to explain without improving correctness.

---

## 24. Environment Contract

Frontend development:

```env
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

Vercel production:

```env
NEXT_PUBLIC_STRAPI_URL=https://<railway-backend-host>
```

The frontend contains no database credentials or Strapi secret keys.

`NEXT_PUBLIC_STRAPI_URL` is validated as an HTTP(S) origin before requests are made.

---

## 25. Frontend Architecture Summary

The final frontend can be summarized as two request classes:

```text
PUBLIC
Server Components
  ↓
strict public helper
  ↓
GET only
no Authorization
60-second revalidation
  ↓
Strapi

PRIVATE
Client feature components
  ↓
AuthProvider JWT from sessionStorage
  ↓
strict private helper
no-store
  ↓
Strapi
```

This split keeps public rendering efficient without allowing authenticated responses to enter a shared cache.

The frontend remains responsible for **presentation and interaction**. Strapi remains responsible for **authority and truth**.

---

## 26. Implementation References

```text
frontend/src/app/layout.tsx
frontend/src/app/page.tsx
frontend/src/app/courses/page.tsx
frontend/src/app/blog/page.tsx

frontend/src/features/auth/AuthProvider.tsx
frontend/src/features/auth/session.ts
frontend/src/features/auth/storage.ts
frontend/src/features/auth/protected-shell.tsx

frontend/src/lib/api/request.ts
frontend/src/lib/api/error.ts
frontend/src/lib/env/public-env.ts

frontend/src/features/courses/api.ts
frontend/src/features/courses/public-course-catalog.tsx
frontend/src/features/courses/parsers.ts

frontend/src/features/learning/api.ts
frontend/src/features/learning/course-overview.tsx
frontend/src/features/learning/lesson-screen.tsx

frontend/src/features/quizzes/api.ts
frontend/src/features/quizzes/quiz-screen.tsx

frontend/src/features/course-management/
frontend/src/features/admin/
frontend/src/features/blog/
```
