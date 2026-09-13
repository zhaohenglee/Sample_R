# Build Process

Three roles, three model tiers. The goal is cheap building, independent checking, and rare escalation.

## Roles

| Role | Model | Does | Does not |
|---|---|---|---|
| Builder | Sonnet | Implements one task from `docs/TASKS.md`. Writes code, migrations, tests. Runs typecheck, build, tests locally. Reports what was done and any deviation. | Change scope, skip acceptance criteria, touch unrelated files, commit. |
| Validator | Opus (subagent) | Reads the task and the diff in a fresh context. Runs typecheck, build, tests. Checks each acceptance criterion and reports PASS or FAIL with specific findings and file references. Looks for security issues and sync data integrity bugs. | Fix the code itself, approve on "looks fine" without running checks. |
| Lead | Opus (main session) | Sequences tasks, writes task specs, decides escalations, commits and pushes after PASS. | Write feature code when a builder can. |

The validator always runs as a separate subagent with its own context, even
though the lead is the same model. Independence comes from not having seen
the builder's reasoning, not from the model being different.

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

## Lessons that changed the process

**A green suite is not evidence.** T6.2 shipped six filters keeping a bank
refresh away from hand-entered data, and a test that appeared to guard them.
Removing all six left 267 of 267 tests passing: the test ran a sync with no
bank connection present, so its assertions never executed. Since then, every
task that adds a guard must show the guard being removed and a named test
going red. The builder reports which test catches which guard; the validator
re-runs that mutation independently. A guard nobody can show failing is
treated as untested.

**Say when a test cannot catch something.** One of the six filters is
genuinely unobservable on its own. The honest move, taken and accepted, was to
document why in the test file and keep the filter as defence in depth, rather
than write a test that pretends to cover it.

**Race conditions hide behind correct-looking code.** Recomputing a derived
balance by re-querying the ledger prevents arithmetic drift but not a stale
read. Any derived value written back to the database needs the row it derives
from locked, and lock order must be consistent across every path, or the fix
trades corruption for a deadlock. Order here is transaction, then account,
then category.

**Front-load constraints into the spec.** Rework is the expensive part. The
constraints that came out of one task's validation go into the next task's
brief verbatim, which is why T6.1's builder got transaction-joining right
without being corrected.

## When a model tier is unavailable

Sonnet's quota can run out mid-task. The lead then builds directly and still
sends the result to an Opus validator subagent. Independence comes from the
validator's fresh context, not from the tier differing, so the check keeps its
value; only the cost profile changes. Partial work from an interrupted builder
is reviewed and kept when sound, not discarded.
