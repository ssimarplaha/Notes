# Question Design Guide

Use this guide to create the final test section.

## Goal

The test should make the reader practice the important ideas in multiple ways. A user should be able to repeat it two or three times and still reinforce the full topic set.

## Coverage Rules

- Map every important section to at least one question.
- Prefer practical judgment over trivia.
- Include a mix of recall, diagnosis, application, and command-selection questions.
- Test corrected misconceptions explicitly.
- Use examples and small scenarios when possible.

## Question Mix

Use the content-supported mix:

- True/False: fast checks for definitions, misconceptions, and safety rules.
- MCQ: choose the right tool, command, design choice, or interpretation.
- Completion: key terms, commands, flags, or short definitions.
- Written/Calculation: explain reasoning, diagnose a failure, write a small command, or compare tradeoffs.

## Difficulty

Each topic should include:

- One basic comprehension question.
- One practical application or failure-mode question when possible.
- One synthesis question for larger topics.

## Answer Quality

- MCQ options must be plausible and mutually distinct.
- True/False answers must be unambiguous.
- Completion questions must include accepted answer variants.
- Written questions must include a model answer and keywords for assisted checking.
- Every question must include `sectionId` and `source` so weak-topic stats are useful.

## Test UI Rules

- Style the test like an end-of-chapter exercise section.
- Add a per-question `Show Answer` button below each question's input/options.
- The per-question answer button should toggle to `Hide Answer` and should not score the question, change the user's answer, or affect stats.
- Global reveal should expand all answer panels and toggle back cleanly.
- Correct, wrong, and review feedback should color the entire question border, not a left-only bar.
- Keep test feedback readable and restrained; use subtle background tint only when it improves clarity.
- Preserve shuffle, check/save, reset, stats, weak-topic review, and wrong-question print/export behavior.

## Avoid

- Questions that only test wording from the notes.
- Multiple correct MCQ answers unless the question explicitly asks for that pattern.
- Trick questions.
- Questions that require facts not covered in the notes or citations.
