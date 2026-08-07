/**
 * Landing page layout — no auth wrapper, standalone dark page.
 * This overrides the root layout's body styles for the landing route.
 */
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
