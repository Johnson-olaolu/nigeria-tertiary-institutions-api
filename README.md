# Nigeria Tertiary Institutions API

A free, public, read-only REST API for Nigerian universities, polytechnics and colleges of education: the faculties/schools they run and the courses they offer.

- **Base URL:** <https://nigeria-tertiary-institutions-api.vercel.app>
- **Interactive docs (Swagger UI):** <https://nigeria-tertiary-institutions-api.vercel.app/docs>
- **OpenAPI 3 spec (JSON):** <https://nigeria-tertiary-institutions-api.vercel.app/docs.json>

No API key or sign-up needed. CORS is open, so you can call it straight from a browser.

---

## Contents

- [What's in the data](#whats-in-the-data)
- [Quick start](#quick-start)
- [Data model](#data-model)
- [Endpoints](#endpoints)
- [Query conventions](#query-conventions)
- [Responses and errors](#responses-and-errors)
- [Running locally](#running-locally)
- [Seeding the database](#seeding-the-database)
- [Configuration](#configuration)
- [Admin analytics dashboard](#admin-analytics-dashboard)
- [Deploying to Vercel](#deploying-to-vercel)
- [Project structure](#project-structure)
- [Documenting new endpoints](#documenting-new-endpoints)
- [Contributing](#contributing)
- [License](#license)

---

## What's in the data

| Category             | Institutions | Faculties / schools                  |
| -------------------- | -----------: | ------------------------------------ |
| University           |          392 | 9 faculties                          |
| Polytechnic          |          394 | 11 schools                           |
| College of Education |          216 | 1 shared NCE school                  |
| **Total**            |    **1,002** | **21**, holding **739** courses      |

Each institution has a unique **code** (e.g. `ABU`, `LAGOS`, `YABATECH`), a name, category, ownership (`Federal`, `State` or `Private`), state, and, where known, an address, website and logo URL.

---

## Quick start

```bash
BASE=https://nigeria-tertiary-institutions-api.vercel.app

# Universities in Lagos, 10 per page
curl "$BASE/api/institutions/universities?state=Lagos&limit=10"

# Full profile of Ahmadu Bello University, with its faculties and courses
curl "$BASE/api/institutions/ABU"

# Every institution that offers Computer Science
curl "$BASE/api/institutions/query?course=COMPUTER_SCIENCE"

# Private universities in Lagos or Ogun with a law faculty
curl "$BASE/api/institutions/query?category=University&ownership=Private&state=Lagos,Ogun&faculty=LAW"

# Polytechnic schools that award an HND
curl "$BASE/api/faculties/polytechnics?degree=HND"

# Courses ranked by how many institutions offer them
curl "$BASE/api/courses?sort=-institutionCount&limit=20"
```

From JavaScript:

```js
const res = await fetch(
  "https://nigeria-tertiary-institutions-api.vercel.app/api/institutions/query?course=MEDICINE&ownership=Federal"
);
const { count, data } = await res.json();
console.log(`${count} federal institutions offer Medicine`);
```

---

## Data model

```text
Institution ◄──── many-to-many ────► Course ────► Faculty
 (code, name,       Course.institutions[]       (code, name,
  category,                                       category,
  ownership,                                      degreeAwarded)
  state, ...)
```

- A **Course** belongs to one **Faculty** and lists the **Institutions** that offer it.
- A **Faculty** belongs to one category. The name depends on the institution type:
  - **Universities** have *faculties* (e.g. `LAW`, `ENG_ENV_TECH`).
  - **Polytechnics** have *schools* (e.g. `INFORMATION_AND_COMMUNICATION`).
  - **Colleges of education** all share one school, `NCE`, which awards the Nigeria Certificate in Education.
- Institution codes are unique across every category. Course codes are unique only **within a faculty**: the same code (e.g. `ACCOUNTING`) can appear under more than one faculty.
- An institution's faculties are the faculties of the courses it offers. Some institutions offer courses outside their own category's faculties, e.g. a polytechnic that also runs NCE programmes.

---

## Endpoints

All endpoints are `GET` and live under `/api`.

### Institutions

| Endpoint                                        | Description                                                      |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| `/api/institutions`                             | List all institutions (sorting and pagination only)              |
| `/api/institutions/query`                       | Filter institutions (see params below)                           |
| `/api/institutions/universities`                | Same as `/query`, limited to universities                        |
| `/api/institutions/polytechnics`                | Same as `/query`, limited to polytechnics                        |
| `/api/institutions/college-of-education`        | Same as `/query`, limited to colleges of education               |
| `/api/institutions/{code}`                      | One institution by code, with its faculties and their courses    |
| `/api/institutions/universities/{code}`         | Same, but returns 404 unless the institution is a university     |
| `/api/institutions/polytechnics/{code}`         | Same, for polytechnics                                           |
| `/api/institutions/college-of-education/{code}` | Same, for colleges of education                                  |

**Filters for `/api/institutions/query`** (and the category routes):

| Param       | Matches                                                                  | Example                  |
| ----------- | ------------------------------------------------------------------------ | ------------------------ |
| `q`         | Free text in name, code, state or address                                | `q=technology`           |
| `name`      | Text in the name                                                         | `name=federal`           |
| `address`   | Text in the address                                                      | `address=zaria`          |
| `code`      | Exact institution code(s)                                                | `code=ABU,LAGOS`        |
| `state`     | Exact state name(s)                                                      | `state=Lagos,Ogun`       |
| `ownership` | `Federal`, `State`, `Private`                                            | `ownership=Federal`      |
| `category`  | `University`, `Polytechnic`, `College of Education` (not on category routes) | `category=Polytechnic` |
| `course`    | Offers a course with this code or name                                   | `course=COMPUTER_SCIENCE`|
| `faculty`   | Offers a course in a faculty/school with this code or name               | `faculty=LAW`            |
| `sort`      | `name`, `code`, `state`, `courseCount`, `facultyCount`                   | `sort=-courseCount`      |
| `page`, `limit` | Pagination                                                           | `page=2&limit=25`        |

List items include `courseCount` and `facultyCount`. When you filter by `course` or `faculty`, each item also includes `matchedCourses`, the courses that matched.

### Faculties / schools

| Endpoint                                     | Description                                                   |
| -------------------------------------------- | ------------------------------------------------------------- |
| `/api/faculties`                             | List all faculties and schools                                |
| `/api/faculties/query`                       | Filter faculties and schools                                  |
| `/api/faculties/universities`                | Same as `/query`, limited to university faculties             |
| `/api/faculties/polytechnics`                | Same as `/query`, limited to polytechnic schools              |
| `/api/faculties/college-of-education`        | Same as `/query`, limited to the NCE school                   |
| `/api/faculties/{id}/courses`                | Courses under one faculty (`id` is the faculty's `_id`)       |

**Filters for `/api/faculties/query`:**

| Param         | Matches                                                       | Example                 |
| ------------- | ------------------------------------------------------------- | ----------------------- |
| `q`           | Free text in faculty code or name                             | `q=engineering`         |
| `category`    | Institution category (not on category routes)                 | `category=University`   |
| `degree`      | Text in the degree awarded                                    | `degree=HND`            |
| `institution` | Has a course offered by this institution (code or name)       | `institution=ABU`       |
| `course`      | Contains a course with this code or name                      | `course=ACCOUNTING`     |
| `sort`        | `name`, `code`, `category`, `courseCount`, `institutionCount` | `sort=-institutionCount`|
| `page`, `limit` | Pagination                                                  |                         |

List items include `courseCount` and `institutionCount`, which always count the **whole** faculty. When you filter by `institution` or `course`, items also include `matchedCourses`.

### Courses

| Endpoint                                   | Description                                                    |
| ------------------------------------------ | -------------------------------------------------------------- |
| `/api/courses`                             | List all courses                                               |
| `/api/courses/query`                       | Filter courses                                                 |
| `/api/courses/universities`                | Courses offered by at least one university                     |
| `/api/courses/polytechnics`                | Courses offered by at least one polytechnic                    |
| `/api/courses/college-of-education`        | Courses offered by at least one college of education           |
| `/api/courses/{id}`                        | One course (by `_id`) with its faculty and offering institutions |

**Filters for `/api/courses/query`:**

| Param         | Matches                                                              | Example               |
| ------------- | -------------------------------------------------------------------- | --------------------- |
| `q`           | Free text in course code or name                                     | `q=engineering`       |
| `faculty`     | Faculty/school `_id`, code or name                                   | `faculty=LAW`         |
| `institution` | Offered by this institution (code or name)                           | `institution=LAGOS`  |
| `category`    | Offered by an institution of this category (not on category routes)  | `category=Polytechnic`|
| `state`       | Offered by an institution in this state                              | `state=Lagos`         |
| `ownership`   | Offered by an institution with this ownership                        | `ownership=Private`   |
| `sort`        | `name`, `code`, `institutionCount`                                   | `sort=-institutionCount` |
| `page`, `limit` | Pagination                                                         |                       |

`category`, `state` and `ownership` must all hold for the **same** offering institution. `?category=University&ownership=Private&state=Lagos` means "offered by a private university in Lagos", not "offered by any university, and by any private institution, and by anything in Lagos".

Each course includes `institutionCount` and an `offeredBy` breakdown:

```json
"offeredBy": { "University": 116, "Polytechnic": 0, "College of Education": 0 }
```

---

## Query conventions

These rules apply to every query endpoint.

- **Text filters** (`q`, `name`, `address`, `degree`) are case-insensitive and match anywhere in the field. `address=zaria` matches `"Zaria"` and `"Samaru, Zaria"`.
- **Exact filters** (`code`, `state`) are case-insensitive but must match the whole value. `state=lagos` works, `state=lag` does not.
- **Code-or-name filters** (`course`, `faculty`, `institution`): if the value is an existing code, it matches only that code (`course=LAW`). Otherwise it matches names containing the text (`course=engineering`). One request can mix both: `course=LAW,engineering`.
- **Comma-separated values** match *any of* them: `state=Lagos,Ogun`, `ownership=Federal,State`.
- **Different filters** must *all* match: `state=Lagos&ownership=Private` returns private institutions in Lagos.
- **Enum values** (`category`, `ownership`) are case-insensitive, but an unknown value returns `400`.
- **Sorting:** `sort=<field>` ascending, `sort=-<field>` descending. The default is `name`. String sorts are case-insensitive.
- **Pagination is optional.** Without `page` or `limit` you get every match in one response. With either one you get pages: `limit` defaults to **50** and is capped at **200**, and `page` defaults to 1.

---

## Responses and errors

### List responses

```json
{
  "success": true,
  "count": 2,
  "total": 18,
  "page": 1,
  "pages": 9,
  "data": [
    {
      "_id": "6ae581435dc42a9576f33e52",
      "code": "ANCHOR-UNI",
      "name": "Anchor University, Ayobo",
      "category": "University",
      "ownership": "Private",
      "state": "Lagos",
      "address": "Ayobo, Lagos state.",
      "website": "https://aul.edu.ng",
      "logoUrl": "https://aul.edu.ng/assets/...",
      "isActive": true,
      "courseCount": 32,
      "facultyCount": 7
    }
  ]
}
```

`total`, `page` and `pages` appear only when you paginate. `count` is always the number of items in `data`.

### Single-resource responses

```json
{
  "success": true,
  "data": {
    "code": "ABU",
    "name": "Ahmadu Bello University",
    "category": "University",
    "ownership": "Federal",
    "state": "Kaduna",
    "faculties": [
      {
        "code": "ADMINISTRATION",
        "name": "Faculty of Administration",
        "degreeAwarded": "B.Sc. (Hons.), B.A. (Hons.)",
        "courses": [{ "code": "ACCOUNTING", "name": "Accounting / Accountancy / Procurement Management" }]
      }
    ]
  }
}
```

### Errors

```json
{ "message": "Invalid ownership \"bogus\". Allowed values: Federal, State, Private", "stack": null }
```

| Status | When                                                                        |
| ------ | --------------------------------------------------------------------------- |
| `400`  | Unknown `category`/`ownership` value, unknown `sort` field, invalid `page`/`limit` |
| `404`  | Unknown institution code, course id or faculty id                           |
| `500`  | Unexpected server error                                                     |

`stack` is filled in only when `NODE_ENV` is not `production`.

---

## Running locally

### Prerequisites

- **Node.js 18+** (the project uses ES modules and `node --watch`)
- **MongoDB 7.0+**, local or Atlas (the analytics aggregations use `$percentile`)

### Setup

```bash
git clone https://github.com/Johnson-olaolu/nigeria-tertiary-institutions-api.git
cd nigeria-tertiary-institutions-api
npm install
cp .env.example .env      # then edit MONGO_URI and the admin settings
npm run dev               # restarts on file changes
```

The server starts on `http://localhost:3000`. Open `http://localhost:3000/docs` for the interactive docs.

The API returns empty lists until you [seed the database](#seeding-the-database).

### Scripts

| Script               | What it does                                                      |
| -------------------- | ----------------------------------------------------------------- |
| `npm start`          | Run the server                                                    |
| `npm run dev`        | Run the server and restart on file changes                        |
| `npm run seed`       | Load or refresh the data from `data/` (safe to re-run)            |
| `npm run seed:fresh` | Delete all institutions, faculties and courses, then seed         |

There is no test suite yet.

---

## Seeding the database

> **The source dataset isn't in this repository.** `data/` is gitignored. If you want the dataset to run your own copy, [open an issue](https://github.com/Johnson-olaolu/nigeria-tertiary-institutions-api/issues) and ask for it.

The seed script (`seed/seed.js`) reads four JSON files from `data/`:

<details>
<summary><code>data/institution.json</code>: every institution, grouped by category</summary>

```json
{
  "institutions": {
    "universities":         [{ "id": "ABU", "name": "Ahmadu Bello University", "ownership": "Federal", "State": "Kaduna", "Address": "Zaria", "website": "https://www.abu.edu.ng", "logo_url": "https://..." }],
    "polytechnic":          [{ "id": "YABATECH", "name": "...", "ownership": "Federal", "State": "Lagos", "Address": "...", "website": "", "logo_url": "" }],
    "college_of_education": [{ "id": "IJANIKIN", "name": "...", "ownership": "Federal", "State": "Lagos", "Address": "...", "website": "", "logo_url": "" }]
  }
}
```

`id` becomes the institution `code` and must be unique across all three groups. Blank `Address`, `website` and `logo_url` values are left unset.
</details>

<details>
<summary><code>data/faculty.json</code>: university faculties and their courses</summary>

```json
{
  "faculties": [
    {
      "id": "LAW",
      "faculty_name": "Faculty/School/College of Law",
      "degree_awarded": "LLB. (HONS)",
      "courses": [{ "course_id": "LAW", "course_name": "Law", "institutions": ["ABU", "LAGOS"] }]
    }
  ]
}
```

</details>

<details>
<summary><code>data/polytechnic.json</code>: polytechnic schools and their courses</summary>

Same shape as `faculty.json`, but the top-level key is `schools`:

```json
{ "schools": [{ "id": "...", "faculty_name": "School of ...", "degree_awarded": "ND, HND", "courses": [...] }] }
```

</details>

<details>
<summary><code>data/college_of_education.json</code>: NCE courses</summary>

```json
{
  "program_type": "Nigeria Certificate in Education (NCE)",
  "courses": [{ "course_id": "...", "course_name": "...", "institutions": ["IJANIKIN"] }]
}
```

All these courses go under a single `NCE` faculty named "School of Education (NCE)".
</details>

Then run:

```bash
npm run seed         # upsert: adds new records and updates existing ones
npm run seed:fresh   # wipe institutions, faculties and courses first
```

The seed:

- matches institutions on `code`, faculties on `category` + `code`, and courses on `faculty` + `code`, so re-running it updates records rather than duplicating them,
- syncs the MongoDB indexes, dropping stale ones from older schemas,
- prints how many courses each file contained and lists any institution codes in `institutions` arrays that aren't in `institution.json`. Those links are skipped.

---

## Configuration

Copy `.env.example` to `.env`. On Vercel, set the same variables in the project settings.

| Variable               | Required          | Default       | Purpose                                                                                          |
| ---------------------- | ----------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `MONGO_URI`            | **Yes**           | none          | MongoDB connection string. The server exits if it can't connect.                                 |
| `PORT`                 | No                | `3000`        | HTTP port (ignored on Vercel).                                                                   |
| `NODE_ENV`             | No                | none          | Set to `production` to hide stack traces in error responses and mark the admin cookie `Secure`. |
| `ADMIN_USERNAME`       | For `/admin`      | none          | Dashboard login.                                                                                 |
| `ADMIN_PASSWORD`       | For `/admin`      | none          | Dashboard password. Changing it signs out every session.                                         |
| `ADMIN_SESSION_SECRET` | For `/admin`      | none          | Signs admin session cookies. Changing it signs everyone out.                                     |
| `IP_HASH_SALT`         | Recommended       | empty         | Key for hashing consumer IPs in the request logs. Changing it resets unique-consumer counts.     |
| `CRON_SECRET`          | For the rollup cron | none        | Bearer token required by `/admin/cron/rollup`.                                                   |

The dashboard stays disabled until `ADMIN_USERNAME`, `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are all set.

Generate production secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Admin analytics dashboard

`/admin` is a private dashboard showing how the API is used. Sign in at `/admin/login` with `ADMIN_USERNAME` / `ADMIN_PASSWORD`. These routes are deliberately left out of the public OpenAPI docs.

### What it shows

- Request volume, success/error rates, average and p95 latency, unique consumers, and the change from the previous period
- Traffic over time and by hour of day (in WAT, Africa/Lagos)
- Per-endpoint calls, errors and latency
- Most-used filters and their most popular values (e.g. top states and courses searched)
- Most-viewed institution profiles, and institution codes that returned 404
- Searches that returned zero results, which point to gaps in the data
- Client types (browser, CLI, server, bot), referring sites and countries
- Recent requests and recent errors

### How requests are logged

`middleware/requestLogger.js` records every `/api` request after the response is sent: route, path, status, duration, the known query params, result count, user agent and client type, referer host, and country (from Vercel's `x-vercel-ip-country` header).

Client IPs are never stored in full. Each IP is stored as an HMAC-SHA256 hash keyed with `IP_HASH_SALT`, used to count unique consumers, and as a masked prefix for display (`102.89.x.x`).

### Retention and rollups

| Data                                | Kept      | Used for dashboard ranges   |
| ----------------------------------- | --------- | --------------------------- |
| Raw request logs (`ApiLog`)         | 30 days (TTL index) | `24h`, `7d`, `30d`  |
| Daily rollups (`ApiDailyStat`)      | Forever   | `90d`, `12m`, `all` (by day, week or month) |

A rollup turns one full WAT day of raw logs into a summary document. Rollups run daily from Vercel Cron, and also whenever the dashboard loads a long range, which fills in any day the cron missed. Re-running a rollup for a day replaces that day's summary, so it's safe.

### Security

- Sessions use a signed, `HttpOnly`, `SameSite=Strict` cookie that expires after 12 hours.
- Credentials are compared in constant time.
- After 5 failed logins from one IP, that IP is locked out for 15 minutes. The counter is held in memory per server instance, so on serverless hosting it slows guessing down rather than stopping it. Use a strong password.

---

## Deploying to Vercel

The live API runs on Vercel, which detects the Express app in `index.js` automatically.

1. Import the repository into Vercel.
2. Set the [environment variables](#configuration): at least `MONGO_URI`, plus `NODE_ENV=production` and the admin and cron secrets.
3. Allow connections from Vercel to your MongoDB. On Atlas, Vercel's IPs vary, so this usually means allowing `0.0.0.0/0`.
4. Deploy, then run the seed against the production database from your machine: `MONGO_URI=<production uri> npm run seed`.

**Cron:** `vercel.json` schedules `GET /admin/cron/rollup` daily at **23:15 UTC (00:15 WAT)**, just after a WAT day ends. Vercel sends `Authorization: Bearer $CRON_SECRET`. To trigger a rollup by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://nigeria-tertiary-institutions-api.vercel.app/admin/cron/rollup
# {"rolledUp":1,"days":["2026-10-31T23:00:00.000Z"]}
```

**Docs page:** `/docs` loads Swagger UI from the jsDelivr CDN instead of `swagger-ui-express`, because serverless hosts don't serve static files from `node_modules`.

---

## Project structure

```text
.
├── index.js                  # Express app: middleware, routes, docs, admin, error handler
├── config/
│   ├── db.js                 # MongoDB connection
│   ├── swagger.js            # OpenAPI base definition and shared params/responses
│   └── docsPage.js           # Swagger UI HTML served at /docs
├── routes/                   # Route definitions + @openapi docs for each endpoint
│   ├── institutionRoutes.js
│   ├── facultyRoutes.js
│   ├── courseRoutes.js
│   └── adminRoutes.js
├── controllers/              # Request handlers and aggregation pipelines
├── models/
│   ├── Institution.js        # + CATEGORIES and OWNERSHIPS enums
│   ├── Faculty.js
│   ├── Course.js
│   ├── ApiLog.js             # Raw request log (30-day TTL)
│   └── ApiDailyStat.js       # Daily analytics rollup
├── middleware/
│   ├── requestLogger.js      # Logs /api requests for analytics
│   ├── adminAuth.js          # Admin sessions, login lockout, cron auth
│   ├── setCategory.js        # Fixes the category for /universities etc. routes
│   └── errorHandler.js       # JSON error responses
├── utils/
│   ├── queryHelpers.js       # Filter parsing, code-or-name matching, sorting, pagination
│   ├── analytics.js          # Dashboard aggregations
│   └── rollup.js             # Builds daily rollups from raw logs
├── views/admin/              # Handlebars templates for the dashboard
├── seed/seed.js              # Loads data/*.json into MongoDB
├── data/                     # Source dataset (gitignored)
└── vercel.json               # Vercel Cron schedule
```

The query endpoints use the same helpers. Each controller builds a MongoDB aggregation pipeline from the request's filters. `runQuery` in `utils/queryHelpers.js` then sorts and optionally paginates the results and sends the standard list response. Computed counts are added after pagination unless the sort depends on them.

---

## Documenting new endpoints

The OpenAPI spec is generated at startup by `swagger-jsdoc` from `@openapi` JSDoc comments in `routes/`, `models/` and `middleware/`:

- Document each route with an `@openapi` block directly above it in its `routes/*.js` file.
- Put response schemas next to the Mongoose schema in `models/*.js`.
- Put reusable parameters and responses in `config/swagger.js`, under `components`. Enum values and sort fields there are read from the code, so they stay in sync.

Restart the server and check `/docs` to see your changes.

---

## Contributing

Issues and pull requests are welcome, especially **data corrections** (wrong state, missing website, a course listed at the wrong institution). Please include a source for the correction where you can.

For larger changes, open an issue first to discuss the approach.

---

## License

[MIT](LICENSE)
