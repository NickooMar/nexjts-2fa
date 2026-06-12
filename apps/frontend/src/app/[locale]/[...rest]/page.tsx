import { notFound } from "next/navigation";

// Catch-all for URLs that match no real route. Without it, unknown paths fall
// through to the root not-found boundary outside the [locale] tree, which
// forces the client router into a full-page (MPA) navigation and remounts the
// whole app. Resolving them here keeps 404s inside the locale layout so
// navigation stays client-side and session/router state survives.
export default function CatchAllNotFound() {
  notFound();
}
