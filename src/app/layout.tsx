import type { Metadata } from "next";
import { Header, Footer } from "@/components/shell";
import "./globals.css";
export const metadata:Metadata={
  title:{default:"Eventura AI — Your vision. Beautifully planned.",template:"%s | Eventura AI"},
  description:"Plan weddings, birthdays and community events with a personalized budget, timeline and checklist. Free rule-based starter plans, saved in your browser."
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main">{children}</main><Footer/></body></html>;
}
