---
title: Unused Environment Variables Analysis
description: Summary of environment variable usage analysis
---

# Unused Environment Variables Analysis

## Summary

After auditing all environment variables across the Bklit monorepo, **all environment variables are actively used**. No unused variables were identified.

## Analysis Results

### All Variables Are Used

Every environment variable defined in the codebase is actively used:

- **Dashboard env.ts** - All 14 variables used
- **Website env.ts** - All 8 variables used  
- **Auth package** - All 6 variables used
- **Analytics package** - All 3 variables used
- **Email package** - 1 variable used (optional but recommended)
- **DB package** - 1 variable used

### Variable Naming Consistency

Some variables have similar names but serve different purposes:

- `POLAR_PRO_PRODUCT_ID` - Server-side (auth package)
- `NEXT_PUBLIC_POLAR_PRO_PLAN_PRODUCT_ID` - Client-side (website app)

Both are needed and correctly implemented.

### Optional Variables

Several variables are marked as optional and correctly implemented:

- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - Optional OAuth
- `TRIGGER_*` variables - Optional for Trigger.dev cloud
- `POLAR_FREE_PRODUCT_ID` - Optional if no free plan
- `BKLIT_DEFAULT_PROJECT` - Optional auto-invite feature
- `RESEND_API_KEY` - Optional but recommended

## Recommendations

1. **No cleanup needed** - All variables are in use
2. **Maintain current structure** - Variable organization is correct
3. **Document optional variables** - Already documented in env var guide

## Conclusion

The codebase is well-maintained with no unused environment variables. All defined variables serve a purpose and are actively used in the application.

