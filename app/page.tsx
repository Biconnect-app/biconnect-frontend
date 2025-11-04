import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/sections/hero"
import { HowItWorks } from "@/components/sections/how-it-works"
import { Benefits } from "@/components/sections/benefits"
import { Integrations } from "@/components/sections/integrations"
import { PricingPreview } from "@/components/sections/pricing-preview"
import { Security } from "@/components/sections/security"
import { FAQ } from "@/components/sections/faq"

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
        <Integrations />
        <PricingPreview />
        <Security />
        <FAQ />
      </main>
    </div>
  )
}
