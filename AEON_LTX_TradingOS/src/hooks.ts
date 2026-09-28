import { useEffect, useState } from 'react';
import { os, type OSState } from './lib/engine';

/** Subscribe React component to the dummy market engine store. */
export function useOS(): OSState {
  const [s, set] = useState<OSState>(os.state);
  useEffect(() => os.subscribe(() => set(os.state)), []);
  return s;
}
