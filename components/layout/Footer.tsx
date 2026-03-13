import Link from "next/link"

const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "New Arrivals", href: "#new-arrivals" },
      { label: "Collections", href: "#collections" },
      { label: "Designers", href: "#designers" },
      { label: "Sale", href: "#sale" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Shipping", href: "#" },
      { label: "Returns", href: "#" },
      { label: "Size Guide", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-serif text-xl tracking-widest text-foreground mb-4">NOIR</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              AI-powered luxury fashion, curated for the discerning individual.
            </p>
          </div>

          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs tracking-widest uppercase text-foreground mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© 2026 NOIR. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Instagram</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Pinterest</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Twitter</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
