"use client";

import { useMemo } from "react";
import { useApp } from "./store";
import { computeView } from "./view";

export function useView() {
  const connected = useApp((s) => s.connected);
  const deletedCollections = useApp((s) => s.deletedCollections);
  const deletedContacts = useApp((s) => s.deletedContacts);
  const renamed = useApp((s) => s.renamed);
  const pinnedCollections = useApp((s) => s.pinnedCollections);
  const pinnedContacts = useApp((s) => s.pinnedContacts);
  const customCollections = useApp((s) => s.customCollections);
  const customContacts = useApp((s) => s.customContacts);

  return useMemo(
    () =>
      computeView({
        connected,
        deletedCollections,
        deletedContacts,
        renamed,
        pinnedCollections,
        pinnedContacts,
        customCollections,
        customContacts,
      }),
    [connected, deletedCollections, deletedContacts, renamed, pinnedCollections, pinnedContacts, customCollections, customContacts],
  );
}

/** The slice of state the server needs to rebuild the same view for Thera. */
export function getTheraState() {
  const s = useApp.getState();
  return {
    userName: s.user.name,
    connected: s.connected,
    deletedCollections: s.deletedCollections,
    deletedContacts: s.deletedContacts,
    renamed: s.renamed,
    pinnedCollections: s.pinnedCollections,
    pinnedContacts: s.pinnedContacts,
    customCollections: s.customCollections.map(({ cover, ...c }) => {
      void cover;
      return c;
    }),
    customContacts: s.customContacts,
  };
}
