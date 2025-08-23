use anchor_lang::prelude::*;

declare_id!("8SsWF8CPzvbepfQqkrGfafgtEG1ZZWx6xRtJXW5vMCDH");

#[program]
pub mod solado {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
