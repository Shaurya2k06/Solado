import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useProgramContext } from '../contexts/ProgramContext';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { Button } from '../components/ui/button';
import { AnimatedCard } from './ui/animated-card';
import { 
  CalendarIcon, 
  DocumentTextIcon, 
  LinkIcon, 
  RocketLaunchIcon, 
  CheckCircleIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface CreateCampaignProps {
  onCampaignCreated: () => void;
}

export const CreateCampaign = ({ onCampaignCreated }: CreateCampaignProps) => {
  const { connected } = useWallet();
  const { program } = useProgramContext();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    deadline: '',
    metadataUri: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !connected) return;

    setLoading(true);
    try {
      const goalAmountLamports = new BN(parseFloat(formData.goalAmount) * 1e9); // Convert SOL to lamports
      const deadlineTimestamp = new BN(Math.floor(new Date(formData.deadline).getTime() / 1000));

      // Derive campaign PDA
      const [campaignPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('campaign'), (program.provider as any).publicKey!.toBuffer(), Buffer.from(formData.title)],
        program.programId
      );

      const tx = await (program.methods as any)
        .createCampaign(
          formData.title,
          formData.description,
          goalAmountLamports,
          deadlineTimestamp,
          formData.metadataUri
        )
        .accounts({
          campaign: campaignPda,
          creator: (program.provider as any).publicKey,
          systemProgram: new PublicKey('11111111111111111111111111111112'),
        })
        .rpc();

      console.log('Campaign created with signature:', tx);
      
      setSuccess(true);
      setTimeout(() => {
        // Reset form
        setFormData({
          title: '',
          description: '',
          goalAmount: '',
          deadline: '',
          metadataUri: '',
        });
        setSuccess(false);
        onCampaignCreated();
      }, 3000);
      
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto">
        <AnimatedCard className="text-center">
          <div className="py-16 px-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <RocketLaunchIcon className="h-10 w-10 text-primary-foreground" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold">Create Your Campaign</h1>
                  <p className="text-lg max-w-md mx-auto leading-relaxed text-muted-foreground">
                    Connect your Solana wallet to launch your fundraising campaign and start raising funds from supporters worldwide.
                  </p>
                </div>
              </div>
              
              <div className="space-y-6">
                <WalletMultiButton className="hover-lift !bg-primary hover:!bg-primary/90 !text-primary-foreground !font-semibold !px-8 !py-4 !rounded-xl !transition-all !duration-300 !shadow-lg" />
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-3 text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto">
                      <ChartBarIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">Set Goals</div>
                      <p className="text-sm text-muted-foreground">Define funding targets</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-center">
                    <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mx-auto">
                      <CalendarIcon className="h-6 w-6 text-accent" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">Set Deadlines</div>
                      <p className="text-sm text-muted-foreground">Choose end dates</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-center">
                    <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center mx-auto">
                      <RocketLaunchIcon className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-foreground">Launch</div>
                      <p className="text-sm text-muted-foreground">Go live instantly</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <AnimatedCard className="text-center">
          <div className="py-16 px-8">
            <div className="space-y-6">
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <CheckCircleIcon className="h-10 w-10 text-primary-foreground" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Campaign Created Successfully</h1>
                <p className="text-lg text-muted-foreground">
                  Your campaign is now live on the Solana blockchain. Redirecting to campaigns...
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatedCard className="overflow-hidden">
        {/* Header */}
        <div className="bg-muted/20 border-b border-border p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <RocketLaunchIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Launch Your Campaign</h2>
              <p className="text-muted-foreground">Fill in the details to create your fundraising campaign</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-3">
              <label htmlFor="title" className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <DocumentTextIcon className="h-4 w-4 text-primary" />
                <span>Campaign Title *</span>
              </label>
              <input
                type="text"
                id="title"
                required
                maxLength={200}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                placeholder="Enter a compelling campaign title..."
              />
              <div className="flex justify-between items-center text-xs">
                <p className="text-muted-foreground">Make it catchy and descriptive</p>
                <p className="text-muted-foreground">{formData.title.length}/200</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label htmlFor="description" className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <DocumentTextIcon className="h-4 w-4 text-accent" />
                <span>Description *</span>
              </label>
              <textarea
                id="description"
                required
                maxLength={1000}
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all resize-none"
                placeholder="Tell your story... What are you raising funds for? Why should people support you?"
              />
              <div className="flex justify-between items-center text-xs">
                <p className="text-muted-foreground">Explain your project in detail</p>
                <p className="text-muted-foreground">{formData.description.length}/1000</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Goal Amount */}
              <div className="space-y-3">
                <label htmlFor="goalAmount" className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <CurrencyDollarIcon className="h-4 w-4 text-destructive" />
                  <span>Goal Amount (SOL) *</span>
                </label>
                <input
                  type="number"
                  id="goalAmount"
                  required
                  min="0.001"
                  step="0.001"
                  value={formData.goalAmount}
                  onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 focus:border-destructive/50 transition-all"
                  placeholder="0.0"
                />
                <p className="text-xs text-muted-foreground">Minimum: 0.001 SOL</p>
              </div>

              {/* Deadline */}
              <div className="space-y-3">
                <label htmlFor="deadline" className="flex items-center space-x-2 text-sm font-medium text-foreground">
                  <CalendarIcon className="h-4 w-4 text-chart-3" />
                  <span>Deadline *</span>
                </label>
                <input
                  type="datetime-local"
                  id="deadline"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-chart-3/50 focus:border-chart-3/50 transition-all"
                />
                <p className="text-xs text-muted-foreground">Choose when fundraising ends</p>
              </div>
            </div>

            {/* Metadata URI */}
            <div className="space-y-3">
              <label htmlFor="metadataUri" className="flex items-center space-x-2 text-sm font-medium text-foreground">
                <LinkIcon className="h-4 w-4 text-chart-4" />
                <span>Metadata URI (optional)</span>
              </label>
              <input
                type="url"
                id="metadataUri"
                maxLength={200}
                value={formData.metadataUri}
                onChange={(e) => setFormData({ ...formData, metadataUri: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-chart-4/50 focus:border-chart-4/50 transition-all"
                placeholder="https://example.com/campaign-images"
              />
              <p className="text-xs text-muted-foreground">Link to additional images or documentation</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-xl transition-all duration-300 hover-lift disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Campaign...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <RocketLaunchIcon className="h-5 w-5" />
                  <span>Launch Campaign</span>
                </div>
              )}
            </Button>
          </form>
        </div>
      </AnimatedCard>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <AnimatedCard className="bg-card/30">
          <div className="p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ChartBarIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold">How it works</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Your campaign will be deployed to the Solana blockchain. Supporters can donate SOL directly to your campaign address.
                </p>
              </div>
            </div>
          </div>
        </AnimatedCard>

        <AnimatedCard className="bg-card/30">
          <div className="p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <CheckCircleIcon className="h-5 w-5 text-accent" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold">Zero Platform Fees</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  We don&apos;t charge any platform fees. You only pay minimal Solana network fees (typically &lt; $0.01).
                </p>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
};
