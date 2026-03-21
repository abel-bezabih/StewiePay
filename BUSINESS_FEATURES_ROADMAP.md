# Business Features Roadmap

## Current State

### ✅ Backend (Already Implemented)

**Organizations Module:**
- ✅ Create organizations (`POST /api/organizations`)
- ✅ List user's organizations (`GET /api/organizations`)
- ✅ Add members to organizations (`POST /api/organizations/:id/members`)
- ✅ Organization roles (OWNER, ADMIN, MEMBER)
- ✅ Organizations can own cards
- ✅ Organizations can have top-ups
- ✅ User roles include `BUSINESS` role

**Database Schema:**
- ✅ `Organization` model
- ✅ `OrganizationMember` model with roles
- ✅ `User.role` enum (INDIVIDUAL, BUSINESS, ADMIN)
- ✅ Cards can be owned by `ownerUserId` or `ownerOrgId`

### ❌ Mobile App (Not Yet Implemented)

- ❌ No organization management screens
- ❌ No organization switcher
- ❌ No create organization UI
- ❌ No organization member management UI
- ❌ No organization-specific cards view
- ❌ No business account type selection during signup

---

## Phase 1: Organization Management (Core Features)

### 1.1 Organization Switcher
**Priority: HIGH**

**What:** Allow users to switch between personal and organization accounts.

**Implementation:**
- Add organization switcher in header/navigation
- Show user's organizations + "Personal" account
- Store selected organization context in app state
- Update API calls to include `orgId` when organization is selected

**Files to Create:**
- `apps/mobile/src/components/organizations/OrganizationSwitcher.tsx`
- `apps/mobile/src/contexts/OrganizationContext.tsx` (optional)

**API Integration:**
- Use existing `OrganizationsAPI.list()` endpoint
- Filter cards/transactions by `orgId` when organization selected

---

### 1.2 Create Organization Screen
**Priority: HIGH**

**What:** Screen for users to create a new business/organization.

**Features:**
- Form with organization name
- Optional: Organization description, logo upload
- Button to create organization
- Redirect to organization dashboard after creation

**Files to Create:**
- `apps/mobile/src/screens/CreateOrganizationScreen.tsx`
- Add to navigation stack

**API Integration:**
- `OrganizationsAPI.create({ name })`

---

### 1.3 Organization Dashboard
**Priority: HIGH**

**What:** Main screen showing organization overview.

**Features:**
- Organization name and info
- Quick stats (total cards, active cards, total balance)
- Recent transactions
- Cards list (filtered by organization)
- Actions: Create card, Add member, Settings

**Files to Create:**
- `apps/mobile/src/screens/OrganizationDashboardScreen.tsx`

**Backend Updates:**
- May need analytics endpoints for organization stats

---

### 1.4 Organization Cards Management
**Priority: HIGH**

**What:** View and manage cards belonging to an organization.

**Implementation:**
- Filter `CardsAPI.list()` by `ownerOrgId`
- Show organization cards in separate section
- "Create Card" button should include `orgId` when organization is selected
- Card detail screen should show organization context

**Files to Update:**
- `apps/mobile/src/screens/CardsScreenStewie.tsx` - Add organization filter
- `apps/mobile/src/screens/CreateCardScreenStewie.tsx` - Include `orgId` in creation
- `apps/mobile/src/api/client.ts` - Update `CardsAPI.create()` to accept `orgId`

---

### 1.5 Organization Members Management
**Priority: MEDIUM**

**What:** Screen to manage organization members (add, remove, change roles).

**Features:**
- List of organization members
- Show member name, email, role
- Actions: Change role, Remove member
- "Add Member" button (search by email or user ID)
- Only OWNER and ADMIN can manage members

**Files to Create:**
- `apps/mobile/src/screens/OrganizationMembersScreen.tsx`
- `apps/mobile/src/components/organizations/MemberList.tsx`
- `apps/mobile/src/components/organizations/AddMemberModal.tsx`

**API Integration:**
- `OrganizationsAPI.addMember(orgId, { userId, role })`
- May need endpoint to list members: `GET /api/organizations/:id/members`
- May need endpoint to remove member: `DELETE /api/organizations/:id/members/:userId`

**Backend Updates Needed:**
- Add `GET /api/organizations/:id/members` endpoint
- Add `DELETE /api/organizations/:id/members/:userId` endpoint
- Add `PATCH /api/organizations/:id/members/:userId` endpoint (change role)

---

## Phase 2: Business Account Features (Enhanced)

### 2.1 Business Account Signup Flow
**Priority: MEDIUM**

**What:** Allow users to sign up as a business account.

**Implementation:**
- Add "Account Type" selection in signup screen
- Options: "Personal" or "Business"
- If Business: Prompt for organization name
- Create organization automatically on signup
- Set `User.role = BUSINESS` (optional, or keep as INDIVIDUAL)

**Files to Update:**
- `apps/mobile/src/screens/SignupScreen.tsx` or create `SignupScreenStewie.tsx`
- Update signup API call to include organization creation

**Backend Updates:**
- Update `POST /api/auth/signup` to optionally create organization
- Or create organization in separate step after signup

---

### 2.2 Organization Settings
**Priority: LOW**

**What:** Screen to manage organization settings.

**Features:**
- Edit organization name
- Upload organization logo
- Delete organization (OWNER only)
- Transfer ownership (OWNER only)
- Leave organization (MEMBER/ADMIN)

**Files to Create:**
- `apps/mobile/src/screens/OrganizationSettingsScreen.tsx`

**Backend Updates:**
- Add `PATCH /api/organizations/:id` endpoint (update name, logo)
- Add `DELETE /api/organizations/:id` endpoint (delete org)
- Add `POST /api/organizations/:id/transfer-ownership` endpoint
- Add `POST /api/organizations/:id/leave` endpoint

---

### 2.3 Organization Analytics
**Priority: LOW**

**What:** Analytics dashboard for organizations.

**Features:**
- Spending by category
- Spending trends (daily, weekly, monthly)
- Top merchants
- Card usage statistics
- Export reports

**Files to Create:**
- `apps/mobile/src/screens/OrganizationAnalyticsScreen.tsx`

**Backend Updates:**
- Add organization-filtered analytics endpoints
- Reuse existing analytics service with `orgId` filter

---

## Phase 3: Multi-Organization Features (Advanced)

### 3.1 Organization Permissions
**Priority: LOW**

**What:** Fine-grained permissions for organization members.

**Features:**
- Custom permission sets
- Control: Create cards, View transactions, Manage members, etc.
- Role-based access control (RBAC)

**Backend Updates:**
- Extend `OrganizationMember` model with permissions JSON field
- Update authorization checks in services

---

### 3.2 Organization Invitations
**Priority: LOW**

**What:** Invite users by email to join organization.

**Features:**
- Send invitation email
- Accept/decline invitation flow
- Invitation tokens
- Pending invitations list

**Backend Updates:**
- Add `OrganizationInvitation` model
- Email service integration for invitations
- Invitation acceptance endpoints

---

## Implementation Order (Recommended)

### Sprint 1: Core Organization Features
1. ✅ **Organization Switcher** (1-2 days)
   - Create switcher component
   - Add organization context
   - Update navigation/header

2. ✅ **Create Organization Screen** (1 day)
   - Simple form with name
   - API integration

3. ✅ **Organization Dashboard** (2-3 days)
   - Stats display
   - Cards list
   - Quick actions

4. ✅ **Organization Cards** (2 days)
   - Filter cards by organization
   - Create cards for organization
   - Update card screens

**Estimated Time: 6-8 days**

---

### Sprint 2: Member Management
5. ✅ **List Organization Members** (1 day)
   - Backend endpoint: `GET /api/organizations/:id/members`
   - Member list screen

6. ✅ **Add Member** (2 days)
   - Backend endpoint: `POST /api/organizations/:id/members`
   - Add member modal
   - User search/selection

7. ✅ **Manage Member Roles** (1-2 days)
   - Backend endpoint: `PATCH /api/organizations/:id/members/:userId`
   - Role change UI

8. ✅ **Remove Member** (1 day)
   - Backend endpoint: `DELETE /api/organizations/:id/members/:userId`
   - Remove confirmation

**Estimated Time: 5-6 days**

---

### Sprint 3: Enhanced Features
9. ✅ **Organization Settings** (2-3 days)
10. ✅ **Business Signup Flow** (1-2 days)
11. ✅ **Organization Analytics** (3-5 days)

**Estimated Time: 6-10 days**

---

## API Client Updates Needed

**Add to `apps/mobile/src/api/client.ts`:**

```typescript
export const OrganizationsAPI = {
  // List user's organizations
  list: async () => {
    return api.get('/organizations');
  },

  // Create new organization
  create: async (data: { name: string }) => {
    return api.post('/organizations', data);
  },

  // Get organization details
  get: async (id: string) => {
    return api.get(`/organizations/${id}`);
  },

  // Update organization
  update: async (id: string, data: { name?: string }) => {
    return api.patch(`/organizations/${id}`, data);
  },

  // List organization members
  listMembers: async (id: string) => {
    return api.get(`/organizations/${id}/members`);
  },

  // Add member to organization
  addMember: async (id: string, data: { userId: string; role: 'OWNER' | 'ADMIN' | 'MEMBER' }) => {
    return api.post(`/organizations/${id}/members`, data);
  },

  // Update member role
  updateMember: async (orgId: string, userId: string, data: { role: 'OWNER' | 'ADMIN' | 'MEMBER' }) => {
    return api.patch(`/organizations/${orgId}/members/${userId}`, data);
  },

  // Remove member from organization
  removeMember: async (orgId: string, userId: string) => {
    return api.delete(`/organizations/${orgId}/members/${userId}`);
  },
};
```

---

## Backend Endpoints Needed

### Already Implemented ✅
- `POST /api/organizations` - Create organization
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations/:id/members` - Add member

### Need to Implement ❌
- `GET /api/organizations/:id` - Get organization details
- `PATCH /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization
- `GET /api/organizations/:id/members` - List organization members
- `PATCH /api/organizations/:id/members/:userId` - Update member role
- `DELETE /api/organizations/:id/members/:userId` - Remove member
- `POST /api/organizations/:id/transfer-ownership` - Transfer ownership
- `POST /api/organizations/:id/leave` - Leave organization

---

## Design Considerations

### UI/UX Patterns

1. **Organization Switcher:**
   - Top-right in header (similar to profile menu)
   - Dropdown/modal showing organizations
   - Visual indicator when in organization context
   - "Personal" option always available

2. **Cards Screen:**
   - Tabs: "Personal" | "Business" (or show all)
   - Filter by selected organization
   - Clear visual distinction between personal and org cards

3. **Navigation:**
   - Add "Organizations" tab or section in "More" screen
   - Or add to account settings

4. **Visual Design:**
   - Organization badge/icon on org-owned items
   - Consistent purple branding
   - Clear hierarchy (Personal < Organization)

---

## Next Immediate Steps

1. **Test Email Service** (Current Priority)
   - Follow `TESTING_EMAIL_SERVICE.md`
   - Verify password reset flow works

2. **Implement Organization Switcher** (Next Sprint)
   - Start with simplest version
   - Add organization context
   - Update API calls to include `orgId`

3. **Create Organization Screen**
   - Simple form
   - Basic validation
   - Success flow

4. **Update Cards to Support Organizations**
   - Filter cards by organization
   - Create cards for organizations
   - Show organization context in card details

---

## Notes

- **Business vs Personal:** A user can have both personal cards AND organization cards
- **Organization Cards:** Cards can be owned by either a user (`ownerUserId`) or an organization (`ownerOrgId`)
- **Multi-Organization:** Users can be members of multiple organizations
- **Roles:** OWNER can do everything, ADMIN can manage members/cards, MEMBER can view/use cards
- **Personal Context:** When no organization is selected, user sees only personal cards/transactions

