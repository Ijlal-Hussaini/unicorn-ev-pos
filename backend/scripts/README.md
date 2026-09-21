# Database Migration Scripts

## Update Refunded Sales Script

This script updates existing sales in the database to properly reflect their refund status.

### What it does:

1. Finds all approved/completed refunds in the system
2. Groups refunds by their associated sales
3. Updates each sale with:
   - Correct `refundedQuantity` (total units refunded)
   - Correct `refundedAmount` (total amount refunded)
   - Sets `isFullyRefunded` flag if all units are refunded
   - Sets `isPartiallyRefunded` flag if some units are refunded
   - Changes `status` to "refunded" for fully refunded sales

### When to run:

- After upgrading to the new refund system
- If you notice sales with refunds still showing as "completed"
- To fix any data inconsistencies

### How to run:

```bash
cd backend
node scripts/updateRefundedSales.js
```

### What to expect:

The script will:
- Connect to your MongoDB database
- Process all sales with refunds
- Display progress for each sale updated
- Show a summary of changes made
- Display current database statistics

### Example output:

```
✅ Connected to MongoDB

📊 Found 3 approved/completed refunds

🔄 Processing 3 sales with refunds...

✅ Updated INV-17711503358B6-FB18: FULLY REFUNDED (1/1 units, Rs 230000)
✅ Updated INV-177114898239E-E15C: PARTIALLY REFUNDED (1/2 units, Rs 2000)

📈 Summary:
   - Updated: 2 sales
   - Already correct: 1 sales
   - Total processed: 3 sales

📊 Current Database State:
   - Fully refunded sales: 2
   - Partially refunded sales: 1
   - Sales with "refunded" status: 2

✅ Migration completed successfully!
```

### Safety:

- The script is safe to run multiple times
- It only updates sales that need updating
- Uses MongoDB transactions for data integrity
- No data is deleted, only updated

### After running:

1. Verify in your admin dashboard that refunded sales show correct status
2. Check that revenue calculations exclude refunded amounts
3. Confirm that sales history displays "refunded" status properly
