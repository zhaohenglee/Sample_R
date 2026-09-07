import { db, schema } from "@/db";

// Plaid personal_finance_category primary values mapped to friendlier names.
export const DEFAULT_CATEGORIES: { name: string; plaidPrimary: string }[] = [
  { name: "Income", plaidPrimary: "INCOME" },
  { name: "Transfers In", plaidPrimary: "TRANSFER_IN" },
  { name: "Transfers Out", plaidPrimary: "TRANSFER_OUT" },
  { name: "Loan Payments", plaidPrimary: "LOAN_PAYMENTS" },
  { name: "Bank Fees", plaidPrimary: "BANK_FEES" },
  { name: "Entertainment", plaidPrimary: "ENTERTAINMENT" },
  { name: "Food & Drink", plaidPrimary: "FOOD_AND_DRINK" },
  { name: "Shopping", plaidPrimary: "GENERAL_MERCHANDISE" },
  { name: "Home", plaidPrimary: "HOME_IMPROVEMENT" },
  { name: "Medical", plaidPrimary: "MEDICAL" },
  { name: "Personal Care", plaidPrimary: "PERSONAL_CARE" },
  { name: "Services", plaidPrimary: "GENERAL_SERVICES" },
  { name: "Government & Nonprofit", plaidPrimary: "GOVERNMENT_AND_NON_PROFIT" },
  { name: "Transportation", plaidPrimary: "TRANSPORTATION" },
  { name: "Travel", plaidPrimary: "TRAVEL" },
  { name: "Rent & Utilities", plaidPrimary: "RENT_AND_UTILITIES" },
  { name: "Other", plaidPrimary: "OTHER" },
];

export async function ensureDefaultCategories() {
  await db.insert(schema.categories).values(DEFAULT_CATEGORIES).onConflictDoNothing();
}
