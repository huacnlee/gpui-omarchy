import { useEffect, useRef, useState } from 'react';
import './ThemeMenu.css';

type CopyButtonProps = { text: string; label?: string };

export default function CopyButton({ text, label = 'Copy' }: CopyButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);

  async function copy() {
    if (timeout.current) clearTimeout(timeout.current);
    try {
      await navigator.clipboard.writeText(text);
      setStatus('copied');
      timeout.current = setTimeout(() => setStatus('idle'), 2200);
    } catch {
      setStatus('error');
    }
  }

  return (
    <span className="copy-control">
      <button
        type="button"
        className="copy-button"
        onClick={copy}
        aria-label={status === 'error' ? 'Copy failed. Retry copying to clipboard' : `${label} to clipboard`}
      >
        {status === 'copied' ? 'Copied' : status === 'error' ? 'Retry copy' : label}
      </button>
      <span className="control-status" role="status">
        {status === 'copied' ? 'Copied to clipboard.' : status === 'error' ? 'Could not access the clipboard. Retry or select and copy the code.' : ''}
      </span>
    </span>
  );
}
