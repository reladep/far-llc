# FAR Component Logic Prompt - Codex Implementation

## Role
You are a Frontend Architect. Design the logic for interactive components in the FAR website.

## Components to Build

### 1. Multi-Step Form (Lead Request)

**Use Case:** User requests info from a firm

**State Machine:**
```
IDLE → STEP_1 (contact info) → STEP_2 (needs assessment) → STEP_3 (message) → SUBMITTING → SUCCESS
                                         ↓
                                       VALIDATION_ERROR
```

**Flow:**
- Step 1: Name, Email, Phone (required, validated)
- Step 2: Investment amount, Timeline, Current advisor status
- Step 3: Custom message (optional)
- Submit → API call → Success/Error state

**Files to create/update:**
- `src/components/forms/LeadForm.tsx` — Multi-step form component
- `src/hooks/useLeadForm.ts` — Form state and validation logic

---

### 2. Dynamic Pricing Calculator

**Use Case:** Users see estimated costs for different subscription plans

**Formulas:**
- Free: $0/month (basic features)
- Pro: $19/month (unlimited)
- Enterprise: Custom (contact sales)

**Features:**
- Real-time updates as user toggles options
- Annual/monthly toggle (20% discount for annual)
- Feature comparison matrix

**Files to create:**
- `src/components/calculator/PricingCalculator.tsx` — Interactive pricing
- `src/components/calculator/PlanComparison.tsx` — Feature matrix

---

### 3. Search with Filters

**Use Case:** Main search functionality on /search

**Features:**
- Faceted filtering (fee, AUM, location, specialty)
- Multi-select for some filters
- Sorting (relevance, AUM, fees, rating)
- Pagination (20 per page) + "Load more"
- URL sync (filters in query params)

**State:**
```typescript
interface SearchState {
  query: string;
  filters: {
    feeTypes: string[];
    aumRange: [number, number] | null;
    states: string[];
    specialties: string[];
  };
  sort: 'relevance' | 'aum' | 'fees' | 'rating';
  page: number;
  results: Firm[];
  total: number;
}
```

**Files to create:**
- `src/components/search/SearchFilters.tsx` — Filter sidebar
- `src/components/search/SearchResults.tsx` — Results grid
- `src/hooks/useSearch.ts` — Search state management
- `src/lib/search.ts` — API calls, URL serialization

---

### 4. User Dashboard

**Use Case:** Authenticated user manages saved firms, comparisons, alerts

**Features:**
- Stat cards (saved firms count, alerts, etc.)
- CRUD for favorites
- CRUD for comparisons
- CRUD for alerts
- Activity feed

**Files to create:**
- `src/components/dashboard/StatCard.tsx` — Metric display
- `src/components/dashboard/SavedFirmsList.tsx` — Favorites CRUD
- `src/components/dashboard/ComparisonsList.tsx` — Comparisons CRUD
- `src/components/dashboard/AlertsList.tsx` — Alerts CRUD
- `src/hooks/useUserData.ts` — User data state

---

### 5. Authentication Flow

**Use Case:** User sign up, login, password reset

**Flow:**
```
LOGIN_PAGE
  ↓
SIGNUP / FORGOT_PASSWORD
  ↓
EMAIL_VERIFICATION (signup only)
  ↓
DASHBOARD (authenticated)
```

**Features:**
- NextAuth.js with credentials + OAuth (Google)
- Session management
- Protected routes
- Password reset via email

**Files to create:**
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth config
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SignupForm.tsx`
- `src/components/auth/PasswordResetForm.tsx`
- `src/hooks/useAuth.ts` — Auth state
- `src/middleware.ts` — Route protection

---

## Implementation Requirements

1. Create all files in `/Users/alex/.openclaw/workspace/far/src/`

2. Use existing patterns:
   - Tailwind CSS for styling
   - React hooks for state
   - TypeScript for types
   - Zod for validation (where needed)

3. Keep components modular and reusable

4. Handle all states: loading, error, empty, success

5. Don't duplicate existing code — extend what's there

6. Export components from index files
