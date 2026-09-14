# Extraction spec (read fully before starting)

You are extracting Mohnish Pabrai's investment and life ideas from talk transcripts.
Your batch file lists videos: id, date, title, and the absolute path of the transcript text file.

For EACH video in your batch, in order:
1. Read the transcript file completely (use Bash `cat` or Read; files are 3k-20k words).
2. Write ONE JSON file: /tmp/claude-0/-home-user-Sample-R/df158ff8-aba0-5f2b-92d7-35127ce48f75/scratchpad/ideas/<video_id>.json
   Write it immediately after finishing that transcript, before reading the next one.

JSON schema (strict, valid JSON, UTF-8):
{
  "video_id": "<id>",
  "date": "<YYYY-MM-DD from batch file>",
  "title": "<title from batch file>",
  "summary": "<2-3 sentences: what this talk is about and the main takeaways>",
  "ideas": [
    {
      "idea": "<one crisp sentence stating the idea or claim, in Pabrai's own framing>",
      "topic": "<exactly one topic from the list below>",
      "detail": "<1-3 sentences of supporting reasoning, example, or number he gives>",
      "stocks_or_cases": ["<company, investor or case study names mentioned for this idea, else empty list>"]
    }
  ]
}

Topic list (use these exact strings, nothing else):
- "Cloning & learning from great investors"
- "Circle of competence & checklists"
- "Valuation & margin of safety"
- "Portfolio concentration & selling"
- "Compounding & long-term holding"
- "Moats & business quality"
- "Management & capital allocation"
- "Markets, cycles & macro"
- "Stock case studies"
- "Geographies: India, China, Turkey, Japan, US"
- "Psychology & temperament"
- "Buffett & Munger lessons"
- "Mistakes & lessons learned"
- "Career, entrepreneurship & life"
- "Philanthropy & Dakshana"

Rules:
- Extract 8 to 25 ideas per transcript, scaled to length and richness. Prefer distinct ideas over restatements.
- Ideas must be things Pabrai actually says or endorses in THIS transcript, not general knowledge. If a questioner says it and Pabrai rejects it, do not include it.
- Keep specific numbers, company names and years when he gives them. They matter for dating ideas.
- Do not skip any video. Do not merge videos. Do not invent content for a short or thin transcript; fewer ideas is fine, minimum 3.
- Validate that each JSON file parses (python3 -c "import json;json.load(open(path))") before moving on.
- Final reply: one line per video: "<id> OK <n ideas>" or "<id> FAILED <reason>". Nothing else.
