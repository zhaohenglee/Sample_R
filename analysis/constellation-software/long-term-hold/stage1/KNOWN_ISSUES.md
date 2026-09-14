# Stage 1 known issues found by Fable spot review, to be resolved at Stage 2

1. perseus.json: "annual revenue FY2024 10.06 billion USD", "free cash flow FY2024 1.47 billion USD" and "total acquisitions completed 1,100+" are Constellation parent figures (ledger revenue FY2024 10,066; FCFA2S FY2024 1,472), not Perseus figures. Do not carry them into holdings.json as Perseus fields. Record in conflicts as misattributed and set Perseus revenue to gap.
2. volaris.json: three third party revenue figures (FY2024 3,142; FY2025 3,038; FY2026 3,400 USD millions) are inconsistent in ordering and none is company sourced. Carry all three into a single field with confidence third_party and a conflict record. Do not pick one.
3. topicus.json: "Organic growth FY2023 22.72 percent" is third party and inconsistent with every company sourced organic figure (4 to 5 percent). It is likely total revenue growth. Record as conflict, do not use as organic growth.
4. topicus.json: "Free cash flow available to shareholders Q2 2026 14.6 EUR millions" is third party and small against H1 2026 180.1. Topicus cash flow is seasonal so this may be right; carry it with a note and check Q1 plus Q2 against H1 if a Q1 figure exists.
5. lumine.json first pass: "Constellation Software ownership subordinate voting shares 9e-06 percent" is a transcription error. The second pass was asked to fix it. If it remains, drop it and note the gap.
6. harris.json: "USD 1.4B revenue (2026)" is third party. Carry with confidence third_party and period as stated by the source.
7. Employee counts across groups mix "direct" and "across portfolio" definitions (Volaris 11,704 versus 17,500). Keep both with their definitions in the note field.
8. Any figure whose unit contains "approximately" or a plus sign must keep that wording in the unit or note.
