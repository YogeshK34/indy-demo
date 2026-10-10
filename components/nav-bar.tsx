"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/oauth-inspector", label: "OAUTH INSPECTOR" },
  { href: "/did", label: "DID" },
  { href: "/issuer", label: "ISSUER" },
  { href: "/holder", label: "HOLDER" },
  { href: "/verifier", label: "VERIFIER" },
  { href: "/compare", label: "COMPARE" },
]

export function NavBar({ email }: { email?: string }) {
  const pathname = usePathname()

  return (
    <nav className="flex items-center justify-between px-6 h-[56px] border-b-2 border-black bg-[#F5F5F0]">
      <div className="font-black text-[1.1rem] tracking-[-0.03em]">
        SSI DEMO
      </div>
      <div className="flex items-center gap-4 text-sm font-bold">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive
                  ? "bg-[#FFDD00] px-3 py-1 border-2 border-black"
                  : "hover:underline"
              }
            >
              {link.label}
            </Link>
          )
        })}
        {email && (
          <div className="ml-4 flex items-center gap-4">
            <span className="font-mono text-xs text-gray-500">{email}</span>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-xs uppercase border-2 border-black px-2 py-1 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_#0A0A0A] transition-all bg-white">
                Logout
              </button>
            </form>
          </div>
        )}
      </div>
    </nav>
  )
}
