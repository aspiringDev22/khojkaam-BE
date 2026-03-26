# Khojkaam Backend (Node.js + Supabase)

## Setup

1. Copy `.env.example` to `.env`
2. Fill values:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PHONE_AUTH_EMAIL_DOMAIN` (optional)
   - `PORT`
3. Run SQL in Supabase SQL Editor:
   - `supabase/profiles_schema.sql`
4. In Supabase Dashboard:
   - Authentication -> Providers -> Email: keep enabled
   - Phone provider is not required in this backend
5. Start server:

```bash
npm run dev
```

## Auth APIs

Base URL: `http://localhost:3000` (or your `PORT`)

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout` (Bearer token required)
- `GET /api/auth/me` (Bearer token required)

This backend accepts `phone + password` on API and maps phone to an internal email for Supabase Auth.
Signup uses Supabase Admin API (`createUser`) with `email_confirm=true`, so no verification email is sent.

### Signup body

```json
{
  "phone": "+919876543210",
  "password": "StrongPass@123",
  "role": "helper",
  "name": "Ravi Kumar",
  "city": "Delhi"
}
```

### Login body

```json
{
  "phone": "+919876543210",
  "password": "StrongPass@123"
}
```

Note: `signup` returns `session: null` by design. Use `login` after signup to get `access_token`.

## Profile APIs

All profile routes require `Authorization: Bearer <access_token>`.

- `GET /api/profiles/me`
- `PUT /api/profiles/me`
- `GET /api/profiles?role=helper&city=Delhi&limit=20&page=1`

### Update profile body

```json
{
  "role": "helper",
  "name": "Ravi K",
  "city": "Noida"
}
```

### Unlock helper contact (owner dashboard)

- `POST /api/profiles/unlock-contact` (Bearer token required, owner only)

Request body:

```json
{
  "helper_id": "0f7ee920-168c-4f42-9f89-bf91698ea12d"
}
```

cURL:

```bash
curl --request POST "http://localhost:3000/api/profiles/unlock-contact" \
  --header "Authorization: Bearer <OWNER_ACCESS_TOKEN>" \
  --header "Content-Type: application/json" \
  --data "{\"helper_id\":\"0f7ee920-168c-4f42-9f89-bf91698ea12d\"}"
```

## Jobs APIs

- `POST /api/jobs` (Bearer token required, owner only)
- `GET /api/jobs?city=Delhi&shop_type=salon&is_active=true&limit=20&page=1`
- `GET /api/jobs/my` (Bearer token required)
- `GET /api/jobs/:id`

### Create job body

```json
{
  "title": "Hair Stylist Needed",
  "description": "Looking for an experienced stylist for evening shift.",
  "shop_type": "salon",
  "city": "Delhi",
  "salary_range": "15000-22000",
  "is_active": true,
  "is_featured": false
}
```
