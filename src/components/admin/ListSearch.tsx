import { useEffect, useEffectEvent, useState } from "react";
import SearchInput from "@/components/primitives/SearchInput";

const WAIT_MS = 300;

interface Props {
  /** The search the list was loaded with. A new one (Back, a link) replaces what's in the box. */
  value: string;
  /** Asks for the list with this search, once typing has paused. */
  onSearch: (query: string) => void;
  placeholder: string;
}

/**
 * A server-searched list's search box: it asks for a new search 300 ms after
 * the last key, as Lightning's filter inputs debounce, so a list isn't
 * reloaded for every letter.
 */
export default function ListSearch({ value, onSearch, placeholder }: Props) {
  const [text, setText] = useState(value);
  // The last search asked for. When `value` changes, a search from outside (not this box's own coming back) replaces
  // what's typed and drops a pending one; this box's own doesn't, so typing on isn't undone.
  const [sent, setSent] = useState(value);
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    if (value !== sent) {
      setSent(value);
      setText(value);
    }
  }
  // Called when the timer fires, so it asks with the URL as it is then, not as it was at the key.
  const search = useEffectEvent((query: string) => {
    setSent(query);
    onSearch(query);
  });
  useEffect(() => {
    if (text === sent) return;
    const timer = setTimeout(() => search(text), WAIT_MS);
    return () => clearTimeout(timer);
  }, [text, sent]);

  return <SearchInput value={text} placeholder={placeholder} onChange={setText} />;
}
