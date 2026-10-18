# OmniScribe Firestore Security Specification & Hardening Guide

## 1. System Invariants & RBAC Architecture
- **Super Administrator**: `bababridge@gmail.com` possesses system-level privileges with bootstrap rights in rules.
- **Roles**:
  - `ADMIN`: Full clearance, rule modification, deletion privileges, user permission elevation.
  - `OFFICER`: Autonomous dossier audit generation, discrepancy resolution, note authoring.
  - `BROKER`: Dossier inspection, collaborative thread commentary, customs clearance export.
- **Sub-resource Invariant**: Comments under `/audits/{auditId}/comments/{commentId}` require that the parent audit document exists.
- **Identity Integrity**: Incoming `author_uid` on audits and comments must match `request.auth.uid`.
- **Immutable Keys**: `audit_id`, `author_uid`, `createdAt` are immutable after creation.
- **PII Isolation**: User profiles under `/users/{userId}` can only be read by the owner or an admin.

## 2. The Dirty Dozen Threat Payloads Tested Against Rules
1. **Unauthenticated Read/Write**: Request without `request.auth` -> Denied.
2. **Unverified Email Write**: `email_verified == false` -> Denied.
3. **Privilege Escalation in Profile**: Non-admin sets `role: "ADMIN"` during user creation -> Denied.
4. **Author Spoofing**: `author_uid: "victim-uid"` while auth is `"attacker-uid"` -> Denied.
5. **Path ID Injection**: ID containing path traversal `../malicious` -> Denied by regex `^[a-zA-Z0-9_\-]+$`.
6. **Denial of Wallet Oversized String**: Content string > 2000 chars -> Denied by `content.size() <= 2000`.
7. **Orphaned Subcollection Write**: Comment added to non-existent `auditId` -> Denied by `exists(/databases/$(database)/documents/audits/$(auditId))`.
8. **Immutability Breach**: Updating `author_uid` on an existing audit -> Denied by `incoming().author_uid == existing().author_uid`.
9. **Shadow Ghost Fields**: Injecting unauthorized key `isAdmin: true` into audit doc -> Denied by validation blueprint key constraints.
10. **State Shortcutting on User Profile**: Regular user altering their own `role` field -> Denied by `affectedKeys().hasOnly(['displayName', 'photoURL', 'lastLoginAt'])`.
11. **Blanket Query Scraping**: Attempting to read other users' private profiles -> Denied by `request.auth.uid == userId || isAdmin()`.
12. **Unauthorized Deletion**: Regular officer attempting to delete an audit -> Denied by `allow delete: if isAdmin()`.
