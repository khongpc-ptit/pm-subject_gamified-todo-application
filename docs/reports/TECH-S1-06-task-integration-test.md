# TECH-S1-06 · Task Management integration

Issue #32 covers US-S1-01 through US-S1-04. All four task feature dependencies are in develop.

## Verification on 23 November 2026

| Case | Verification | Result |
| --- | --- | --- |
| Create and validate | Submitted title, priority and date in Edge and reloaded. Checked missing, blank and oversized titles, invalid priority and impossible dates against the API. | Pass |
| Duplicate submission | Submitted the form twice before the first request settled. The Dashboard test observed one create request. | Pass |
| List and filter | Reloaded with two accounts in Edge. Checked filters, no results, no tasks, loading, a failed list request and retry. Confirmed API status and priority filters against MongoDB. | Pass |
| Edit | Changed the title, notes, priority and cleared the due date. Reloaded and reopened the form to verify the saved fields. A rejected request left the form open and the row unchanged. | Pass |
| Complete | Completed and reloaded in Edge. Repeated the completion request against MongoDB and checked that the first timestamp and user XP were unchanged. | Pass |
| Ownership | Checked account isolation in Edge and verified unauthenticated requests, attempts to edit or complete another account's task, and invalid or missing IDs through the API. | Pass |

Two Dashboard defects were found and retested. A failed edit could use the demo fallback and report a local change as saved. An empty priority filter could display the first-task prompt even when other tasks existed. Editing now waits for a successful API response, and filtering uses the complete set of tasks returned for the account.

## Reproduce

1. Run `npm --prefix server ci` and `npm --prefix client ci`.
2. Set `TEST_MONGODB_URI` to a development MongoDB instance with permission to create and drop a test database, then run `npm run build` and `npm test`. The suite creates and drops its own randomly named database. This run passed 62 server and 30 client tests.
3. To repeat the browser checks, run the client and API with a disposable MongoDB database, a JWT secret and the matching API/client URLs. Create two test accounts. As account A, create a high-priority task and reload. Filter by low priority, clear the filter, edit the task to low priority and remove the due date, then complete it. Reload after each change. Sign in as account B and verify the task is absent.
4. Use browser network controls to delay or fail the task request. Check the loading indicator, retry action and that a failed edit leaves the original task visible.

Tech Lead review is pending.
