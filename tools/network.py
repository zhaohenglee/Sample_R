#!/usr/bin/env python3
"""Personal network tracker: one Markdown file per contact in contacts/.

Standard library only. Run `python3 tools/network.py -h` for usage.
"""

import argparse
import csv
import os
import re
import sys
import unicodedata
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTACTS_DIR = ROOT / "contacts"
TEMPLATE = ROOT / "templates" / "contact.md"
DEFAULT_CSV = ROOT / "network.csv"

KNOWN = [
    "name", "linkedin", "company", "role", "location", "tier",
    "tags", "how_met", "last_contact", "next_followup", "cadence_days",
]
DEFAULT_CADENCE = {"A": 30, "B": 60, "C": 90, "": 90}
MAX_CADENCE = 36500
TIER_ORDER = {"A": 0, "B": 1, "C": 2, "": 3}
LOG_HEADING = "## interaction log"
BULLET_RE = re.compile(r"^- \d{4}-\d{2}-\d{2}:")
SLUG_RE = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
NO_CONTACTS = 'No contacts yet. Add one with: python3 tools/network.py new "Full Name"'


class NetworkError(Exception):
    """A user-facing error: printed to stderr, exit status 1."""


def warn(msg):
    print(f"warning: {msg}", file=sys.stderr)


def slugify(text):
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")


def one_line(text):
    """Collapse any whitespace (including newlines) to single spaces."""
    return " ".join((text or "").split())


def parse_date(text, label="date"):
    try:
        return date.fromisoformat(text.strip())
    except (ValueError, AttributeError):
        raise NetworkError(f"Invalid {label} {text!r}; use YYYY-MM-DD.")


def norm_tier(value):
    """Return (tier, ok). Blank is fine; anything but A/B/C is not."""
    tier = (value or "").strip().upper()
    if tier in ("A", "B", "C", ""):
        return tier, True
    return "", False


def rel(path):
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


# --------------------------------------------------------------------------
# Parsing and writing
# --------------------------------------------------------------------------

def parse_text(text):
    """Split a file into (fields, extra, body). Raises ValueError if no front matter."""
    lines = text.split("\n")
    if not lines or lines[0].rstrip() != "---":
        raise ValueError("no front matter (file must start with '---' on line 1)")
    end = None
    for i in range(1, len(lines)):
        if lines[i].rstrip() == "---":
            end = i
            break
    if end is None:
        raise ValueError("front matter is not closed with '---'")
    fields = {k: "" for k in KNOWN}
    extra = {}
    for line in lines[1:end]:
        if not line.strip():
            continue
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        key = key.strip().lower()
        if not key:
            continue
        value = value.strip()
        if key in fields:
            fields[key] = value
        else:
            extra[key] = value
    body = "\n".join(lines[end + 1:])
    return fields, extra, body


def render(fields, extra, body):
    out = ["---"]
    for key in KNOWN:
        value = fields.get(key, "")
        out.append(f"{key}: {value}" if value else f"{key}:")
    for key, value in extra.items():
        out.append(f"{key}: {value}" if value else f"{key}:")
    out.append("---")
    return "\n".join(out) + "\n" + body


def write_text(path, text, exclusive=False):
    data = text.encode("utf-8")
    if exclusive:
        with open(path, "xb") as fh:
            fh.write(data)
        return
    tmp = path.with_name(path.name + ".tmp")
    try:
        with open(tmp, "wb") as fh:
            fh.write(data)
        os.replace(tmp, path)
    finally:
        if tmp.exists():
            tmp.unlink()


class Contact:
    def __init__(self, path, fields, extra, body):
        self.path = path
        self.slug = path.stem
        self.fields = fields
        self.extra = extra
        self.body = body
        label = rel(path)

        tier, ok = norm_tier(fields["tier"])
        if not ok:
            warn(f"{label}: tier {fields['tier']!r} is not A, B or C; treating as blank")
        self.fields["tier"] = tier

        self.last_contact = self._date("last_contact", label)
        self.next_followup = self._date("next_followup", label)

        self.cadence = None
        raw = fields["cadence_days"]
        if raw:
            try:
                value = int(raw)
                if not 1 <= value <= MAX_CADENCE:
                    raise ValueError
                self.cadence = value
            except ValueError:
                warn(f"{label}: cadence_days {raw!r} is not a whole number of days; ignoring")

    def _date(self, key, label):
        raw = self.fields[key]
        if not raw:
            return None
        try:
            return date.fromisoformat(raw)
        except ValueError:
            warn(f"{label}: {key} {raw!r} is not a YYYY-MM-DD date; ignoring")
            return None

    @property
    def name(self):
        return self.fields["name"] or self.slug

    @property
    def tier(self):
        return self.fields["tier"]

    @property
    def company(self):
        return self.fields["company"]

    @property
    def tags(self):
        return [t.strip() for t in self.fields["tags"].split(",") if t.strip()]

    @property
    def effective_cadence(self):
        if self.cadence is not None:
            return self.cadence
        return DEFAULT_CADENCE[self.tier]

    @property
    def followup(self):
        """next_followup, else last_contact + cadence, else None (never contacted)."""
        if self.next_followup:
            return self.next_followup
        if self.last_contact:
            return safe_add(self.last_contact, self.effective_cadence)
        return None

    @property
    def interactions(self):
        start, end = log_section(self.body.split("\n"))
        if start is None:
            return 0
        lines = self.body.split("\n")[start + 1:end]
        return sum(1 for ln in lines if BULLET_RE.match(ln))

    def save(self):
        write_text(self.path, render(self.fields, self.extra, self.body))


def safe_add(day, days):
    try:
        return day + timedelta(days=days)
    except OverflowError:
        raise NetworkError(f"Date {day.isoformat()} plus {days} days is out of range.")


def log_section(lines):
    """Return (heading_index, end_index) of the Interaction log section, or (None, None)."""
    start = None
    for i, line in enumerate(lines):
        if line.strip().lower() == LOG_HEADING:
            start = i
            break
    if start is None:
        return None, None
    end = len(lines)
    for j in range(start + 1, len(lines)):
        if lines[j].startswith("## "):
            end = j
            break
    return start, end


def load_contact(path):
    try:
        text = path.read_bytes().decode("utf-8-sig")
    except (OSError, UnicodeDecodeError) as exc:
        warn(f"skipping {rel(path)}: cannot read as UTF-8 ({exc})")
        return None
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    try:
        fields, extra, body = parse_text(text)
    except ValueError as exc:
        warn(f"skipping {rel(path)}: {exc}")
        return None
    return Contact(path, fields, extra, body)


def load_all():
    """Return all contacts sorted by slug, or None when there is nothing to show."""
    if not CONTACTS_DIR.is_dir():
        return None
    contacts = []
    for path in sorted(CONTACTS_DIR.glob("*.md")):
        contact = load_contact(path)
        if contact:
            contacts.append(contact)
    return contacts or None


def find_contact(query):
    q = query.strip()
    if not CONTACTS_DIR.is_dir():
        raise NetworkError(f'No contacts yet. Create one first: python3 tools/network.py new "{q}"')
    for slug in (q, slugify(q)):
        if slug and SLUG_RE.fullmatch(slug):
            path = CONTACTS_DIR / f"{slug}.md"
            if path.is_file():
                contact = load_contact(path)
                if contact:
                    return contact
    matches = []
    for path in sorted(CONTACTS_DIR.glob("*.md")):
        contact = load_contact(path)
        if contact and contact.name.casefold() == q.casefold():
            matches.append(contact)
    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        slugs = ", ".join(c.slug for c in matches)
        raise NetworkError(f"More than one contact is named {q!r}; use a slug: {slugs}")
    raise NetworkError(
        f"No contact found for {q!r}. Check slugs with `python3 tools/network.py list`, "
        f'or create one with `python3 tools/network.py new "{q}"`.'
    )


def table(header, rows):
    widths = [len(h) for h in header]
    for row in rows:
        for i, cell in enumerate(row):
            widths[i] = max(widths[i], len(cell))
    lines = []
    for row in [header] + rows:
        lines.append("  ".join(c.ljust(w) for c, w in zip(row, widths)).rstrip())
    return "\n".join(lines)


# --------------------------------------------------------------------------
# Commands
# --------------------------------------------------------------------------

def cmd_new(args, today):
    name = one_line(args.name)
    if not name:
        raise NetworkError("Name must not be empty.")
    source = args.slug if args.slug is not None else name
    slug = slugify(source)
    if not slug:
        raise NetworkError(f"Cannot build a file name from {source!r}; pass --slug with letters or digits.")
    path = CONTACTS_DIR / f"{slug}.md"
    if path.exists():
        raise NetworkError(f"Contact already exists: contacts/{slug}.md (use --slug to choose another)")

    tier, ok = norm_tier(args.tier)
    if not ok:
        raise NetworkError(f"Invalid tier {args.tier!r}; use A, B or C.")
    if args.cadence is not None and not 1 <= args.cadence <= MAX_CADENCE:
        raise NetworkError(f"Invalid cadence {args.cadence}; use a number of days from 1 to {MAX_CADENCE}.")

    if not TEMPLATE.is_file():
        raise NetworkError(f"Template not found: {rel(TEMPLATE)}")
    template = TEMPLATE.read_bytes().decode("utf-8-sig").replace("\r\n", "\n")
    text = template.replace("{linkedin}", one_line(args.linkedin)).replace("{name}", name)
    try:
        fields, extra, body = parse_text(text)
    except ValueError as exc:
        raise NetworkError(f"Template {rel(TEMPLATE)} is invalid: {exc}")

    fields["tier"] = tier
    for key, value in (
        ("company", args.company), ("role", args.role), ("location", args.location),
        ("how_met", args.how_met),
    ):
        if value:
            fields[key] = one_line(value)
    if args.tags:
        fields["tags"] = ", ".join(t.strip() for t in one_line(args.tags).split(",") if t.strip())
    if args.cadence is not None:
        fields["cadence_days"] = str(args.cadence)

    CONTACTS_DIR.mkdir(parents=True, exist_ok=True)
    try:
        write_text(path, render(fields, extra, body), exclusive=True)
    except FileExistsError:
        raise NetworkError(f"Contact already exists: contacts/{slug}.md (use --slug to choose another)")
    print(rel(path))


def cmd_log(args, today):
    note = re.sub(r"\s*[\r\n]+\s*", " ", args.note).strip()
    if not note:
        raise NetworkError("Note must not be empty.")
    when = parse_date(args.date, "--date") if args.date else today
    contact = find_contact(args.contact)

    lines = contact.body.split("\n")
    bullet = f"- {when.isoformat()}: {note}"
    start, end = log_section(lines)
    if start is None:
        while lines and lines[-1] == "":
            lines.pop()
        if lines:
            lines.append("")
        lines.extend(["## Interaction log", bullet, ""])
    else:
        last = start
        for i in range(start + 1, end):
            if lines[i].strip():
                last = i
        lines.insert(last + 1, bullet)
        if lines[-1] != "":
            lines.append("")
    contact.body = "\n".join(lines)

    updated = contact.last_contact is None or when >= contact.last_contact
    if updated:
        contact.fields["last_contact"] = when.isoformat()
        contact.fields["next_followup"] = safe_add(when, contact.effective_cadence).isoformat()
    contact.save()

    tier = contact.tier or "-"
    nxt = contact.fields["next_followup"] or "not set"
    detail = f"cadence {contact.effective_cadence}d, tier {tier}"
    if updated:
        print(f"Logged. next follow-up {nxt} ({detail})")
    else:
        print(f"Logged (back-dated; last_contact stays {contact.last_contact.isoformat()}). "
              f"next follow-up {nxt} ({detail})")


def cmd_due(args, today):
    if args.days < 0:
        raise NetworkError("--days must not be negative.")
    contacts = load_all()
    if contacts is None:
        print(NO_CONTACTS)
        return
    horizon = today + timedelta(days=args.days)
    overdue, soon, later, never = [], [], [], []
    for c in contacts:
        fu = c.followup
        if fu is None:
            never.append(c)
        elif fu < today:
            overdue.append((fu, c))
        elif fu <= horizon:
            soon.append((fu, c))
        else:
            later.append((fu, c))
    key = lambda item: (item[0], item[1].name.casefold(), item[1].slug)
    for group in (overdue, soon, later):
        group.sort(key=key)
    never.sort(key=lambda c: (c.name.casefold(), c.slug))

    sections = [
        ("Overdue", overdue),
        (f"Due soon, next {args.days} days", soon),
    ]
    if args.all:
        sections.append(("Later", later))
    sections.append(("Never contacted", [(None, c) for c in never]))
    sections = [(t, g) for t, g in sections if g]
    if not sections:
        print(f"Nothing due in the next {args.days} days.")
        return

    def row(fu, c):
        if fu is None:
            bracket, day = "[never]", "-"
        else:
            offset = (fu - today).days
            bracket, day = f"[{offset:+d}d]" if offset else "[0d]", fu.isoformat()
        text = f"{day.ljust(10)}  {c.tier or '-'}  {c.slug}  {c.name}"
        if c.company:
            text += f"  ({c.company})"
        return bracket, text

    rows = {title: [row(fu, c) for fu, c in group] for title, group in sections}
    width = max(len(b) for r in rows.values() for b, _ in r)
    out = []
    for title, group in sections:
        out.append(f"{title} ({len(group)})")
        out.extend(f"  {b.ljust(width)} {t}" for b, t in rows[title])
        out.append("")
    print("\n".join(out).rstrip())


def cmd_list(args, today):
    wanted_tier = None
    if args.tier:
        wanted_tier, ok = norm_tier(args.tier)
        if not ok or not wanted_tier:
            raise NetworkError(f"Invalid tier {args.tier!r}; use A, B or C.")
    contacts = load_all()
    if contacts is None:
        print(NO_CONTACTS)
        return
    wanted_tags = [t.strip().casefold() for t in (args.tag or []) if t.strip()]
    chosen = []
    for c in contacts:
        have = {t.casefold() for t in c.tags}
        if wanted_tier and c.tier != wanted_tier:
            continue
        if not all(t in have for t in wanted_tags):
            continue
        chosen.append(c)
    chosen.sort(key=lambda c: (TIER_ORDER[c.tier], c.name.casefold(), c.slug))
    if not chosen:
        print("No contacts match.")
        return
    if args.format == "slugs":
        print("\n".join(c.slug for c in chosen))
        return
    dash = lambda v: v if v else "-"
    rows = [
        [c.slug, c.name, dash(c.tier), dash(c.company),
         dash(c.last_contact.isoformat() if c.last_contact else ""),
         dash(c.next_followup.isoformat() if c.next_followup else ""),
         dash(", ".join(c.tags))]
        for c in chosen
    ]
    print(table(["slug", "name", "tier", "company", "last_contact", "next_followup", "tags"], rows))


def cmd_export(args, today):
    contacts = load_all()
    if contacts is None:
        print(NO_CONTACTS)
        return
    out = Path(args.out) if args.out else DEFAULT_CSV
    header = ["slug"] + KNOWN + ["interactions", "effective_cadence_days"]
    try:
        if out.parent and not out.parent.exists():
            out.parent.mkdir(parents=True)
        with open(out, "w", encoding="utf-8", newline="") as fh:
            writer = csv.writer(fh, lineterminator="\n")
            writer.writerow(header)
            for c in sorted(contacts, key=lambda c: c.slug):
                shown = dict(c.fields)
                shown["last_contact"] = c.last_contact.isoformat() if c.last_contact else ""
                shown["next_followup"] = c.next_followup.isoformat() if c.next_followup else ""
                shown["cadence_days"] = str(c.cadence) if c.cadence is not None else ""
                values = [shown[key] for key in KNOWN]
                writer.writerow([c.slug] + values + [c.interactions, c.effective_cadence])
    except OSError as exc:
        raise NetworkError(f"Cannot write {out}: {exc}")
    print(f"Wrote {len(contacts)} contacts to {out}")


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

class Parser(argparse.ArgumentParser):
    def _parse_optional(self, arg_string):
        # A value made only of dashes (e.g. the name "---") is data, not an option;
        # the command itself then rejects it with a clear message.
        if len(arg_string) > 2 and set(arg_string) == {"-"}:
            return None
        return super()._parse_optional(arg_string)


def build_parser():
    parser = Parser(
        prog="network.py",
        description="Personal network tracker. One Markdown file per contact in contacts/.",
    )
    parser.add_argument("--today", metavar="YYYY-MM-DD", help=argparse.SUPPRESS)
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--today", metavar="YYYY-MM-DD", default=argparse.SUPPRESS, help=argparse.SUPPRESS)
    sub = parser.add_subparsers(dest="command", metavar="{new,log,due,list,export}", parser_class=Parser)
    sub.required = True

    p = sub.add_parser("new", parents=[common], help="create a contact file from the template")
    p.add_argument("name")
    p.add_argument("--linkedin", default="", help="LinkedIn profile URL (entered by hand)")
    p.add_argument("--tier", help="A, B or C")
    p.add_argument("--company")
    p.add_argument("--role")
    p.add_argument("--location")
    p.add_argument("--tags", help="comma separated")
    p.add_argument("--how-met", dest="how_met")
    p.add_argument("--cadence", type=int, metavar="N", help="follow-up interval in days")
    p.add_argument("--slug", help="file name to use instead of one built from the name")
    p.set_defaults(func=cmd_new)

    p = sub.add_parser("log", parents=[common], help="append an interaction and schedule the next follow-up")
    p.add_argument("contact", help="slug or exact name")
    p.add_argument("note")
    p.add_argument("--date", metavar="YYYY-MM-DD", help="defaults to today")
    p.set_defaults(func=cmd_log)

    p = sub.add_parser("due", parents=[common], help="show overdue, due soon and never contacted people")
    p.add_argument("--days", type=int, default=14, metavar="N", help="look ahead N days (default 14)")
    p.add_argument("--all", action="store_true", help="also show later follow-ups")
    p.set_defaults(func=cmd_due)

    p = sub.add_parser("list", parents=[common], help="list contacts")
    p.add_argument("--tag", action="append", help="repeatable; all tags must match")
    p.add_argument("--tier", help="A, B or C")
    p.add_argument("--format", choices=["table", "slugs"], default="table")
    p.set_defaults(func=cmd_list)

    p = sub.add_parser("export", parents=[common], help="write a CSV for spreadsheets")
    p.add_argument("--out", metavar="PATH", help="default: network.csv in the repo root")
    p.set_defaults(func=cmd_export)
    return parser


def main(argv=None):
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(errors="replace")
        except (AttributeError, ValueError):
            pass
    args = build_parser().parse_args(argv)
    try:
        today = parse_date(args.today, "--today") if args.today else date.today()
        args.func(args, today)
    except NetworkError as exc:
        print(exc, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
