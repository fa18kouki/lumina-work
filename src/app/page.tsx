import {
  Hero,
  HowItWorks,
  ServiceSteps,
  AppFeatures,
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
      <ServiceSteps />
      <HowItWorks />
      <AppFeatures />
      <PickupStores />
      <MiniGames />
      <UserVoices />
      <FAQ />
      <Footer />
      <FixedCTA />
    </main>
  );
}
