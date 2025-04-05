#!/bin/sh
set -e

export PGPASSWORD="$DB_PASSWORD"

# Check if the database has already been initialized (by testing if the table download_jobs already exists)
TABLE_EXIST=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT 1 FROM information_schema.tables WHERE table_schema='cde' AND table_name='download_jobs';")

if [ "$TABLE_EXIST" = "1" ]; then
    echo "Database already initialized, no action needed."
else
    echo "Initializing the PostgreSQL database..."

    # Main schema
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /usr/src/app/database/1_schema.sql

    # Additional SQL functions
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /usr/src/app/database/3_ckan_process.sql
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /usr/src/app/database/4_create_hexes.sql
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /usr/src/app/database/5_profile_process.sql
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /usr/src/app/database/6_remove_all_data.sql
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /usr/src/app/database/7_contraints.sql
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /usr/src/app/database/8_range_functions.sql

    # Run migrations
    for file in /usr/src/app/database/migrations/*.sql; do
        echo "Applying migration: $file"
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$file"
    done

    echo "Initialization completed successfully!"
fi
