import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

const env = (process.env.PLAID_ENV ?? "sandbox") as keyof typeof PlaidEnvironments;

export const plaid = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[env],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  }),
);

export const plaidProducts = (process.env.PLAID_PRODUCTS ?? "transactions")
  .split(",")
  .map((p) => p.trim() as Products);

export const plaidCountryCodes = (process.env.PLAID_COUNTRY_CODES ?? "US")
  .split(",")
  .map((c) => c.trim() as CountryCode);
