"use client";

import * as React from "react";

function subscribe() {
  return () => {};
}

export function useIsMounted() {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
