```json
{
  "title": "ChatKit | OpenAI API",
  "author": "",
  "site": "",
  "published": ""
}
```

## ChatKit

ChatKit is the best way to build agentic chat experiences. Whether you’re building an internal knowledge base assistant, HR onboarding helper, research companion, shopping or scheduling assistant, troubleshooting bot, financial planning advisor, or support agent, ChatKit provides a customizable chat embed to handle all user experience details.

Use ChatKit’s embeddable UI widgets, customizable prompts, tool-invocation support, file attachments, and chain-of-thought visualizations to build agents without reinventing the chat UI.

1. Render ChatKit in your UI. This code fetches the client secret from your server and mounts a live chat widget, connected to your workflow as the backend.
	```react
	import { ChatKit, useChatKit } from '@openai/chatkit-react';
	export function MyChat() {
	  const { control } = useChatKit({
	    api: {
	      async getClientSecret(existing) {
	        if (existing) {
	          // implement session refresh
	        }
	        const res = await fetch('/api/chatkit/session', {
	          method: 'POST',
	          headers: {
	            'Content-Type': 'application/json',
	          },
	        });
	        const { client_secret } = await res.json();
	        return client_secret;
	      },
	    },
	  });
	  return <ChatKit control={control} className="h-[600px] w-[320px]" />;
	}
	```
	```javascript
	const chatkit = document.getElementById('my-chat');
	chatkit.setOptions({
	  api: {
	    getClientSecret(currentClientSecret) {
	      if (!currentClientSecret) {
	        const res = await fetch('/api/chatkit/start', { method: 'POST' })
	        const { client_secret } = await res.json();
	        return client_secret
	      }
	      const res = await fetch('/api/chatkit/refresh', {
	        method: 'POST',
	        body: JSON.stringify({ currentClientSecret }),
	        headers: {
	          'Content-Type': 'application/json',
	        },
	      });
	      const { client_secret } = await res.json();
	      return client_secret
	    }
	  },
	});
	```

### 3\. Build and iterate

See the [custom theming](https://developers.openai.com/api/docs/guides/chatkit-themes), [widgets](https://developers.openai.com/api/docs/guides/chatkit-widgets), and [actions](https://developers.openai.com/api/docs/guides/chatkit-actions) docs to learn more about how ChatKit works. Or explore the following resources to test your chat, iterate on prompts, and add widgets and tools.

#### See working examples

[

Samples on GitHub

See working examples of ChatKit and get inspired.

](https://github.com/openai/openai-chatkit-advanced-samples)[

Starter app repo

Clone a repo to start with a fully working template.

](https://github.com/openai/openai-chatkit-starter-app)

## Next steps

When you’re happy with your ChatKit implementation, learn how to optimize it with [evals](https://developers.openai.com/api/docs/guides/agent-evals). To run ChatKit on your own infrastructure, see the [advanced integration docs](https://developers.openai.com/api/docs/guides/custom-chatkit).
