import Nav from "./_components/Nav";
import Hero from "./_components/Hero";
import ScreenshotMock from "./_components/ScreenshotMock";
import Modes from "./_components/Modes";
import FeatureGrid from "./_components/FeatureGrid";
import McpCallout from "./_components/McpCallout";
import Install from "./_components/Install";
import Footer from "./_components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ScreenshotMock />
        <Modes />
        <FeatureGrid />
        <McpCallout />
        <Install />
      </main>
      <Footer />
    </>
  );
}
