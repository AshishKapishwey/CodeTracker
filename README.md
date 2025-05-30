# CodeTracker

A lightweight Node.js authentication & profile-tracking app built with Express and MongoDB.

## Features

* **User registration & login**
* **Password hashing** with bcrypt
* **JWT-based authentication**
* **Mongoose** models for User & Profile IDs
* Sample frontend form to test API

## Prerequisites

* **Node.js** v14+
* **MongoDB** (local or cloud URI)

## Installation

1. **Clone the repo**

   ```bash
   git clone https://github.com/your-username/CodeTracker.git
   cd CodeTracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create your `.env`**

   * Copy the example template:

     ```bash
     cp .env.example .env
     ```
   * Open `.env` and fill in your values.

## Environment Variables

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/code-tracker
JWT_SECRET=your-secret-key
```

* `PORT` — server port (default 3000)
* `MONGO_URI` — MongoDB connection string
* `JWT_SECRET` — secret for signing JWT tokens

## Running the App

```bash
npm start
```

Server runs at:

```
http://localhost:${PORT}
```

## API Endpoints

| Route                | Method | Description                  |
| -------------------- | ------ | ---------------------------- |
| `/api/auth/register` | POST   | Register a new user          |
| `/api/auth/login`    | POST   | Login & receive JWT token    |
| `/api/profile`       | GET    | Retrieve user profile (auth) |

## Project Structure

```
CodeTracker/
├─ models/
│  ├─ profileIds.js
│  └─ user.js
├─ app.js
├─ package.json
├─ package-lock.json
├─ sample.html
├─ .env.example
└─ README.md
```

* **models/** — Mongoose schema definitions
* **app.js** — Express server & route setup
* **sample.html** — basic frontend form for testing


