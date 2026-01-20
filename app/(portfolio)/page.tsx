/**
 * Purpose: Render the main portfolio landing page content.
 * Main responsibilities: Mount the top-level PortfolioContent component.
 * Key collaborators: Uses `components/PortfolioContent` for sections.
 */
import PortfolioContent from "@/components/PortfolioContent";

/**
 * Purpose: Provide the Next.js page component for the portfolio root.
 * Main responsibilities: Wrap the portfolio content in a page-level main tag.
 * Outputs: Returns the portfolio page JSX.
 */
export default async function Home() {
  return (
    <main className="min-h-screen">
      <PortfolioContent />
    </main>
  );
}
