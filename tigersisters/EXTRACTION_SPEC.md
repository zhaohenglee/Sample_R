# Extraction spec (read fully before starting)

You are extracting ideas from transcripts of the Tiger Sisters podcast/YouTube channel. Hosts: sisters Cherie Brooke and Jean Luo (Harvard and Stanford MBAs, ex-Goldman, tech executives). Episodes cover money, careers, power, and relationships, often with a guest.
Your batch file lists items: id (YouTube video id), date, title, and the absolute path of the transcript text file.

For EACH item in your batch, in order:
1. Read the transcript file completely (use Bash `cat` or Read; files are 3k-12k words; auto-generated, so speaker names may be absent and punctuation rough).
2. Write ONE JSON file: /tmp/claude-0/-home-user-Sample-R/df158ff8-aba0-5f2b-92d7-35127ce48f75/scratchpad/tiger/ideas/<id>.json
   Write it immediately after finishing that transcript, before reading the next one.

JSON schema (strict, valid JSON, UTF-8):
{
  "video_id": "<id>",
  "date": "<YYYY-MM-DD from batch file>",
  "title": "<title from batch file>",
  "guest": "<guest name and role if there is one, else empty string>",
  "summary": "<2-3 sentences: what this episode is about and the main takeaways>",
  "ideas": [
    {
      "idea": "<one crisp sentence stating the idea, claim, rule or framework, as the speaker frames it>",
      "topic": "<exactly one topic from the list below>",
      "detail": "<1-3 sentences of supporting reasoning, example, story or number given>",
      "who": "<'hosts' or the guest's name, whoever states or endorses the idea>",
      "names_or_cases": ["<people, companies, books, frameworks or cases mentioned for this idea, else empty list>"]
    }
  ]
}

Topic list (use these exact strings, nothing else):
- "Career strategy & promotions"
- "Networking, communication & influence"
- "Money, investing & personal finance"
- "Entrepreneurship & startups"
- "Finance industry: VC, PE, banking, hedge funds"
- "MBA & elite education"
- "Leadership & management"
- "Power, status & office politics"
- "Relationships, dating & marriage"
- "Family, childhood & siblings"
- "Mindset, confidence & psychology"
- "Health, wellness & burnout"
- "Life design, goals & reinvention"
- "AI & technology"
- "Guest life story & lessons"

Rules:
- Extract 8 to 25 ideas per transcript, scaled to length and richness. Prefer distinct ideas over restatements.
- Ideas must be things the hosts or guest actually say or endorse in THIS transcript, not general knowledge. Exclude sponsor reads and ads.
- Keep specific numbers, names, book titles and frameworks when given.
- Do not skip any item. Do not merge items. For a thin transcript, fewer ideas is fine, minimum 3.
- Validate that each JSON file parses (python3 -c "import json;json.load(open(path))") before moving on.
- Final reply: one line per item: "<id> OK <n ideas>" or "<id> FAILED <reason>". Nothing else.
