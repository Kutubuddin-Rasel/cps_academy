# CPS Academy frontend

Batch A implements authentication (F1) and the application shell (F2). Courses,
enrollment, lessons, quizzes, Blog, authoring, and Admin CRUD are not implemented.

## Run locally

Use the installed project dependencies, or run `npm ci` on a fresh checkout.
Copy `.env.example` to your private `.env.local` and set
`NEXT_PUBLIC_STRAPI_URL` to the Strapi origin (without an API path).
Start the existing backend separately, then:

```sh
npm run dev
```

Open [CPS Academy](http://localhost:3000). The backend must allow this frontend
origin through CORS. Public environment values are embedded at build time; rebuild
after changing the deployment API origin. Do not put secrets in frontend variables.

## Routes

| Route | Access |
| --- | --- |
| `/` | Public entry page |
| `/login` | Login form; active sessions continue to Account |
| `/register` | Student registration; no role selector |
| `/account` | Every authenticated account, including `role: null` |

Role-specific navigation shows future sections as disabled “Coming soon” items,
without links to routes that do not exist yet.

## Architecture

```text
Server page/layout → client auth UI → Auth Context → auth API → apiRequest → Strapi
```

- Only the JWT is stored in `sessionStorage`, under `cps_academy:token`.
- Login/register persist the JWT, then verify identity through `GET /api/me`.
- Bootstrap starts in a loading state and commits the asynchronous restoration result.
- A confirmed verification 401 clears the stored session. Network failures, 5xx,
  permission errors, and malformed responses preserve it and offer retry/sign out.
- Cancellation prevents old requests from replacing a newer session or undoing logout.
- Forms own submission state. All successful sessions navigate to `/account`.
- API responses enter as `unknown`; endpoint parsers validate only consumed fields.
- Client route guards provide UX only. Strapi remains the authorization boundary.
- All pages/layouts remain Server Components; browser interactions stay in the auth feature.

`ProtectedShell` accepts an optional `allowedRoles` list for subsequent protected
screens. The account route deliberately omits it so an unassigned account stays usable.

Styling uses the existing Tailwind stack and system fonts; builds do not fetch Google
Fonts. No application dependencies were added.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

The 16 unit tests use Node's built-in test runner, an import hook, and the already
installed TypeScript compiler. They were run with Node 22.23.2. Test fixtures do not
contact Strapi or use real credentials. TypeScript remains a separate mandatory gate;
the test import hook only handles execution.

See [the Batch A report](./BATCH-A.md) for the exact verification performed and
remaining live smoke checks.
