# depthanddopt

## Product catalog storage

In Studio, open **Products** to create a catalog item. Choose an existing category or add a new category in the same form, then select Supabase or MongoDB Atlas. Product data and uploaded product photos use that selected destination. Supabase photos use the configured Supabase Storage bucket; MongoDB photos use GridFS.

Run `npm run db:init` for Supabase/Postgres and `npm run db:init-atlas` for MongoDB before using custom products and categories. MongoDB must be configured with `MONGODB_URI`; `MONGODB_DB` optionally selects its database.

The Studio usage panel reports Supabase database size against `PG_CAPACITY_MB` (450 MB by default), Supabase product-photo bytes, and MongoDB data plus index size. Set `MONGODB_CAPACITY_MB` to the storage limit for the configured Atlas tier, and `SUPABASE_STORAGE_CAPACITY_MB` to the product-photo storage limit for your Supabase plan. Those provider quotas vary, so no default is assumed for either limit. The usage values are estimates of database data/index size and saved photo bytes, respectively; check each provider dashboard for billing and quota enforcement.