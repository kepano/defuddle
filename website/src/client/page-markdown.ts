const copyIcon = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>';
const checkIcon = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>';

const copyTimers = new WeakMap<HTMLButtonElement, number>();

document.addEventListener('click', async (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>('[data-copy-markdown]');
  const markdownPath = button?.dataset.copyMarkdown;
  if (!button || !markdownPath) return;

  const previous = copyTimers.get(button);
  if (previous) window.clearTimeout(previous);
  delete button.dataset.copied;
  delete button.dataset.copyError;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  try {
    const markdown = fetch(markdownPath, { headers: { Accept: 'text/markdown' } }).then(async (response) => {
      if (!response.ok) throw new Error(`Unable to fetch ${markdownPath}`);
      return response.text();
    });
    // Safari requires starting the clipboard write before awaiting the fetch.
    if ('ClipboardItem' in window && navigator.clipboard.write) {
      const item = new ClipboardItem({ 'text/plain': markdown.then((value) => new Blob([value], { type: 'text/plain' })) });
      await navigator.clipboard.write([item]);
    } else {
      await navigator.clipboard.writeText(await markdown);
    }
    button.dataset.copied = '';
    button.setAttribute('aria-label', 'Copied Markdown');
    button.innerHTML = `${checkIcon}<span>Copy Markdown</span>`;
    const previous = copyTimers.get(button);
    if (previous) window.clearTimeout(previous);
    copyTimers.set(button, window.setTimeout(() => {
      delete button.dataset.copied;
      button.removeAttribute('aria-label');
      button.innerHTML = `${copyIcon}<span>Copy Markdown</span>`;
    }, 2000));
  } catch {
    button.dataset.copyError = '';
    button.setAttribute('aria-label', 'Copy failed');
    button.innerHTML = `${copyIcon}<span>Copy failed</span>`;
    const previous = copyTimers.get(button);
    if (previous) window.clearTimeout(previous);
    copyTimers.set(button, window.setTimeout(() => {
      delete button.dataset.copyError;
      button.removeAttribute('aria-label');
      button.innerHTML = `${copyIcon}<span>Copy Markdown</span>`;
    }, 2000));
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
});
