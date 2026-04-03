```json
{
  "title": "Lessons from Building API Integrations - Example Dev Blog",
  "author": "Jane Smith",
  "site": "Jane Smith",
  "published": ""
}
```

## Lessons from Building API Integrations

Over the past year, our team has built and maintained dozens of API integrations for our platform. Along the way, we learned some valuable lessons about reliability, error handling, and developer experience that we want to share with the community.

## Understanding Rate Limits

Every API has rate limits, but not every API communicates them clearly. Some return HTTP 429 responses with retry-after headers, while others silently drop requests or return degraded responses. We found that the most robust approach is to implement adaptive rate limiting that monitors response patterns and adjusts request frequency automatically.

Our rate limiter tracks the rolling average of response times and error rates. When either metric exceeds a configurable threshold, it backs off exponentially. This approach works well even with APIs that do not provide explicit rate limit headers, because the degradation in response quality is detectable before hard failures occur.

We also discovered that many APIs have undocumented rate limits that apply per endpoint rather than globally. For example, a search endpoint might have stricter limits than a simple record lookup. Mapping these hidden limits required careful monitoring and logging over weeks of production traffic.

## Ignore the Error and Retry

One counterintuitive lesson we learned is that sometimes the best strategy for handling transient errors is to simply retry the request without any special error handling logic. Many APIs return intermittent 500 errors that resolve on the next attempt. Adding complex error categorization and recovery logic for these cases added maintenance burden without improving reliability.

Our retry middleware uses a simple exponential backoff with jitter. The jitter component is critical because without it, multiple clients that encounter the same outage will synchronize their retries and create thundering herd problems that prolong the outage. Adding random jitter between zero and the full backoff interval distributes retries evenly across time.

We tracked retry success rates across all integrations and found that roughly seventy percent of retried requests succeed on the second attempt. By the third attempt, the success rate climbs to ninety-two percent. Beyond three retries, the marginal benefit drops sharply and it is better to surface the error to the user.

## Parsing Response Formats

Different APIs return data in wildly different formats even when they claim to follow REST conventions. Some nest the actual data inside envelope objects with metadata, while others return flat arrays. Some use camelCase field names, others use snake\_case, and a few use inconsistent mixtures of both within the same response.

We built a normalization layer that transforms each API response into a consistent internal format before passing it to business logic. This decouples our application code from the quirks of individual APIs and makes it easier to swap out or upgrade integrations without touching the rest of the codebase.

## Code Example: Retry Logic with Logging

Here is a simplified version of our retry middleware that includes structured logging for observability:

```python
async def retry_request(client, method, url, max_retries=3):
    # comments explaining retry logic
    # Comments
    for attempt in range(max_retries):
        try:
            response = await client.request(method, url)
            response.raise_for_status()
            return response
        except HTTPError as e:
            logger.warning(f"Attempt {attempt} failed: {e}")
            await sleep(backoff * (2 ** attempt) + random_jitter())
    raise MaxRetriesExceeded(f"Failed after {max_retries} attempts")
```

## Conclusion

Building reliable API integrations requires patience and careful observation.

The patterns we described here have served us well across many different APIs.

We hope these lessons save you time on your own integration projects.