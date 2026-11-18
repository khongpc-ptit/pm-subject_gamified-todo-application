# TECH-S1-12 Auth integration verification

Refs #38, #22, #23, #24, #25, #26.

## Current status

Prepared by Kien. Full acceptance awaits registration #34, profile #36 and approval/merge of login PR #45 and reset PR #46. Mocked backend tests cover login, JWT expiry and reset consumption. SMTP delivery and real database persistence remain unverified.

## Execution prerequisites

Configure MongoDB, JWT_SECRET and CLIENT_URL. Run an SMTP capture service and set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD and SMTP_FROM. Start both apps. Use two accounts A and B.

## Acceptance cases

| Case | Steps | Expected result | Result |
| --- | --- | --- | --- |
| Registration | Register valid account, retry same normalized email | 201 then 409, bcrypt hash only in DB | Blocked by #34 |
| Login | Wrong password, nonexistent email, then valid credentials | Same 401 error for failures, signed JWT and public user on success | Mocked tests pass, live pending |
| Session | Reload with valid JWT, then remove JWT, expire JWT, tamper signature | Valid session restored, unauthorized sessions return to login | Pending |
| Logout | Logout and reload or use browser back | Stored credentials removed, protected UI requires login | Pending |
| Profile | Read/edit A profile, attempt modifying B or gamification fields | Public fields only, ownership and allowed-field validation | Blocked by #36 |
| Reset request | Request known and unknown emails | Generic successful response, SMTP message only for existing account | Mocked delivery adapter test passes, actual SMTP pending |
| Reset storage | Inspect user reset fields | SHA-256 token hash, expiry 15 minutes, no raw token | Pending |
| Reset consume | Use emailed link, set valid new password, login old/new password | New password works, old password fails, reset fields removed | Pending |
| Reset replay | Submit same token twice concurrently | Exactly one successful update | Atomic query implemented, real DB pending |
| Expired reset | Expire token and submit | Rejected, password unchanged | Pending |
| Email failure | Stop SMTP, request reset, inspect user | Failure response, failed token cleared without removing a newer request | Pending |
| Leakage | Inspect login/me responses and logs | No password hash or reset token/hash in public response | Pending |

Record execution evidence and defect links before marking #38 complete. Tech Lead approval remains required.
