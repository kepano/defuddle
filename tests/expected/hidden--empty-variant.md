```json
{
  "title": "Evaluation guide",
  "author": "",
  "site": "example.com",
  "published": ""
}
```

Use these checks during development before enabling them in production.

Start with a small collection of saved examples that represents the requests your application receives. Run the same checks against each example and inspect the results before making changes. Keep examples with expected successes and failures so that a change does not hide an important difference. Once the checks are reliable, run them against new observations and compare the results with the saved examples. This gives the team a repeatable way to investigate unexpected behavior and verify later improvements.

Production note: Validate the checks on saved examples before enabling continuous monitoring.

Text-only notes are visible when they contain instructions.

Notes at larger screen sizes still contain useful instructions.

This note is shown at a responsive breakpoint.

Review the results after deploying a change.
