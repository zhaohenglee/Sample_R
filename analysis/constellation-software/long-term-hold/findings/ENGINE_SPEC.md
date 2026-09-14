# Stage 4 spec: engine durability and kill criteria

Two files. Concise, plain English, no hyphens as punctuation, no em dashes. Every number carries a citation tag immediately after it, using the tag scheme in findings/HOLDING_TEMPLATE.md. Arithmetic in prose only when both inputs are cited in the same sentence and marked "computed here"; prefer citing hold_metrics.json.

## findings/engine_durability.md

Structure: one section per hold test in brief.json, in order, each ending with a one line verdict (Holds, Holds with conditions, Fails) and the evidence weight (strong, moderate, thin).

1. Reinvestment runway. Use hold_metrics reinvestment_grid and ten_year_history. State what reinvestment rate and return the ten year case needs, what the record shows for 2015 to 2020 and 2020 to 2025, and what the 2026 pace implies. Use the group level deal counts from holdings.json to say where the runway sits (which groups deploy most).
2. Organic floor. Parent organic series from the first report's ledger and from parent_long_run, Topicus and Lumine organic from hold_metrics listed_subsidiaries, any group level organic comments from holdings.json. Say which parts of the whole are above and below zero real organic growth.
3. Decentralisation as moat. Evidence from holdings.json leadership: founder era leaders still in post, successions completed (Harris 2024, Perseus 2023, Volaris 2025, parent 2025), allocators exported between groups, new groups formed (Topicus, Lumine, Omegro, Vencora, Modaxo, CORA). Say whether the structure is producing allocators faster than it consumes them.
4. AI exposure by vertical. Roll up the per group exposure using the four layer framework from the first report's findings/ai_disruption.md, weighted by whatever scale figures exist. Name the most and least exposed groups and say how much of the whole each is, or say that the weight is a gap.
5. Listed subsidiaries. Use hold_metrics look_through: what CSU owns of Topicus and Lumine, what that is worth, share of CSU market cap, implied value of the private groups. State the FX caveat. Judge whether the spin out model creates value (currency, focus, talent retention) or leaks it (minority holders, 13.83 percent of Lumine to WideOrbit holders, Topicus at 30 percent economic).
6. Summary table: one row per hold test, verdict, evidence weight, the group most responsible.

End with a Gaps section.

## findings/kill_criteria.md

A short document. For each of five to seven criteria: the observable metric, its source (which press release line or filing), the threshold, the window (how many consecutive quarters or years), the current reading with citation, and what it would mean. Criteria must be things a holder can read from Constellation's quarterly press release or the listed subsidiaries' releases, not internal data. Include at least: FX adjusted organic growth, maintenance organic growth, acquisitions deployed as a multiple of FCFA2S combined with a return signal, FCFA2S per share growth, leverage on a stated definition, and a leadership or governance trigger. End with a one paragraph monitoring routine: what to read each quarter and in what order.
