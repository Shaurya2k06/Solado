import { useState, useEffect, useCallback } from 'react';
import { useProgramContext } from '../contexts/ProgramContext';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface Campaign {
  publicKey: PublicKey;
  account: {
    creator: PublicKey;
    title: string;
    description: string;
    goalAmount: BN;
    donatedAmount: BN;
    deadline: BN;
    metadataUri: string;
    createdAt: BN;
    isActive: boolean;
  };
}

export const useCampaigns = () => {
  const { program } = useProgramContext();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    if (!program) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Use generic account access
      const campaignAccounts = await (program.account as any).campaign.all();
      setCampaigns(campaignAccounts as Campaign[]);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const refreshCampaigns = () => {
    fetchCampaigns();
  };

  return {
    campaigns,
    loading,
    error,
    refreshCampaigns,
  };
};
