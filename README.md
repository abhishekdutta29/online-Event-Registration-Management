# Online Event Registration & Management System (EventVibe)

A full-stack web application designed for registering and managing events. The application is built with a Node.js + Express backend, MySQL database (featuring an automatic zero-config SQLite fallback for local testing), and a responsive plain HTML/CSS/JavaScript frontend styled with Bootstrap 5 and custom dark glassmorphism aesthetics.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, `jsonwebtoken` (JWT Auth), `bcryptjs` (Password Hashing), `dotenv`
- **Database**: MySQL (using `mysql2`), with automatic fallback to file-based **SQLite** (`sqlite3`)
- **Frontend**: Plain HTML5, CSS3 (glassmorphism/gradients), Vanilla JavaScript, Bootstrap 5, Bootstrap Icons

---

## 📂 Project Structure

```
event/
├── backend/
│   ├── controllers/
│   │   ├── adminController.js         # Event CRUD, registrants, admin statistics
│   │   ├── authController.js          # Registration, login, current session API
│   │   ├── eventController.js         # Public event queries and details lookup
│   │   └── registrationController.js  # User bookings and cancellations
│   ├── middleware/
│   │   └── authMiddleware.js          # JWT token decoding and role checking
│   ├── models/
│   │   └── db.js                      # Database connection and fallback driver logic
│   └── server.js                      # Express app router, static assets mounting
├── database/
│   ├── schema.sql                     # Production MySQL schema
│   └── seeds.sql                      # Seeding definitions for initial data
├── frontend/
│   ├── css/
│   │   └── style.css                  # Custom premium glassmorphism styling
│   ├── js/
│   │   └── app.js                     # Global utilities, session controls, dynamic navbar
│   ├── index.html                     # Event list search and browse page
│   ├── login.html                     # Login card page
│   ├── register.html                  # Sign-up page
│   ├── event-details.html             # Detailed event metadata and booking button
│   ├── dashboard.html                 # User registrations history and cancellations
│   └── admin.html                     # Admin statistics, events editor, and user list
├── .env                               # Server & MySQL environment variables
├── package.json                       # Scripts and node dependencies
└── README.md                          # Documentation and setup instructions
```

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18 or higher recommended)
- Optional: A running local MySQL database (if you prefer SQLite, no additional installation is needed).

### Installation Instructions
1. Clone the project files into your workspace directory.
2. Open a terminal in the root of the workspace directory.
3. Install dependencies by running:
   ```bash
   npm install
   ```

### Database & Environment Setup
Copy the configuration environment variables from `.env` (it will be created automatically, but you can customize it):
```env
PORT=3000
JWT_SECRET=super_secret_key_123_abc_xyz_events
DB_TYPE=sqlite         # Set to 'mysql' to use a MySQL server, or 'sqlite' for zero-config fallback
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=event_registration
```

- **SQLite Fallback (Recommended for testing)**: If `DB_TYPE` is set to `sqlite`, or if a connection to your MySQL server fails, the application automatically initializes and seeds a local SQLite database file `database/event_registration.db`. No manual database imports are required!
- **MySQL Setup**: If using a MySQL server, create a database named `event_registration` and import the `database/schema.sql` and `database/seeds.sql` files manually using:
  ```bash
  mysql -u root -p event_registration < database/schema.sql
  mysql -u root -p event_registration < database/seeds.sql
  ```

### Running the App
Start the Node.js Express server:
```bash
npm start
```
The server will boot up and print the connection information:
```
Connected to local SQLite database at: C:\Users\hp\Desktop\event\database\event_registration.db
=================================================
  Event Registration system running on port 3000
  Local Address: http://localhost:3000
=================================================
```
Open your browser and navigate to **`http://localhost:3000`** to browse the app.

---

## 🔐 Default Login Credentials

Seeded into the database for immediate testing:

- **Admin Account**:
  - **Email**: `admin@event.com`
  - **Password**: `admin123`
  - **Role**: `admin`
- **Standard User Account**:
  - **Email**: `user@event.com`
  - **Password**: `user123`
  - **Role**: `user`

---

## 📊 Database ER Diagram

The database structure separates concerns between accounts, event details, and booking states:

```mermaid
erDiagram
    users {
        int id PK "AUTOINCREMENT"
        string username UNIQUE "not null"
        string email UNIQUE "not null"
        string password "bcrypt hash, not null"
        enum role "admin, user, default: user"
        timestamp created_at "default: current_timestamp"
    }
    events {
        int id PK "AUTOINCREMENT"
        string title "not null"
        text description
        string category "not null"
        date date "not null"
        time time "not null"
        string location "not null"
        int capacity "not null"
        int spots_left "not null"
        timestamp created_at "default: current_timestamp"
    }
    registrations {
        int id PK "AUTOINCREMENT"
        int user_id FK "references users(id) ON DELETE CASCADE"
        int event_id FK "references events(id) ON DELETE CASCADE"
        enum status "confirmed, cancelled, default: confirmed"
        timestamp registered_at "default: current_timestamp"
    }

    users ||--o{ registrations : registers
    events ||--o{ registrations : contains
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Create a new user account.
- `POST /api/auth/login` - Authenticate credentials and return a signed JWT.
- `GET /api/auth/me` - Retrieve metadata of the currently authenticated session (requires token).

### Public Event Browsing
- `GET /api/events` - Retrieve list of events. Supports query filters:
  - `?search=<keyword>` (filters by matching title, description, or location)
  - `?category=<category>` (filters by category)
- `GET /api/events/categories` - Fetch list of distinct event categories.
- `GET /api/events/:id` - Fetch details for a specific event (date, location, remaining spots).

### User Bookings (Requires Token)
- `POST /api/registrations` - Register current user for an event (checks spots remaining and avoids duplicate bookings).
- `GET /api/registrations/my` - Fetch booking history for the logged-in user.
- `PUT /api/registrations/:id/cancel` - Cancel registration, updating status to `cancelled` and releasing the capacity spot.

### Admin Panel (Requires Token & Admin Role)
- `GET /api/admin/stats` - Fetch total counts of events, users, and active registrations for the dashboard.
- `POST /api/admin/events` - Create a new event.
- `PUT /api/admin/events/:id` - Edit event metadata. Safe updates check and adjust capacity spots correctly.
- `DELETE /api/admin/events/:id` - Delete an event (cascades and deletes associated registrations).
- `GET /api/admin/events/:id/registrants` - Fetch a detailed list of users registered for a specific event (including confirmation status).
