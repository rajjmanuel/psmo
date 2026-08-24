# PSMO Asset Management System

Next.js + Drizzle ORM application for inventory, disposal, procurement, offices, users, reports, and activity logs.

The project is configured for MySQL/MariaDB, so it can run using XAMPP localhost.

## Requirements

- XAMPP with **MySQL** running
- Node.js 20 or newer
- npm
- VS Code

## First-time setup

### 1. Start XAMPP

Open XAMPP Control Panel and start **MySQL**. Apache is optional for this Next.js application.

### 2. Create the database

Open `http://localhost/phpmyadmin`, create a database named:

```text
psmo
```

The default XAMPP MySQL account is usually:

```text
Username: root
Password: empty
Host: 127.0.0.1
Port: 3306
```

### 3. Configure the database connection

The project already includes `.env.local`:

```env
DATABASE_URL=mysql://root:@127.0.0.1:3306/psmo
```

If your MySQL root account has a password, update it:

```env
DATABASE_URL=mysql://root:YOUR_PASSWORD@127.0.0.1:3306/psmo
```

Do not commit `.env.local` because it may contain database credentials.

### 4. Install dependencies

From the project folder:

```powershell
npm.cmd install
```

If PowerShell blocks `npm`, use `npm.cmd` as shown above.

### 5. Create the database tables

Run:

```powershell
.\node_modules\.bin\drizzle-kit.cmd push
```

The command reads the schema from `src/db/schema.ts` and creates or updates the tables in the `psmo` database.

If a previous failed push partially created tables and reports `Multiple primary key defined`, only drop and recreate the `psmo` database if it contains no important data, then run the push command again.

### 6. Start the application

```powershell
.\node_modules\.bin\next.cmd dev
```

Open:

```text
http://localhost:3000
```

## Default accounts

The application seeds these accounts automatically when the users table is empty:

| Username | Password | Role |
| --- | --- | --- |
| `admin` | `admin@123` | Admin |
| `psmo` | `psmo123` | Staff |
| `amt` | `amt123` | AMT |
| `ssmt` | `ssmt123` | SSMT |
| `accounting` | `acct123` | Accounting |

Change the default passwords after the first login in the Users page.

## Deploying on CyberPanel

Create a MySQL database and database user in CyberPanel. Import your existing
database backup if you already have data; otherwise create the tables with
`drizzle-kit push` before starting the application.

In CyberPanel, create a Node.js application for your domain and use the Node.js
version supported by your server (Node.js 20+ recommended). Upload the project
files, including `package.json`, `package-lock.json`, `src`, `public`, and
`drizzle.config.json`, then run these commands in the project directory:

```bash
npm install
npx drizzle-kit push
npm run build
npm run start
```

Set these environment variables in the CyberPanel application settings:

```env
DATABASE_URL=mysql://DB_USER:DB_PASSWORD@127.0.0.1:3306/DB_NAME
SESSION_SECRET=use-a-long-random-production-secret
NODE_ENV=production
```

CyberPanel or the reverse proxy should forward your domain to the Node.js
application port. `next start` uses the `PORT` value supplied by the hosting
panel. Enable SSL/HTTPS before allowing users to sign in. The application also
writes uploaded images to `public/uploads`, so that directory must be writable
and included in your backup plan.

After deployment, open your domain and verify login, settings save, inventory
search, uploads, and the activity logs. Change all default passwords immediately.

## Useful commands

```powershell
# Start development server
.\node_modules\.bin\next.cmd dev

# Check TypeScript
.\node_modules\.bin\tsc.cmd --noEmit

# Generate a migration after changing the schema
.\node_modules\.bin\drizzle-kit.cmd generate

# Apply the schema to MySQL/MariaDB
.\node_modules\.bin\drizzle-kit.cmd push

# Create a production build
.\node_modules\.bin\next.cmd build
```

The package scripts can also be used when npm is available normally:

```powershell
npm run dev
npm run typecheck
npm run build
```

## Troubleshooting

### `DATABASE_URL is required`

Make sure `.env.local` exists in the project root and contains `DATABASE_URL`. Restart the development server after changing it.

For CyberPanel, add `DATABASE_URL` in the Node.js application environment settings instead of committing an environment file.

### Login or sessions fail after deployment

Set a unique `SESSION_SECRET` in the production environment, enable HTTPS, and restart the Node.js application. Never use the development/default secret on a public server.

### `ECONNREFUSED 127.0.0.1:3306`

MySQL is not running, or it is using another port. Start MySQL in XAMPP and update the port in `DATABASE_URL` if necessary.

### `Unknown database 'psmo'`

Create the `psmo` database in phpMyAdmin, then run the Drizzle push command.

### `Access denied for user 'root'`

Update the username or password in `.env.local` to match your MySQL account.

### `Multiple primary key defined`

This usually means a previous schema push stopped after creating some tables. If the database is still empty, drop and recreate `psmo`, then run the push command again. Back up any important data first.

## Project structure

- `src/app`: Next.js pages and API routes
- `src/components`: reusable UI and workflow components
- `src/db/schema.ts`: MySQL database schema
- `src/db/index.ts`: MySQL connection pool and Drizzle instance
- `src/lib/seed.ts`: initial users and sample records
- `drizzle.config.ts`: Drizzle MySQL configuration from `DATABASE_URL`
- `drizzle/`: generated SQL migrations
