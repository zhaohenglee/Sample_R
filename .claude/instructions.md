# Claude Code Instructions

## Output Style

- Concise, plain English output
- No BS
- Prioritize smooth writing and avoid using hyphens
- Output must be logical
- Output MUST be very concise and structured
- Provide honest feedback
- For writing suggestions, help structure the writing logically

## Model Usage

### Core rules

1. Opus 5 is the default for everything that needs judgment: design, architecture, tradeoffs, planning, complex coding, reviews.
2. Fable 5.1 is manual only. Never auto escalate to it. Use it only when the user says "use Fable" or "fable". Reserve it for one final audit of a finished design, a problem Opus has failed twice, or a decision that is costly to reverse. One pass, not iterative.
3. Step down for volume, never for judgment. Sonnet 5 handles well specified implementation, tests, refactors, and drafting. Haiku 4.5 handles bulk read, extract, and classify.
4. Scripts beat models for arithmetic, formatting, and deterministic transforms. No model tokens on math.
5. Never downgrade a design task to save cost. Judge cost per completed task, not per request. Before building a cheaper multi model cascade, try Opus at lower effort first.

### Scenario table

| Scenario | Model | Effort |
|---|---|---|
| High level design, architecture, tradeoff decisions | Opus 5 | xhigh |
| Planning a multi step build | Opus 5 | high |
| Complex or ambiguous coding, hard debugging | Opus 5 | high or xhigh |
| Well specified implementation, tests, refactors | Sonnet 5 | medium |
| PR code review | Opus 5 | high |
| Final audit before ship | Fable 5.1, manual call only | default |
| Bulk read, extract, classify, summarize | Haiku 4.5 | n/a |
| Subagent search and exploration | Sonnet 5 or Haiku 4.5 | low |
| Prose drafting and editing | Sonnet 5, Opus 5 if structure heavy | medium |
| Arithmetic and data transforms | Script | none |

### Escalation rules

- Sonnet moves up to Opus when a task turns ambiguous or fails once.
- Opus moves up to Fable only on an explicit user call.
- Subagents never use Fable unless the user asks.
- Escalation goes one tier at a time. Do not jump from Haiku to Fable.

### Subagents

- Exploration and search: Sonnet 5, or Haiku 4.5 for pure grep style sweeps, at low effort.
- Planning or design subagents: Opus 5.
- Give subagents the full task spec up front so they finish in one pass.

### Generated code

- Default model string is `claude-opus-5` with adaptive thinking.
- Use `claude-fable-5-1` only when the user asks for Fable.
- Exact model IDs only. Never append date suffixes.
- Cheaper worker roles in generated code use `claude-sonnet-5` or `claude-haiku-4-5`.

### Current lineup for reference

| Model | ID | Input $/M | Output $/M |
|---|---|---|---|
| Fable 5.1 | `claude-fable-5-1` | 10 | 50 |
| Opus 5 | `claude-opus-5` | 5 | 25 |
| Sonnet 5 | `claude-sonnet-5` | 2 | 10 |
| Haiku 4.5 | `claude-haiku-4-5` | 1 | 5 |

Effort levels available on all current models: low, medium, high, xhigh, max. Default is high.

## Output Preference: Deliverables

Whenever a task produces a deliverable report (an analysis, a review, a written document meant to be read or shared, not routine code or config changes):

1. Save the file or files to disk in the repo or session working directory, as normal.
2. Send the file to the user directly, so a copy lands on their device.
3. Publish an HTML version as an Artifact and give the user the link, so they have a page they can open, share, or reopen later without hunting for a local file.

Do all three for every report style deliverable, not just one. Skip step 3 only when the deliverable is not naturally a page, for example a spreadsheet or a script.
