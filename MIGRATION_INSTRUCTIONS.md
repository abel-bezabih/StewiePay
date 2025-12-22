# 🔄 Migration Instructions - Merchant Locks

## Steps to Run Migration

1. **Start PostgreSQL** (if not running):
   ```bash
   brew services start postgresql@14
   ```

2. **Run the migration**:
   ```bash
   cd /Users/user/Desktop/StewiePay/apps/backend
   DATABASE_URL="postgresql://stewie:stewiepassword@localhost:5432/stewiepay" yarn prisma migrate dev --name add_merchant_locks
   ```

3. **Generate Prisma Client** (if needed):
   ```bash
   yarn prisma generate
   ```

## What the Migration Adds

The migration will add these columns to the `Card` table:
- `blockedCategories` - TEXT[] (array of MCC codes to block)
- `allowedCategories` - TEXT[] (array of MCC codes to allow)
- `blockedMerchants` - TEXT[] (array of merchant names to block)
- `allowedMerchants` - TEXT[] (array of merchant names to allow)
- `merchantLockMode` - TEXT (either "BLOCK" or "ALLOW")

All arrays default to empty arrays `[]`.

## After Migration

Once the migration completes:
1. The backend will automatically use the new fields
2. The frontend MerchantLockManager component is ready to use
3. You can test merchant locks in the CardDetailScreen

## Troubleshooting

If you get "migration already exists" error:
- The migration was already applied
- Check with: `yarn prisma migrate status`

If you get database connection errors:
- Make sure PostgreSQL is running: `brew services list | grep postgresql`
- Check the DATABASE_URL is correct

---

**Once the migration is complete, merchant locks will be fully functional!** 🚀







