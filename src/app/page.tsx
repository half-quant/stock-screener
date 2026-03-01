import Link from "next/link";

const features = [
  {
    title: "Smart Screening",
    description:
      "Filter stocks by fundamentals, valuations, growth rates, and technical indicators with a powerful query builder.",
  },
  {
    title: "AI-Powered Theses",
    description:
      "Generate detailed investment theses using Claude AI, grounded in real financial data with full source attribution.",
  },
  {
    title: "Real-Time Data",
    description:
      "Access up-to-date financial data, price quotes, and key metrics refreshed throughout the trading day.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Stock Screener +{" "}
            <span className="text-primary">AI Thesis Generator</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Screen thousands of stocks with powerful filters, then generate
            AI-powered investment theses backed by real financial data. Make
            smarter, data-driven investment decisions.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mx-auto mt-24 grid max-w-5xl grid-cols-1 gap-8 px-4 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-card p-8"
            >
              <h3 className="text-lg font-semibold text-card-foreground">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8">
        <p className="text-center text-sm text-muted-foreground">
          StockScreener AI — Data provided by Financial Modeling Prep. AI theses
          powered by Claude.
        </p>
      </footer>
    </div>
  );
}
