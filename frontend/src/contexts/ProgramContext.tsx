import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import type { Idl } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import IDL from '../idl/solado.json';

const PROGRAM_ID = new PublicKey('8SsWF8CPzvbepfQqkrGfafgtEG1ZZWx6xRtJXW5vMCDH');

interface ProgramContextType {
  program: Program<Idl> | null;
  programId: PublicKey;
}

const ProgramContext = createContext<ProgramContextType>({
  program: null,
  programId: PROGRAM_ID,
});

export const useProgramContext = () => useContext(ProgramContext);

interface ProgramProviderProps {
  children: ReactNode;
}

export const ProgramProvider = ({ children }: ProgramProviderProps) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (!wallet) return null;

    const provider = new AnchorProvider(
      connection,
      wallet,
      { commitment: 'confirmed' }
    );

    return new Program(IDL as Idl, provider);
  }, [connection, wallet]);

  const value = {
    program,
    programId: PROGRAM_ID,
  };

  return (
    <ProgramContext.Provider value={value}>
      {children}
    </ProgramContext.Provider>
  );
};
