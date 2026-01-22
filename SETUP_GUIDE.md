# EROS Ticketing System - Beginner Setup Guide

👋 **Welcome to the EROS Ticketing System!**

This guide is designed for absolute beginners. We'll walk you through setting up this application from scratch on your computer.

---

## 1. Prerequisites (What you need first)

Before we start, make sure you have these installed:

1.  **Node.js**: This runs the code.
    - Download version **20 or higher** from [nodejs.org](https://nodejs.org/).
    - Check if it's installed by opening your terminal/command prompt and typing: `node -v`
2.  **pnpm**: A fast tool to install dependencies.
    - After installing Node.js, run this command in your terminal: `npm install -g pnpm`
3.  **PostgreSQL**: The database.
    - The easiest way is to use a cloud provider like [Supabase](https://supabase.com/) or [Neon](https://neon.tech/) (free tier is fine).
    - OR install [PostgreSQL locally](https://www.postgresql.org/download/).

---

## 2. Installation (Getting the code ready)

1.  **Open your terminal** and navigate to this project folder.
2.  **Install project dependencies**:
    Running this command downloads all the libraries the project needs to work.
    ```bash
    pnpm install
    ```

---

## 3. Environment Setup (Connecting things)

The application needs passwords and keys to work. These live in a special file called `.env`.

1.  **Create your .env file**:
    The project comes with an example file. Copy it to create your real one:
    ```bash
    cp .env.example .env
    ```
    *(On Windows, you might need to copy/paste the file manually in File Explorer and rename it to just `.env`)*

2.  **Edit the .env file**:
    Open `.env` in any text editor (Notepad, VS Code, etc.).
    - Find `DATABASE_URL`.
    - Replace the value with your actual PostgreSQL connection string (from Supabase/Neon/Local).
    - Example: `DATABASE_URL="postgresql://user:password@localhost:5432/eros_db"`
    - Save the file.

---

## 4. Database Setup (Building the structure)

Now that we're connected, let's build the tables and add some starting data.

1.  **Generate the client**:
    This tells the code how to talk to your database.
    ```bash
    pnpm run db:generate
    ```

2.  **Push the schema**:
    This actually creates the tables (Users, Tickets, etc.) in your database.
    ```bash
    pnpm run db:push
    ```

3.  **Seed the database**:
    This creates an **Admin User** so you can log in immediately.
    ```bash
    pnpm run db:seed
    ```

---

## 5. Running the App (Liftoff! 🚀)

1.  **Start the server**:
    ```bash
    pnpm run dev
    ```

2.  **Open your browser**:
    Go to [http://localhost:3000](http://localhost:3000)

---

## 6. Logging In

Use the default admin account created by the seed script:

- **Email**: `admin@eros.com`
- **Password**: `password` (or whatever is logged in your terminal during seeding)

---

## Common Questions

**Q: I see "command not found: pnpm"**
A: You probably need to install it. Run `npm install -g pnpm`.

**Q: The database connection failed.**
A: Double-check your `DATABASE_URL` in the `.env` file. Make sure your database password doesn't contain special characters that confuse the URL (if so, they need to be "URL encoded").

**Q: Changing code doesn't show up?**
A: Most changes show up instantly. If you change the database schema (`schema.prisma`), you must run `pnpm run db:push` again.
