# TECH-S1-12 · Authentication and account management integration

Issue #38 covers US-S1-05 through US-S1-09. Profile acceptance still depends on #36.

## Verification on 23 November 2026

| Coverage | Result |
| --- | --- |
| Registration against MongoDB | Passed. Normalized email, duplicate rejection, bcrypt storage and sanitized responses. |
| Login and session API | Passed. Same error for wrong password or unknown account, protected current-user and logout endpoints, expired and invalidly signed sessions rejected. |
| Browser session state | Passed in the React integration suite. Login enables the authenticated view, a fresh mount restores a valid session, and logout or expiration clears local credentials. |
| Password reset | Covered by the TECH-S1-11 verification for #37, including MongoDB state, SMTP delivery, expiry and concurrent replay. Run both suites together once its follow-up is merged. |
| Profile view and update | Blocked by #36. The current-user session API is tested. The editable profile view and update endpoint are required for complete acceptance. |

## Profile acceptance after #36

1. Create accounts A and B. Sign in as A. Verify the profile page shows A's name, email, level and XP as specified in the Sprint 1 wireframe.
2. Save a valid name using the profile form and reload. Verify the updated name through the UI and `GET /api/v1/auth/me`.
3. Submit an empty name and an invalid-length name. Verify validation appears, the form keeps the unsaved input and the previously saved record is preserved.
4. Confirm anonymous requests to `PUT /api/v1/auth/profile` are denied. Verify the authenticated identity determines the record updated and prohibited fields are protected. Check B's unchanged profile and absence of credential fields from the public response.
5. Record outcomes before marking #38 complete.

## Reproduce current coverage

Run `npm --prefix server ci` and `npm --prefix client ci`. Set `TEST_MONGODB_URI` to development MongoDB, then run `npm run build` and `npm test`. The suite uses and drops its own randomly named database. This run passed 60 server and 28 client tests.

Full profile acceptance and Tech Lead review are pending.
