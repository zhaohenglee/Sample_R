import type { Metadata } from "next";
import Link from "next/link";
import { isAuthed } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = { title: "Personal Finance" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthed();
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 text-sm">
            <Link href="/" className="font-semibold">Finance</Link>
            <Link href="/transactions" className="text-gray-600 hover:text-gray-900">Transactions</Link>
            <Link href="/categories" className="text-gray-600 hover:text-gray-900">Categories</Link>
            <Link href="/rules" className="text-gray-600 hover:text-gray-900">Rules</Link>
            <Link href="/budgets" className="text-gray-600 hover:text-gray-900">Budgets</Link>
            <Link href="/accounts" className="text-gray-600 hover:text-gray-900">Accounts</Link>
            <Link href="/sync" className="text-gray-600 hover:text-gray-900">Sync</Link>
            {authed && (
              <form method="post" action="/api/auth/logout" className="ml-auto">
                <button className="text-gray-600 hover:text-gray-900">Logout</button>
              </form>
            )}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
