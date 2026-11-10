# Workout CSV transfer

The v1 CSV format transfers weights and reps. Optional RPE/RIR effort ratings are retained in the application but are not columns in this version of CSV; importing CSV leaves effort ratings unset.

The workout journal’s **Export CSV** downloads all of the signed-in account’s workout logs, one row per set, in UTF-8 with a BOM. An empty journal exports a header-only template. **Import CSV** validates and previews the file before the explicit import action. Files are limited to 2 MiB and 10,000 set rows.

## Columns

Columns must occur in this order:

```text
format_version,workout_id,date,category,exercise,exercise_notes,rep_min,rep_max,set_number,weight_kg,reps,workout_notes
```

- `format_version`: `forge-workouts-v1` on every row.
- `workout_id`: 1–80 letters, digits, underscores or hyphens. Every set in the same exercise log uses the same ID. Different workouts need different IDs, even when logged on the same day.
- `date`: a valid `YYYY-MM-DD` date.
- `category`, `exercise`: category and exercise names (up to 50 and 80 characters).
- `exercise_notes`: optional exercise notes (up to 1,000 characters).
- `rep_min`, `rep_max`: exercise target rep range, integers 1–1,000, with minimum no greater than maximum.
- `set_number`: ordered integers starting at 1 with no gaps or repeats, up to 50 sets per workout.
- `weight_kg`: 0–1,500, with at most two decimal places; no thousands separators.
- `reps`: integer 1–1,000.
- `workout_notes`: optional notes for this workout (up to 1,000 characters).

All rows sharing a workout ID must agree on workout metadata. Exercise settings must be consistent across occurrences of the same category/exercise in a file. Commas, quotes and embedded newlines use standard CSV quoting: enclose the field in double quotes and double any embedded quote.

## Text safety and round trips

Exports prefix text beginning with an apostrophe, or with a spreadsheet formula marker (`=`, `+`, `-`, `@`, tab or carriage return, including after leading whitespace), with one apostrophe. The v1 importer removes exactly one leading apostrophe from text columns. A legitimate leading apostrophe therefore appears doubled in the exported CSV. Preserve this escaping convention when editing the file; it allows ordinary spreadsheet-safe exports to round-trip without losing original text. Dates, weights and counts are validated numeric/date fields rather than executable strings.

## Import behavior

- Imports are atomic: all rows validate before anything is written; unexpected write failures roll the whole import back.
- Missing categories and exercises are created within the importing account. Existing names are matched case-insensitively within that account/category. Ambiguous duplicate exercise names require renaming before import.
- Existing exercise settings are kept; imports do not overwrite notes, readiness or rep ranges on an already-existing exercise. Missing exercises receive the file’s notes/range and start with readiness off.
- Existing workout IDs belonging to the account and previously imported source IDs are skipped when their source content matches. Changed content for the same source ID is rejected rather than overwriting a saved workout. Edit the existing workout in the journal, or use a new ID only for a genuinely new session.
- The same CSV can be imported into another account without sharing or modifying the original account’s data. New internal IDs are generated.
- Deleting an imported workout also removes its import receipt. Re-importing the file can restore that deleted workout.

The graph summary remains the workout’s heaviest set; the journal retains and displays every imported set.
