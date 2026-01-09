import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronRight,
  Facebook,
  Instagram,
  Menu,
  Percent,
  Shield,
  Smartphone,
  Twitter,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../context/UserContext";

function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { role } = useUserContext();

  const handleGetStarted = () => {
    if (role) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  // --- Smooth Scroll Function ---
  const handleScroll = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMobileMenuOpen(false); // Close mobile menu on click
  };

  return (
    <div className="bg-[#0d0f11] text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#1d1d1d]/80 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto flex h-20 max-w-screen-xl items-center justify-between gap-4 px-4 md:px-6">
          <button
            onClick={() => handleScroll("home")}
            className="flex items-center gap-2"
          >
            <img
              src="/favicon.png"
              alt="Saylani Moments Logo"
              className="h-9 w-auto rounded"
            />
            <span className="text-xl font-semibold">Saylani Moments</span>
          </button>
          <div className="hidden items-center gap-6 md:flex">
            <nav className="flex items-center gap-6">
              <button
                onClick={() => handleScroll("home")}
                className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
              >
                Home
              </button>
              <button
                onClick={() => handleScroll("about")}
                className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
              >
                About
              </button>
              <button
                onClick={() => handleScroll("faq")}
                className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
              >
                FAQs
              </button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button
              className="hidden cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200 md:block"
              onClick={handleGetStarted}
            >
              Login as Photographer
            </button>
            <button
              className="rounded-md p-2 transition-colors hover:bg-gray-800 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="border-t border-gray-700 bg-[#1d1d1d] md:hidden">
            <div className="container space-y-2 px-4 py-4">
              <button
                onClick={() => handleScroll("home")}
                className="block w-full py-2 text-left font-medium text-gray-300"
              >
                Home
              </button>
              <button
                onClick={() => handleScroll("about")}
                className="block w-full py-2 text-left font-medium text-gray-300"
              >
                About
              </button>

              <button
                onClick={() => handleScroll("faq")}
                className="block w-full py-2 text-left font-medium text-gray-300"
              >
                FAQs
              </button>
              <div className="border-t border-gray-700 pt-4">
                <button
                  onClick={handleGetStarted}
                  className="w-full cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900"
                >
                  Login as Photographer
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section
          id="home"
          className="relative text-white bg-cover bg-center "
          style={{ backgroundImage: `url("/bg.png")` }}
        >
          {/* FIXED: Added classes to make the overlay visible */}
          <div className="absolute "></div>
          <div className="relative min-h-[100vh] container mx-auto max-w-screen-xl px-4 md:px-6 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center px-6 py-2 rounded-full font-medium text-white border border-white/20 bg-white/10 backdrop-blur-lg shadow-lg hover:bg-white/20 transition text-sm">
                New AI-Powered Face Recognition
              </span>
              <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
                Face Recognition
                <p className="text-gray-200 text-base sm:text-lg block mt-4">
                  Find your event photos instantly with AI face recognition —
                  just snap a selfie.
                </p>
              </h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-6">
                <button className="w-full sm:w-auto px-6 py-3 rounded-full font-semibold text-white bg-white/10 border border-white/20 backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white/20">
                  Free For Guest
                </button>
                <button className="w-full sm:w-auto px-6 py-3 rounded-full font-semibold text-white bg-white/10 border border-white/20 backdrop-blur-md shadow-lg transition-all duration-300 hover:bg-white/20">
                  Instant Photo Deliver
                </button>
              </div>
            </div>
            <div className="flex-1 relative w-full max-w-lg">
              <div className="relative">
                <img
                  src="/Group 11.png"
                  alt="Event Photo collage"
                  className="rounded-xl shadow-2xl w-full relative z-10  top-17 transform lg:rotate-2"
                />
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 md:py-28 bg-[#0d0f11] text-white">
          <div className="container mx-auto w-full max-w-screen-xl px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
                  About Saylani <br /> Moments
                  <button className="ml-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white shadow-lg transition-all duration-300 hover:bg-white/20">
                    <ArrowRight className="h-6 w-6" />
                  </button>
                </h2>
                <p className="text-gray-400 max-w-lg">
                  Saylani Moments is a unique platform designed to help you
                  relive your precious memories. Here, you'll find images from
                  various Saylani Welfare events and gatherings. Simply
                  recognize your face, and all the pictures featuring you will
                  appear instantly – making it easier than ever to cherish and
                  preserve your special moments.
                </p>
              </div>
              <div className="p-4 md:p-6 rounded-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1 row-span-2">
                    <img
                      src="/Person.jpg"
                      alt="Event portrait"
                      className="w-full h-full object-cover rounded-xl shadow-lg"
                    />
                  </div>
                  <div className="col-span-1">
                    <img
                      src="/Person.jpg"
                      alt="Event gathering"
                      className="w-full h-48 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                  <div className="col-span-1">
                    <img
                      src="/Person.jpg"
                      alt="Event concert"
                      className="w-full h-48 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="relative py-20 md:py-28 text-white bg-cover bg-center"
          style={{ backgroundImage: "url('/bg.png')" }}
        >
          {/* FIXED: Added classes to make the overlay visible */}
          <div className="absolute "></div>
          <div className="relative container mx-auto w-full max-w-screen-xl px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 border border-gray-700 rounded-xl space-y-3 bg-white/5 backdrop-blur-sm">
                  <Percent className="h-8 w-8 text-white" />
                  <h3 className="text-xl font-semibold">99.9% Accuracy</h3>
                  <p className="text-gray-400">
                    Experience 99.9% accurate face detection. Your memories,
                    always found instantly.
                  </p>
                </div>
                <div className="p-6 border border-gray-700 rounded-xl space-y-3 bg-white/5 backdrop-blur-sm">
                  <Zap className="h-8 w-8 text-white" />
                  <h3 className="text-xl font-semibold">
                    Instant Photo Delivery
                  </h3>
                  <p className="text-gray-400">
                    Guests get their memories in seconds!
                  </p>
                </div>
                <div className="p-6 border border-gray-700 rounded-xl space-y-3 bg-white/5 backdrop-blur-sm">
                  <Shield className="h-8 w-8 text-white" />
                  <h3 className="text-xl font-semibold">Privacy-First</h3>
                  <p className="text-gray-400">
                    Your photos, your control. Built with a privacy-first
                    approach.
                  </p>
                </div>
                <div className="p-6 border border-gray-700 rounded-xl space-y-3 bg-white/5 backdrop-blur-sm">
                  <Smartphone className="h-8 w-8 text-white" />
                  <h3 className="text-xl font-semibold">
                    Works With Any Device
                  </h3>
                  <p className="text-gray-400">
                    Seamlessly works with any camera or smartphone.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center items-start space-y-6 lg:pl-16">
                <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
                  Why Choose Saylani Moments?
                </h2>
                <button className="px-8 py-3 bg-white text-black font-semibold rounded-full transition-transform transform hover:scale-105">
                  Try Demo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="py-20 md:py-28 bg-[#0d0f11] text-white"
        >
          <div className="container mx-auto w-full max-w-screen-xl px-4 md:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">
              <div>
                <img
                  src="/Person.jpg"
                  alt="A person using a tablet with a facial recognition interface"
                  className="rounded-2xl w-full h-auto object-cover"
                />
              </div>
              <div className="space-y-12">
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
                  A Quick Look at <br /> Saylani Moments
                </h2>
                <div className="relative space-y-9 pl-12">
                  <div
                    className="absolute left-[15px] top-1 bottom-1 w-0.5 bg-gray-800"
                    aria-hidden="true"
                  ></div>
                  {/* Steps Data */}
                  {[
                    {
                      title: "Take a Selfie",
                      desc: "Guests simply take a selfie using our app",
                    },
                    {
                      title: "AI Recognition",
                      desc: "Our AI instantly identifies their face in all event photos",
                    },
                    {
                      title: "Instant Gallery",
                      desc: "Receive a personalized gallery with all their photos",
                    },
                    {
                      title: "Share & Download",
                      desc: "Easy sharing to social media or download in high quality",
                    },
                  ].map((step, index) => (
                    <div key={index} className="relative flex items-start">
                      <div className="absolute -left-12 h-8 w-8 flex items-center justify-center rounded-full bg-[#27272a] ring-8 ring-[#0d0f11]">
                        <span className="font-medium text-sm text-gray-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-200">
                          <span className="border-b border-gray-700 pb-0.5">
                            {step.title}
                          </span>
                        </h3>
                        <p className="mt-2 text-gray-500">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          className="relative py-20 md:py-28 text-white bg-cover bg-center"
          style={{
            backgroundImage: "url('/bg.png')",
          }}
        >
          {/* FIXED: Added classes to make the overlay visible */}
          <div className="absolute"></div>
          <div className="relative container mx-auto w-full max-w-screen-xl px-4 md:px-6">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
                FAQs
              </h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  q: "How does Facial Recognition work?",
                  a: "Our AI-powered facial recognition technology analyzes facial features from a guest's selfie and matches them with faces in event photos. The system is 99.9% accurate and works in real-time.",
                },
                {
                  q: "Can multiple people use the same app for one event?",
                  a: "Yes, multiple guests can use the app for the same event. Each person just needs to upload their own selfie, and the system will find their photos individually.",
                },
                {
                  q: "Is the service available outside Pakistan?",
                  a: "Currently, Saylani Moments is focused on events in Pakistan, but we are working to expand internationally very soon.",
                },
              ].map((faq, index) => (
                <details key={index} className="group">
                  <summary className="flex items-center justify-between list-none cursor-pointer px-6 py-4 bg-gray-100 text-gray-900 rounded-full hover:bg-gray-200 transition-colors">
                    <h3 className="text-base font-semibold">{faq.q}</h3>
                    <ChevronRight className="h-5 w-5 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="mt-3 p-6 text-left bg-[#18181b] rounded-2xl">
                    <p className="text-gray-400">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#18181b] text-gray-300 border-t border-gray-800">
        <div className="container mx-auto w-full max-w-screen-xl px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
            <button
              onClick={() => handleScroll("home")}
              className="flex items-center gap-2"
            >
              <img
                src="/favicon.png"
                alt="Saylani Moments Logo"
                className="h-7 w-auto rounded"
              />
              <span className="text-lg font-semibold text-white">
                Saylani Moments
              </span>
            </button>
            <nav className="flex flex-wrap justify-center gap-6 md:gap-8">
              <button
                onClick={() => handleScroll("home")}
                className="text-sm font-medium hover:text-white transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => handleScroll("about")}
                className="text-sm font-medium hover:text-white transition-colors"
              >
                About
              </button>
              <button
                onClick={() => handleScroll("faq")}
                className="text-sm font-medium hover:text-white transition-colors"
              >
                FAQs
              </button>
            </nav>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Saylani Moments. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
