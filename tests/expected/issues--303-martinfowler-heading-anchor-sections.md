```json
{
  "title": "Harness engineering for coding agent users",
  "author": "",
  "site": "",
  "published": ""
}
```

The term harness has emerged as a shorthand to mean everything in an AI agent except the model itself. That is a wide definition, and this fixture narrows it to coding agents while keeping enough prose to avoid low-content retry behavior. A well-built outer harness increases the probability that the agent gets it right in the first place and provides a feedback loop that self-corrects issues before they reach human eyes.

## Feedforward and Feedback

To harness a coding agent we both anticipate unwanted outputs and try to prevent them, and we put sensors in place to allow the agent to self-correct after it acts.

- **Guides** anticipate the agent's behaviour and aim to steer it before it acts.
- **Sensors** observe after the agent acts and help it self-correct.

## Computational vs Inferential

Computational controls are deterministic and fast. Inferential controls add semantic judgment, but they are slower, more expensive, and less deterministic.

![Shows examples of continuous feedback sensors after change integration.](https://martinfowler.com/articles/harness-engineering/harness-continuous-feedback-examples.png)

## The role of the human

Human developers bring context, accountability, taste, organisational memory, and judgment that a coding agent does not carry by default. Harnesses externalise some of that experience, but they should direct human input to where it matters most.
