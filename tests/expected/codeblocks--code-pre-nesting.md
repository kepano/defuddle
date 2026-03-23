```json
{
  "title": "Quickstart",
  "author": "",
  "site": "Example Docs",
  "published": ""
}
```

Install the package and run your first job:

```
npm install example-sdk

const sdk = require('example-sdk');
const result = await sdk.run({ task: 'hello' });
console.log(result);
```

You can also pass options:

```typescript
interface Options {
  task: string;
  model?: string;
  maxSteps?: number;
}
```