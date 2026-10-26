// Pengganti use-sync-external-store/shim untuk tes: paket aslinya (CJS) ter-hoist ke node_modules root
// dan memuat React milik workspace mobile, sehingga hook TipTap memakai React yang berbeda dari komponen.
import { useCallback, useRef, useSyncExternalStore } from 'react';

export { useSyncExternalStore };

export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (onChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const memo = useRef<{ snap: Snapshot; sel: Selection } | null>(null);
  const getSelection = useCallback(() => {
    const snap = getSnapshot();
    if (memo.current && memo.current.snap === snap) return memo.current.sel;
    const sel = selector(snap);
    if (memo.current && isEqual && isEqual(memo.current.sel, sel)) {
      memo.current = { snap, sel: memo.current.sel };
      return memo.current.sel;
    }
    memo.current = { snap, sel };
    return sel;
  }, [getSnapshot, selector, isEqual]);
  const getServerSelection = getServerSnapshot ? () => selector(getServerSnapshot()) : undefined;
  return useSyncExternalStore(subscribe, getSelection, getServerSelection);
}
