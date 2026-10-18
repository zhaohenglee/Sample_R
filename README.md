# Personal Network Tracker

A small, file based tracker for the people I want to stay in touch with. Each person is one Markdown file in `contacts/`. Everything is entered by hand. LinkedIn is not scraped; the profile URL is only a link I paste in.

Requires Python 3 and nothing else.

## Workflow

1. **Add.** `python3 tools/network.py new "Name" --linkedin URL` creates `contacts/<slug>.md` from `templates/contact.md`.
2. **Capture.** Open the file and fill in the front matter, then `Key facts` (stable things) and `Custom notes` (anything else).
3. **Log.** After every touchpoint run `log`. It adds a dated bullet and schedules the next follow up.
4. **Review weekly.** Run `due` to see who to contact. Run `export` for a spreadsheet view.

## Commands

```
python3 tools/network.py new "Ada Lovelace" --tier A --tags "ml, london" --company Analytical
python3 tools/network.py log ada-lovelace "Coffee, talked about her new role" --date 2026-10-15
python3 tools/network.py due --days 14 --all
python3 tools/network.py list --tag ml --tier A --format slugs
python3 tools/network.py export --out network.csv
```

## Front matter fields

| Field | Meaning |
| --- | --- |
| name, linkedin | Full name and profile URL |
| company, role, location | Where they work and live |
| tier | A, B or C (blank allowed) |
| tags | Comma separated, matched without regard to case |
| how_met | Short note on how we met |
| last_contact | YYYY-MM-DD, set by `log` |
| next_followup | YYYY-MM-DD, set by `log` |
| cadence_days | Days between contacts. Blank uses the tier default |

Default cadence when `cadence_days` is blank: tier A 30 days, B 60 days, C 90 days, no tier 90 days.

## Notes

- `log` only moves `last_contact` forward, so back dated entries are safe.
- `list`, `due` and `export` never change your files.
- `network.csv` is generated and git ignored.
