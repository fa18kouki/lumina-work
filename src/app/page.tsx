import {
  Hero,
  LpNoticeBar,
  ServiceSteps,
  HowItWorks,
  TrustAndSafety,
  PickupStores,
  LifestyleTags,
  MiniGames,
  UserVoices,
  FAQ,
  Footer,
  FixedCTA,
} from "@/components/lp";

/**
 * トップLP構成は nomination.co.jp を参考に、LUMINA の実装範囲に合わせて調整
 * @see https://nomination.co.jp/
 */
export default function Home() {
  return (
    <main className="bg-white pb-28 md:pb-32">
      <Hero />
      <LpNoticeBar />
      <ServiceSteps />
      <HowItWorks />
      <TrustAndSafety />
      <PickupStores />
      <LifestyleTags />
      <MiniGames />
      <UserVoices />
      <FAQ />
      <Footer />
      <FixedCTA />
    </main>
  );
}
