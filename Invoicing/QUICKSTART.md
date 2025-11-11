# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js v18+ installed (`node --version`)
- [ ] PostgreSQL v14+ installed and running
- [ ] npm or yarn installed

## Quick Setup (5 minutes)

### Step 1: Database Setup

```bash
# Create database
createdb aviata_invoicing

# Or using psql
psql -U postgres -c "CREATE DATABASE aviata_invoicing;"

# Run schema
psql -U postgres -d aviata_invoicing -f backend/schema.sql
```

### Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# The dependencies are already installed
# Update .env file if needed (already created with defaults)

# Start backend server
npm run dev
```

You should see: `🚀 Server is running on http://localhost:5000`

### Step 3: Frontend Setup (in a new terminal)

```bash
# Navigate to frontend
cd frontend

# The dependencies are already installed
# .env.local is already created

# Start frontend server
npm run dev
```

You should see: `Ready on http://localhost:3000`

### Step 4: Login and Test

1. Open browser to `http://localhost:3000`
2. Login with:
   - Email: `admin@aviatahealth.com`
   - Password: `admin123`

3. Create your first facility:
   - Click "Facilities" in navbar
   - Click "Add Facility"
   - Fill in details and create

4. Create an invoice:
   - Click "Invoices" in navbar
   - Click "Create Invoice"
   - Select the facility you created
   - Fill in invoice details

5. Test facility login:
   - Logout
   - Login with facility credentials you created
   - View invoices and upload payment proof

## Common Issues

**Database connection failed:**
```bash
# Check if PostgreSQL is running
pg_ctl status

# Start PostgreSQL if not running
pg_ctl start
```

**Port already in use:**
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill
```

**Module not found errors:**
```bash
# Reinstall dependencies
cd backend && npm install
cd ../frontend && npm install
```

## Development Tips

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:3000`
- API docs available at `http://localhost:5000/health`
- Uploaded files stored in `backend/uploads/`

## Next Steps

1. Change default admin password in production
2. Add your 54 facilities
3. Customize billing periods per facility
4. Start creating invoices
5. Train facility users on payment upload

## Need Help?

Refer to the main [README.md](./README.md) for detailed documentation.
