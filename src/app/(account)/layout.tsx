import { Wordmark } from "@/components/site/wordmark";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6">
          <Wordmark />
        </div>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
    </>
  );
}
