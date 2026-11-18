# TECH-S1-06 Task integration verification

Refs #32, #18, #19, #20, #21.

## Current status

Prepared by Kiên. Full acceptance remains pending the merge of #28, #30 and #31 into develop. The current develop tree has no PUT task endpoint or edit modal from #30. Automated creation and completion coverage lives in PR #43 and #44. Existing tests mock persistence and do not establish real database durability.

## Execution prerequisites

Merge the task feature PRs after Tech Lead approval. Configure MongoDB, JWT_SECRET and client API URL. Create two accounts A and B. Start the server and client.

## Acceptance cases

| Case | Steps | Expected result | Result |
| --- | --- | --- | --- |
| Create | As A, submit title with description, priority and due date, reload | Stored values survive reload, status TODO, owner A | Pending |
| Validation | Submit blank title, 201-character title, invalid priority and date directly to API | 400 envelope, no task created | Automated API cases in PR #43, live pending |
| Duplicate submit | Submit twice while request is pending | One UI request, one task | Pending |
| List | Fetch as A and B, filter priority/status | Each account sees its own data | Existing mocked API tests pass, live pending |
| Edit | Edit title, description, priority and clear due date, reload | Values survive reload, XP reward follows priority | Blocked by #30 |
| Complete | Complete a task, reload, repeat same API request | COMPLETED persists, original completed_at preserved, user XP unchanged | Automated API cases in PR #44, live pending |
| Ownership | A attempts editing/completing B task | 403, database unchanged | Pending |
| Missing task | Use a valid nonexistent ID, then malformed ID | 404 and 400 respectively | Pending |
| Loading/empty/error | Delay API, use empty account, stop API | Loading indicator, empty prompt, recoverable error | Pending |
| Failure | Fail create/edit/complete API response | Error visible, no false success state | Pending |

Record actual execution date, environment, result and defect links before marking #32 complete. Tech Lead review remains required.
