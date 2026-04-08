```json
{
  "title": "Callouts",
  "author": "",
  "site": "Example Help",
  "published": ""
}
```

To create a callout, add `[!info]` to the first line of a blockquote.

```markdown
> [!info] A callout title
> Here is the callout **body** content.
```

> [!info] A callout title
> Here is the callout **body** content.

### Foldable callouts

A minus sign collapses the callout.

```markdown
> [!faq]- Is this foldable?
> Yes, the content is hidden when collapsed.
```

> [!faq]- Is this foldable?
> Yes, the content is hidden when collapsed.

### Supported types

Each type has a different color and icon.

> [!note] Note
> ```md
> > [!note]
> > Lorem ipsum dolor sit amet
> ```

---

> [!abstract]- Abstract
> ```md
> > [!abstract]
> > Lorem ipsum dolor sit amet
> ```

Aliases: `summary`, `tldr`

---

> [!tip]- Tip
> ```md
> > [!tip]
> > Lorem ipsum dolor sit amet
> ```

Aliases: `hint`, `important`