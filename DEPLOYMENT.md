# Deployment

## Recommended: one Node service

The backend serves `frontend/build`, so the simplest deployment is one web service from the repository root.

Build command:

```bash
npm run install:all && npm run build
```

Start command:

```bash
npm start
```

Set the service `PORT` using the value supplied by the hosting provider. Do not commit or upload `backend/config/config.env`; configure these values in the provider's environment settings instead:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://<database-user>:<url-encoded-password>@<cluster-host>/event-management
JWT_SECRET=<long-random-secret>
CLIENT_URL=https://<your-service-domain>
CLIST_USERNAME=<clist-username>
CLIST_API_KEY=<clist-api-key>
EMAIL_SERVICE=gmail
EMAIL_USER=<smtp-account>
EMAIL_PASSWORD=<gmail-app-password>
SMS_API_KEY=<optional-provider-key>
SMS_API_URL=https://www.fast2sms.com/dev/bulkV2
SMS_ROUTE=q
SMS_SENDER_ID=FSTSMS
REDIS_HOST=<optional-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<optional-redis-password>
```

`EMAIL_*`, `SMS_*`, and `REDIS_*` are optional for core startup. Redis falls back to in-memory caching when unavailable, and email/SMS reminders are skipped when their credentials are absent.

## MongoDB Atlas checklist

1. Create a database user and use its password in `MONGO_URI`.
2. URL-encode special characters in the password (`@`, `#`, `/`, `:` and similar).
3. Add the deployment provider's outbound IP addresses in Atlas Network Access. For temporary testing only, `0.0.0.0/0` allows access from anywhere.
4. Confirm the database user has permission to read and write `event-management`.

## Separate frontend hosting

Build the frontend with:

```bash
cd frontend
npm install
npm run build
```

The frontend uses same-origin `/api` requests. If it is hosted separately from the backend, configure a reverse proxy from `/api` to the backend, or add a frontend API base URL abstraction before deploying it separately. Set the backend `CLIENT_URL` to the frontend's HTTPS origin.

## Before going live

- Rotate any credentials that have been exposed during development.
- Use HTTPS for both frontend and backend.
- Confirm the deployed service can register and log in a test user.
- Confirm profile uploads work and that the hosting provider supplies persistent storage if uploads must survive restarts.
- Review reminder scheduler logs and configure an external Redis service if cache persistence is required.
