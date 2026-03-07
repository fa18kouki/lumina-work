import {
  Hero,
  HowItWorks,
  PickupStores,
  MiniGames,
  UserVoices,
  FAQ,
  Footer,
  FixedCTA,
} from "@/components/lp";

export default function Home() {
  return (
    <main className="bg-white">
      <Hero />
      <HowItWorks />
      <PickupStores />
      <MiniGames />
      <UserVoices />
      <FAQ />
      <Footer />
      <FixedCTA />
    </main>
  );
}
