# TECH-S1-11 · Password reset verification

Issue #37 implements US-S1-09. The implementation entered develop through PR #46 and its parent PR #45.

## Verification on 23 November 2026

- Started the Express app against a disposable MongoDB database and delivered email over SMTP to a loopback inbox. Confirmed delivery only for an existing account, the generic HTTP response and a reset link in the captured email.
- Compared the stored SHA-256 digest with the captured token and checked the 15-minute expiry. Confirmed that pending reset information stays out of login and current-user responses.
- Checked short and oversized passwords, rotated and expired links, and two simultaneous confirmations. Exactly one confirmation succeeded. The old password stopped working, and MongoDB removed both reset fields.
- Simulated an SMTP rejection and confirmed no unusable reset token remained in MongoDB. The original password still worked.
- Tested both React forms, including mismatched confirmation, a rejected reset, success feedback, removal of the token from the URL and clearing the cached browser session.

- Followed the captured SMTP link in Edge against the live API. Reset succeeded once, replay failed, only the new password signed in, and logout survived a reload.

## Reproduce

1. Run `npm --prefix server ci` and `npm --prefix client ci`.
2. Set `TEST_MONGODB_URI` to a development MongoDB instance and run `npm test`. The integration test uses a fresh database and starts its own loopback SMTP receiver. It requires no email credentials and sends no real mail.
3. Run `npm run build`.

Delivery through the production mail provider and Tech Lead review are pending.
