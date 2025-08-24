import React, { useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { AnimatedCard } from './ui/animated-card';
import { Button } from './ui/button';
import { NumberTicker } from './magicui/number-ticker';
import { BoxReveal } from './magicui/box-reveal';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { 
  BoltIcon, 
  CurrencyDollarIcon, 
  ShieldCheckIcon,
  RocketLaunchIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const FeatureCard = ({ icon: Icon, title, description }: {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
}) => (
  <AnimatedCard className="group relative overflow-hidden">
    <div className="p-6">
      <div className="flex items-center space-x-4">
        <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 hover-scale">
          <Icon className="h-6 w-6 text-primary group-hover:animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-semibold group-hover:text-primary transition-colors duration-300">{title}</h3>
        </div>
      </div>
    </div>
    <div className="px-6 pb-6">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  </AnimatedCard>
);

const StatCard = ({ value, numValue, label, icon: Icon }: {
  value: string;
  numValue: number;
  label: string;
  icon: React.ComponentType<any>;
}) => {
  const formatValue = () => {
    if (value.includes('$') && value.includes('M')) {
      return (
        <>
          $<NumberTicker value={numValue / 1000000} className="tabular-nums text-inherit" />M+
        </>
      );
    }
    if (value.includes('+')) {
      return (
        <>
          <NumberTicker value={numValue} className="tabular-nums text-inherit" />+
        </>
      );
    }
    return <NumberTicker value={numValue} className="tabular-nums text-inherit" />;
  };

  return (
    <div className="text-center space-y-3 p-6 group hover-scale">
      <div className="flex justify-center">
        <div className="p-3 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-all duration-300 animate-float">
          <Icon className="h-6 w-6 text-accent group-hover:animate-pulse" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground group-hover:text-accent transition-colors duration-300">
          {formatValue()}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );
};

export const LandingPage = () => {
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true,
      offset: 100,
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center space-x-3 mb-8 animate-fade-in-down">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg hover-glow ">
              <img 
                src="/logo.png" 
                alt="Solado Logo" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to rocket icon if logo.png doesn't exist
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div 
                className="w-12 h-12 rounded-xl bg-primary items-center justify-center shadow-lg"
                style={{ display: 'none' }}
              >
                <RocketLaunchIcon className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold text-foreground">Solado</h1>
              <p className="text-sm text-muted-foreground"></p>
            </div>
          </div>

          {/* Main Headline */}
          <div className="space-y-6 mb-12 animate-fade-in-up animate-delay-200">

            
            <div className="flex justify-center">
              <BoxReveal boxColor={"#2563eb"} duration={0.3} width="fit-content">
                <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
                  <span className="gradient-text-animated">Fund Ideas.</span>
                </h2>
              </BoxReveal>
            </div>
            
            <div className="flex justify-center">
              <BoxReveal boxColor={"#2563eb"} duration={0.3} width="fit-content">
                <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
                  <span className="text-foreground">Change Lives.</span>
                </h2>
              </BoxReveal>
            </div>
            
            <div className="flex justify-center">
              <BoxReveal boxColor={"#2563eb"} duration={0.3} width="fit-content">
                <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed text-center">
                  The world's first decentralized crowdfunding platform built on Solana.
                  <br />
                  Lightning-fast transactions, minimal fees, maximum transparency.
                </p>
              </BoxReveal>
            </div>
            
            <div className="flex justify-center">
              <BoxReveal boxColor={"#2563eb"} duration={0.3} width="fit-content">
                <p className="text-muted-foreground max-w-2xl text-center">
                  Join thousands creating impact through blockchain-powered fundraising
                </p>
              </BoxReveal>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mb-16 animate-scale-in animate-delay-500">
            <WalletMultiButton className="hover-glow hover-scale !bg-primary hover:!bg-primary/90 !text-primary-foreground !font-semibold !px-8 !py-4 !rounded-xl !transition-all !duration-300 !shadow-lg animate-glow !text-lg" />
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16 stagger-animation">
            <FeatureCard
              icon={BoltIcon}
              title="Lightning Fast"
              description="Sub-second transactions powered by Solana's high-performance blockchain"
            />
            <FeatureCard
              icon={CurrencyDollarIcon}
              title="Near-Zero Fees"
              description="Keep more of your funds with Solana's ultra-low transaction costs"
            />
            <FeatureCard
              icon={ShieldCheckIcon}
              title="Fully Transparent"
              description="Every donation tracked on-chain. No hidden fees, complete visibility"
            />
          </div>

          {/* Stats Section */}
          <div className="mb-20" data-aos="fade-up" data-aos-delay="200">
            <AnimatedCard className="bg-card/30">
              <div className="p-0">
                <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                  <StatCard
                    value="$2.4M+"
                    numValue={2400000}
                    label="Total Raised"
                    icon={ChartBarIcon}
                  />
                  <StatCard
                    value="1,200+"
                    numValue={1200}
                    label="Active Campaigns"
                    icon={RocketLaunchIcon}
                  />
                  <StatCard
                    value="8,500+"
                    numValue={8500}
                    label="Community Members"
                    icon={UsersIcon}
                  />
                </div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </section>

      {/* How It Works Timeline */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-card/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12" data-aos="fade-up">
            <div className="flex justify-center mb-4">
              <BoxReveal boxColor={"#2563eb"} duration={0.3} width="fit-content">
                <h3 className="text-3xl font-bold text-foreground">
                  How to Create Your Fundraiser
                </h3>
              </BoxReveal>
            </div>
            <div className="flex justify-center">
              <BoxReveal boxColor={"#2563eb"} duration={0.3} width="fit-content">
                <p className="text-lg text-muted-foreground text-center">
                  Get started in just a few simple steps
                </p>
              </BoxReveal>
            </div>
          </div>

          <div className="relative">
            {/* Timeline Line - Hidden on mobile */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-primary via-accent to-primary/20 rounded-full hidden md:block"></div>
            
            <div className="space-y-6 md:space-y-8">
              {/* Step 1 */}
              <div className="flex items-center justify-center" data-aos="fade-right" data-aos-delay="100">
                <AnimatedCard className="max-w-lg w-full relative">
                  <div className="absolute top-3 left-3 md:-left-5 md:top-1/2 md:transform md:-translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg z-10">
                    <span className="text-primary-foreground font-bold text-sm">1</span>
                  </div>
                  <div className="p-6 pl-12 pt-12 md:pt-6 md:pl-12">
                    <h4 className="text-xl font-semibold text-foreground mb-3">Connect Your Wallet</h4>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      Connect your Solana wallet to get started. We support Phantom, Solflare, and other popular wallets.
                    </p>
                  </div>
                </AnimatedCard>
              </div>

              {/* Step 2 */}
              <div className="flex items-center justify-center" data-aos="fade-left" data-aos-delay="200">
                <AnimatedCard className="max-w-lg w-full relative">
                  <div className="absolute top-3 right-3 md:-right-5 md:top-1/2 md:transform md:-translate-y-1/2 w-10 h-10 bg-accent rounded-full flex items-center justify-center shadow-lg z-10">
                    <span className="text-accent-foreground font-bold text-sm">2</span>
                  </div>
                  <div className="p-6 pr-12 pt-12 md:pt-6 md:pr-12 text-left md:text-right">
                    <h4 className="text-xl font-semibold text-foreground mb-3">Create Your Campaign</h4>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      Fill out your campaign details, set your funding goal, and upload compelling content to attract backers.
                    </p>
                  </div>
                </AnimatedCard>
              </div>

              {/* Step 3 */}
              <div className="flex items-center justify-center" data-aos="fade-right" data-aos-delay="300">
                <AnimatedCard className="max-w-lg w-full relative">
                  <div className="absolute top-3 left-3 md:-left-5 md:top-1/2 md:transform md:-translate-y-1/2 w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg z-10">
                    <span className="text-primary-foreground font-bold text-sm">3</span>
                  </div>
                  <div className="p-6 pl-12 pt-12 md:pt-6 md:pl-12">
                    <h4 className="text-xl font-semibold text-foreground mb-3">Share & Promote</h4>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      Share your campaign with your network and watch as supporters contribute to your cause with instant SOL transactions.
                    </p>
                  </div>
                </AnimatedCard>
              </div>

              {/* Step 4 */}
              <div className="flex items-center justify-center" data-aos="fade-left" data-aos-delay="400">
                <AnimatedCard className="max-w-lg w-full relative">
                  <div className="absolute top-3 right-3 md:-right-5 md:top-1/2 md:transform md:-translate-y-1/2 w-10 h-10 bg-accent rounded-full flex items-center justify-center shadow-lg z-10">
                    <span className="text-accent-foreground font-bold text-sm">4</span>
                  </div>
                  <div className="p-6 pr-12 pt-12 md:pt-6 md:pr-12 text-left md:text-right">
                    <h4 className="text-xl font-semibold text-foreground mb-3">Receive Funding</h4>
                    <p className="text-muted-foreground text-base leading-relaxed">
                      Once your campaign reaches its goal, withdraw funds instantly to your wallet. All transactions are transparent and secure.
                    </p>
                  </div>
                </AnimatedCard>
              </div>
            </div>
          </div>

          {/* CTA in Timeline */}
          <div className="text-center mt-12" data-aos="fade-up" data-aos-delay="500">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 text-base font-semibold rounded-xl shadow-lg">
              Start Your Campaign Now
            </Button>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/20">
        <div className="max-w-2xl mx-auto text-center">
          <AnimatedCard>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Ready to get started?
              </h2>
              <p className="text-muted-foreground mb-6">
                Connect your Solana wallet to create campaigns or support causes you care about
              </p>
            </div>
            <div className="px-6 pb-6">
              <WalletMultiButton className="hover-lift !bg-primary hover:!bg-primary/90 !text-primary-foreground !font-semibold !px-8 !py-4 !rounded-xl !transition-all !duration-300" />
            </div>
          </AnimatedCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <RocketLaunchIcon className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                © 2025 Solado. Built on Solana blockchain.
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Support
              </a>
              <a href="https://github.com/Shaurya2k06/Solado" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
