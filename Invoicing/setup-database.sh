#!/bin/bash

echo "Setting up Aviata Health Group Invoicing Database..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "Error: PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Create database
echo "Creating database..."
createdb -U postgres aviata_invoicing 2>/dev/null || echo "Database may already exist"

# Run schema
echo "Running schema..."
psql -U postgres -d aviata_invoicing -f backend/schema.sql

echo ""
echo "✅ Database setup complete!"
echo ""
echo "You can now login with:"
echo "  Email: admin@aviatahealth.com"
echo "  Password: admin123"
echo ""
