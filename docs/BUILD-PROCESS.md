# Build Process

Three roles, three model tiers. The goal is cheap building, independent checking, and rare escalation.

## Roles

| Role | Model | Does | Does not |
|---|---|---|---|
| Builder | Sonnet | Implements one task from `docs/TASKS.md`. Writes code, migrations, tests. Runs typecheck, build, tests locally. Reports what was done and any deviation. | Change scope, skip acceptance criteria, touch unrelated files, commit. |
| Validator | Opus | Reads the task and the diff. Runs typecheck, build, tests. Checks each acceptance criterion and reports PASS or FAIL with specific findings and file references. Looks for security issues and sync data integrity bugs. | Fix the code itself, approve on "looks fine" without running checks. |
| Lead | Fable | Sequences tasks, writes task specs, decides escalations, commits and pushes after PASS. | Write feature code when a builder can. |

## Loop per task

1. Lead hands the builder the task text plus repo conventions.
2. Builder implements and reports.
3. Validator reviews. Output format:
   ```
   VERDICT: PASS | FAIL
   Checks: typecheck ok/fail, build ok/fail, tests ok/fail (N passed)
   Criteria: one line per acceptance criterion, met or not, with evidence
   Findings: numbered, each with file:line and why it matters
   ```
4. On FAIL, lead sends the findings back to the same builder. Maximum two rework rounds.
5. After two failed rounds, or when the builder or validator raises a design question, the lead decides. That is the only place Fable spends effort on task content.
6. On PASS, lead commits with the task id in the message and pushes.

## Escalation triggers (lead decides)

- Schema change that alters an existing column's meaning.
- Anything that touches how access tokens are stored or sent.
- Builder and validator disagree after one rework round.
- A criterion turns out to be wrong or impossible as written.

## Rules for all roles

- Never commit `.env` or any secret.
- Never weaken a test to pass. Fix the code or escalate.
- One task per commit. The commit message starts with the task id.

## Builder checklist (learned from validation rounds)

The validator tests these live on every task. Build them in from the start.

- Route handlers: `requireAuthApi()` first, then `req.json()` inside try/catch → 400, then an allowlist of body fields → 400 on unknown, then type and length checks → 400. Never 500 on bad input.
- Id params: match `/^\d{1,9}$/` before `Number()`. Missing row → 404.
- Unique violations map to 409 via a named error class caught from the Postgres `23505` error, not from a pre-check.
- Multi statement writes run inside `db.transaction()` and lock rows they check with `SELECT ... FOR UPDATE`.
- Any user edit sets `user_edited = true`, and sync must never overwrite user owned fields (`category_id`, `notes`, `display_name`).
- Every new table must also be truncated by tests. `tests/setup.ts` does this dynamically.
- Migrations are applied to both `finance` and `finance_test` before running tests.
