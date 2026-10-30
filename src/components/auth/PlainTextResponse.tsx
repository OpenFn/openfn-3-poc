/**
 * A bare text/plain response as the browser shows it. Lightning answers
 * blocked routes (e.g. /users/register with signup off) this way, with no
 * layout at all. Routed outside the app shell, so it's just a white page.
 */
export default function PlainTextResponse({ children }: { children: string }) {
  return (
    // eslint-disable-next-line no-restricted-syntax -- a copy of the browser's bare text/plain page, not app type
    <pre className="min-h-screen whitespace-pre-wrap break-words bg-surface p-2 text-sm text-strong">{children}</pre>
  );
}
