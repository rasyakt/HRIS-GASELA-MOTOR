import { redirect } from "next/navigation";

/**
 * Root route — redirect visitors to the public company landing page.
 * Authenticated users can navigate to /dashboard from the landing page's
 * "HRIS Portal" button.
 */
export default function Home() {
  redirect("/landing");
}