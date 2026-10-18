# OmniScribe Enterprise Authentication & Firestore Cloud Architecture

Transform OmniScribe from an in-memory/local storage tool into a collaborative compliance platform powered by Firebase Authentication (Google OAuth + JWT validation), real-time Firestore persistence, and multi-tier Role-Based Access Control (RBAC).

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed during the interactive clarification phase:
> 
> - **Authentication Standard**: Firebase Google OAuth with JWT token verification. Compliance officers authenticate securely using Google Sign-In with popup authorization, generating standard cryptographic Firebase JWT ID tokens.
> - **Firestore Storage Scope**: Full persistence across three primary collections: `audits` (complete inspection dossiers and tariff analyses), `comments` (threaded discrepancy discussions and mentions), and `users` (officer profiles and permission levels).
> - **Access Control Structure**: 3-tier Role-Based Access Control (RBAC) separating `Admin` (full system configuration and user management), `Compliance Officer` (audit generation, discrepancy tagging, and review approval), and `Customs Broker` (dossier inspection, comment contribution, and export clearance).
> - **Super Admin Designation**: `bababridge@gmail.com` is configured as the initial system administrator with bootstrap privileges in the security rules.

---

### 1. Overview & Core Concept

- **What It Does**: Provides multi-tenant team collaboration for cross-border logistics compliance. Multiple officers, legal counsels, and customs brokers can log in with their corporate Google credentials, inspect regulatory dossiers in real-time, initiate AI-assisted document audits, and participate in discrepancy threads with live Firestore sync.
- **Target Audience / Persona**: Chief Compliance Officers, Licensed Customs Brokers (LCBs), Freight Forwarding Agents, and Import/Export Regulatory Analysts.
- **Key Value**: Replaces isolated browser-only audits with a shared, persistent audit repository where findings, discussions, and clearance determinations are synchronized across team members with role-governed authorization.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Officer Authentication & Session Onboarding**:
   - The top navigation bar features a clean, unboxed corporate authentication badge (`Sign In with Google`).
   - Clicking triggers Firebase `signInWithPopup`, authenticating the officer and retrieving their verified profile (`name`, `email`, `avatar`, `jwt_token`).
   - If visiting for the first time, a user profile document is provisioned in `/users/{userId}` with assigned role credentials (defaulting `bababridge@gmail.com` to `ADMIN` and other invited team members to `OFFICER` or `BROKER`).
2. **Collaborative Audit & Live Sync**:
   - When an officer runs an autonomous compliance audit, the resulting dossier is committed to `/audits/{auditId}` in Firestore.
   - All other active team members' dashboards immediately reflect the new audit record via real-time `onSnapshot` subscriptions without manual refresh.
3. **Role-Governed Actions & Verification**:
   - `ADMIN`: Can modify regulatory rules, reset or clear system archives, and adjust officer permissions.
   - `OFFICER`: Can upload trade manifests, run Gemini multimodal audits, resolve discrepancy items, and author officer notes.
   - `BROKER`: Can view dossiers, participate in nested reply threads, and export official customs clearance slips.
4. **Session Controls & User Profile**:
   - Authenticated officers see their name, verified avatar, and role tag in the top bar with a clean dropdown menu containing account details, permission tier overview, and a sign-out trigger.

#### Visual Identity & Theme (SaaS Dashboard Standard)
- **Palette**: Deep slate canvas (`#090D16`), cool charcoal surfaces (`#111827`), hairline borders (`#1F2937`), and crisp emerald accents (`#10B981`) for approved states, amber (`#F59E0B`) for conditional review, and rose (`#F43F5E`) for critical holds.
- **Zero-Pill Typography**: Clean, unboxed metadata separated by typographic dots (`·`), pairing `Plus Jakarta Sans` for display headlines with `JetBrains Mono` for tabular figures, tariff classifications, and financial currencies.
- **Top Bar Contract**: Strict 3-zone layout: `[OmniScribe Wordmark]` — `[Navigation Links: Dashboard, Live Audit, Rules, History]` — `[Google Officer Profile / Auth CTA]`.

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: Client-Side Firebase SDK with JWT Server Proxy Verification
- **Chosen Approach**: Use the standard client-side Firebase Web SDK (`firebase/auth`, `firebase/firestore`) with popup authentication for zero-redirect UX in the iframe, paired with Express backend middleware that verifies `Bearer <firebase_jwt_token>` for privileged Gemini API execution.
- **Why**: Protects AI generation quotas and regulatory endpoints on Cloud Run while leveraging Firestore's native sub-second document change listeners on the frontend.
- **Alternatives Considered**: Hand-rolled session cookies or separate OAuth 2.0 redirect servers were rejected due to iframe cookie blocking and third-party redirect restrictions in development sandboxes.

#### Decision 2: Hybrid Offline-Resilient Store Architecture
- **Chosen Approach**: Provide a unified `ComplianceStore` that subscribes to Firestore when authenticated, while falling back gracefully to local cached state if offline or while the user accepts Firebase provisioning terms.
- **Why**: Guarantees zero downtime and prevents the application from locking up if network connectivity drops during cargo inspections.

#### Decision 3: "Master Gate" Attribute-Based Access Control (ABAC) Security Rules
- **Chosen Approach**: Enforce Zero-Trust security rules on Firestore collections using strict validation helper functions (`isValidAudit`, `isValidComment`, `isValidUser`), immutable author IDs, server-enforced timestamps (`request.time`), and explicit role checks against `/admins/{uid}` or `/users/{uid}`.
- **Why**: Eliminates update-gaps, prevents shadow fields, blocks identity spoofing, and secures company trade data against unauthorized read scraping.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OmniScribe Web Client                           │
│                                                                        │
│  ┌───────────────────────┐             ┌────────────────────────────┐  │
│  │   FirebaseAuthModal   │             │   Header User Badge        │  │
│  │  (Google OAuth Popup) │             │  (Role, Avatar, Sign Out)  │  │
│  └──────────┬────────────┘             └─────────────┬──────────────┘  │
│             │                                        │                 │
│             ▼                                        ▼                 │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       AuthContext & Hook                         │  │
│  │   • Current Officer User (`uid`, `email`, `role`, `jwtToken`)    │  │
│  │   • `signInWithGoogle()`, `signOut()`, `onAuthStateChanged`      │  │
│  └──────────┬────────────────────────────────────────┬──────────────┘  │
│             │                                        │                 │
│             ▼                                        ▼                 │
│  ┌───────────────────────────┐         ┌────────────────────────────┐  │
│  │    Firestore Sync Layer   │         │   Express Cloud Run Proxy  │  │
│  │  (Real-time `onSnapshot`) │         │ (Bearer JWT Auth Header)   │  │
│  │  • `/audits/{auditId}`    │         │ • POST `/api/audit`        │  │
│  │  • `/comments/{commentId}`│         │ • POST `/api/audit-json`   │  │
│  │  • `/users/{userId}`      │         │ • Gemini Multimodal Model  │  │
│  └──────────┬────────────────┘         └─────────────┬──────────────┘  │
└─────────────┼────────────────────────────────────────┼─────────────────┘
              │                                        │
              ▼                                        ▼
   ┌──────────────────────┐               ┌───────────────────────────┐
   │ Google Cloud Firestore│               │ Google Cloud Run / Gemini │
   │ (Rules: 8 ABAC Gates)│               │ (gemini-3.8-flash Engine) │
   └──────────────────────┘               └───────────────────────────┘
```

#### Intermediate Representation (`firebase-blueprint.json`)
The application defines three strict entities:
1. `User`: `uid`, `email`, `displayName`, `photoURL`, `role` (`ADMIN` | `OFFICER` | `BROKER`), `createdAt`, `lastLoginAt`.
2. `AuditRecord`: `audit_id`, `audit_status`, `risk_score`, `risk_level`, `destination_country`, `regulatory_framework`, `extracted_entities`, `compliance_discrepancies`, `discrepancy_details`, `recommended_actions`, `duty_tariff_analysis`, `agent_reasoning_trace`, `confidence_score`, `llm_metadata`, `author_uid`, `timestamp`, `createdAt`, `updatedAt`.
3. `AuditComment`: `id`, `audit_id`, `author_uid`, `author_name`, `author_role`, `author_avatar_color`, `content`, `category`, `priority`, `resolved`, `pinned`, `target_discrepancy_code`, `mentions`, `replies` (nested array with `parent_reply_id`, `target_point`), `createdAt`, `updatedAt`.

#### Provisioning & Deployment Steps (Upon Plan Approval)
1. Initiate Firebase setup via `show_aistudio_ui` (`ui_type: "firebase_setup"`).
2. Await user confirmation in the UI and verify terms via `GetFirebaseTos`.
3. Execute `ProvisionFirebase` via `rpc_action` to instantiate Firestore Enterprise and Authentication.
4. Generate `firebase-blueprint.json`, write and audit `firestore.rules`, and run security linter tests.
5. Deploy security rules via `DeployRules` RPC.
6. Install `firebase` package and wire `AuthContext`, `FirebaseProvider`, real-time hooks, and header profile controls.
