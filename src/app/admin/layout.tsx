import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * The admin center is a tool, not content.
 *
 * `noindex, nofollow` keeps it out of search results, and public/robots.txt
 * disallows the path as well.
 *
 * On trust: in a production build this page only ever reads and writes
 * localStorage in the visitor's own browser. There is no shared state behind
 * it and no server write path (the save route returns 404 outside
 * development), so an unauthenticated /admin cannot expose or alter anything
 * belonging to anyone else — a stranger who opens it can only edit their own
 * private copy and download it. That property is what makes the whole
 * backend-free design safe, and it stops holding the moment a real database
 * or hosted write path is added, at which point this route needs genuine
 * authentication and authorization.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
