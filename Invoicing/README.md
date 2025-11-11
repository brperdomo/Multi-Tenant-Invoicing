# Aviata Health Group - Invoicing Platform

A multi-tenant invoicing platform built for Aviata Health Group to manage invoices across 54 facilities. The platform allows the organization to upload invoices for each facility and facilities to upload payment proofs.

## Features

### Organization (Aviata Health Group)
- Dashboard with payment statistics and facility overview
- Create and manage facilities (up to 54)
- Create and upload invoices for specific facilities
- Track invoice status (pending, paid, overdue, disputed)
- View all payment proofs uploaded by facilities
- Real-time audit tracking
- Support for multiple billing periods (monthly, quarterly, semi-annual)

### Facilities
- Dedicated dashboard with invoice overview
- View invoices assigned to their facility
- Download invoice files
- Upload payment proofs with details
- Track payment status

## Tech Stack

**Backend:**
- Node.js with Express
- TypeScript
- PostgreSQL
- JWT Authentication
- Multer for file uploads
- Bcrypt for password hashing

**Frontend:**
- Next.js 14 (App Router)
- React
- TypeScript
- Tailwind CSS
- Axios for API calls
- React Hook Form

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## Installation & Setup

### 1. Clone the Repository

```bash
cd /Users/bperdomo/Desktop/claude-projects/Invoicing
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE aviata_invoicing;

# Exit psql
\q
```

Run the schema to create tables:

```bash
psql -U postgres -d aviata_invoicing -f backend/schema.sql
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies (already done)
# npm install

# Create .env file
cp .env.example .env
```

Edit `.env` file with your database credentials:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=aviata_invoicing
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000

MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

Start the backend server:

```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies (already done)
# npm install

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Default Login Credentials

### Organization (Aviata Health Group)
- Email: `admin@aviatahealth.com`
- Password: `admin123`

**Important:** Change this password in production!

### Facilities
Facilities must be created by the organization through the platform. After creation, they can log in with their assigned email and password.

## Usage Guide

### For Organization Admin

1. **Login** at `http://localhost:3000/login`
2. **Create Facilities:**
   - Navigate to "Facilities" in the navbar
   - Click "Add Facility"
   - Fill in facility details (name, email, password, billing period)
   - Click "Create Facility"

3. **Create Invoices:**
   - Navigate to "Invoices"
   - Click "Create Invoice"
   - Select facility, enter invoice details, and optionally upload an invoice file
   - Click "Create Invoice"

4. **Track Payments:**
   - View dashboard for overview of all facilities' payment status
   - Navigate to "Payments" to see all uploaded payment proofs
   - Update invoice status as needed

### For Facility Users

1. **Login** with credentials provided by organization
2. **View Invoices:**
   - Dashboard shows recent invoices and statistics
   - Navigate to "Invoices" to see all invoices
   - Click "View" to download invoice files

3. **Upload Payment Proof:**
   - Find the invoice you've paid
   - Click "Upload Payment"
   - Fill in payment details (date, method, reference number)
   - Upload proof of payment (receipt, bank statement, etc.)
   - Click "Upload Payment Proof"

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login for both organization and facilities
- `GET /api/auth/profile` - Get current user profile

### Facilities (Organization only)
- `POST /api/facilities` - Create new facility
- `GET /api/facilities` - Get all facilities
- `GET /api/facilities/:id` - Get facility by ID
- `PUT /api/facilities/:id` - Update facility
- `DELETE /api/facilities/:id` - Delete facility

### Invoices
- `POST /api/invoices` - Create invoice (Organization)
- `GET /api/invoices` - Get all invoices (filtered by role)
- `GET /api/invoices/stats` - Get invoice statistics (Organization)
- `GET /api/invoices/:id` - Get invoice details
- `PUT /api/invoices/:id/status` - Update invoice status (Organization)
- `DELETE /api/invoices/:id` - Delete invoice (Organization)

### Payments
- `POST /api/payments` - Upload payment proof (Facility)
- `GET /api/payments/invoice/:invoice_id` - Get payment proofs for invoice
- `GET /api/payments/all` - Get all payment proofs (Organization)
- `DELETE /api/payments/:id` - Delete payment proof

## Project Structure

```
Invoicing/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth, upload middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Helper functions
│   │   └── server.ts       # Express app entry point
│   ├── uploads/            # Uploaded files
│   ├── schema.sql          # Database schema
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/                # Next.js app directory
│   │   ├── login/          # Login page
│   │   ├── organization/   # Organization pages
│   │   │   ├── dashboard/
│   │   │   ├── facilities/
│   │   │   ├── invoices/
│   │   │   └── payments/
│   │   └── facility/       # Facility pages
│   │       ├── dashboard/
│   │       └── invoices/
│   ├── components/         # React components
│   │   └── layout/         # Layout components
│   ├── lib/                # Utilities
│   │   ├── api.ts          # API client
│   │   └── auth.tsx        # Auth context
│   ├── package.json
│   └── next.config.js
└── README.md
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Organization vs Facility)
- SQL injection prevention with parameterized queries
- File upload validation
- CORS protection
- Helmet.js security headers
- Audit logging for all actions

## Future Enhancements

- Email notifications for new invoices
- Automated overdue invoice detection
- Bulk invoice upload
- Export reports to CSV/Excel
- Payment reminders
- Multi-file uploads per invoice
- Invoice templates
- Two-factor authentication
- Advanced analytics dashboard

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `pg_ctl status`
- Check database credentials in `.env`
- Verify database exists: `psql -U postgres -l`

### File Upload Issues
- Check `uploads/` directory permissions
- Verify `MAX_FILE_SIZE` in `.env`
- Ensure file types are allowed in `upload.ts` middleware

### Port Already in Use
- Backend (5000): `lsof -ti:5000 | xargs kill`
- Frontend (3000): `lsof -ti:3000 | xargs kill`

## Support

For issues or questions, please contact the development team.

## License

Proprietary - Aviata Health Group
