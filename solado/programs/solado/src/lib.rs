use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("8SsWF8CPzvbepfQqkrGfafgtEG1ZZWx6xRtJXW5vMCDH");

#[program]
pub mod solado {
    use super::*;

    pub fn create_campaign(
        ctx: Context<CreateCampaign>,
        title: String,
        description: String,
        goal_amount: u64,
        deadline: i64,
        metadata_uri: String,
    ) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let creator = &ctx.accounts.creator;
        let clock = Clock::get()?;

        // Validate inputs
        require!(goal_amount > 0, ErrorCode::InvalidGoalAmount);
        require!(deadline > clock.unix_timestamp, ErrorCode::InvalidDeadline);
        require!(title.len() <= 200, ErrorCode::TitleTooLong);
        require!(description.len() <= 1000, ErrorCode::DescriptionTooLong);
        require!(metadata_uri.len() <= 200, ErrorCode::UriTooLong);

        campaign.creator = creator.key();
        campaign.title = title;
        campaign.description = description;
        campaign.goal_amount = goal_amount;
        campaign.donated_amount = 0;
        campaign.deadline = deadline;
        campaign.metadata_uri = metadata_uri;
        campaign.created_at = clock.unix_timestamp;
        campaign.is_active = true;
        campaign.bump = ctx.bumps.campaign;

        emit!(CampaignCreated {
            campaign: campaign.key(),
            creator: creator.key(),
            goal_amount,
            deadline,
        });

        Ok(())
    }

pub fn donate(ctx: Context<Donate>, amount: u64, timestamp: i64) -> Result<()> {
    let campaign = &mut ctx.accounts.campaign;
    let donation_record = &mut ctx.accounts.donation_record;

    // Transfer SOL from donor to campaign
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.donor.key(),
        &campaign.key(),
        amount,
    );
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.donor.to_account_info(),
            campaign.to_account_info(),
        ],
    )?;

    // Update campaign
    campaign.donated_amount += amount;

    // Set donation record
    donation_record.donor = ctx.accounts.donor.key();
    donation_record.campaign = campaign.key();
    donation_record.amount = amount;
    donation_record.timestamp = timestamp;

    Ok(())
}    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let creator = &ctx.accounts.creator;
        let clock = Clock::get()?;

        // Validate withdrawal
        require!(campaign.creator == creator.key(), ErrorCode::Unauthorized);
        require!(campaign.is_active, ErrorCode::CampaignNotActive);
        require!(clock.unix_timestamp >= campaign.deadline, ErrorCode::CampaignNotExpired);
        require!(campaign.donated_amount >= campaign.goal_amount, ErrorCode::GoalNotReached);

        let campaign_balance = campaign.to_account_info().lamports();
        let rent_exempt_balance = Rent::get()?.minimum_balance(Campaign::SPACE);
        let withdrawable_amount = campaign_balance.checked_sub(rent_exempt_balance).ok_or(ErrorCode::InsufficientFunds)?;

        // Transfer funds to creator
        **campaign.to_account_info().try_borrow_mut_lamports()? = rent_exempt_balance;
        **creator.to_account_info().try_borrow_mut_lamports()? = creator
            .to_account_info()
            .lamports()
            .checked_add(withdrawable_amount)
            .ok_or(ErrorCode::Overflow)?;

        campaign.is_active = false;

        emit!(FundsWithdrawn {
            campaign: campaign.key(),
            creator: creator.key(),
            amount: withdrawable_amount,
        });

        Ok(())
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        let campaign = &mut ctx.accounts.campaign;
        let donor = &ctx.accounts.donor;
        let donation_record = &ctx.accounts.donation_record;
        let clock = Clock::get()?;

        // Validate refund
        require!(donation_record.donor == donor.key(), ErrorCode::Unauthorized);
        require!(donation_record.campaign == campaign.key(), ErrorCode::InvalidCampaign);
        require!(clock.unix_timestamp >= campaign.deadline, ErrorCode::CampaignNotExpired);
        require!(campaign.donated_amount < campaign.goal_amount, ErrorCode::GoalReached);

        let refund_amount = donation_record.amount;

        // Transfer refund to donor
        **campaign.to_account_info().try_borrow_mut_lamports()? = campaign
            .to_account_info()
            .lamports()
            .checked_sub(refund_amount)
            .ok_or(ErrorCode::InsufficientFunds)?;
        
        **donor.to_account_info().try_borrow_mut_lamports()? = donor
            .to_account_info()
            .lamports()
            .checked_add(refund_amount)
            .ok_or(ErrorCode::Overflow)?;

        // Update campaign donated amount
        campaign.donated_amount = campaign.donated_amount.checked_sub(refund_amount).ok_or(ErrorCode::Underflow)?;

        emit!(RefundIssued {
            campaign: campaign.key(),
            donor: donor.key(),
            amount: refund_amount,
        });

        Ok(())
    }

    pub fn delete_campaign(ctx: Context<DeleteCampaign>) -> Result<()> {
        let campaign = &ctx.accounts.campaign;
        let creator = &ctx.accounts.creator;

        // Validate deletion
        require!(campaign.creator == creator.key(), ErrorCode::Unauthorized);
        require!(campaign.donated_amount == 0, ErrorCode::CampaignHasDonations);

        emit!(CampaignDeleted {
            campaign: campaign.key(),
            creator: creator.key(),
        });

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateCampaign<'info> {
    #[account(
        init,
        payer = creator,
        space = Campaign::SPACE,
        seeds = [b"campaign", creator.key().as_ref(), title.as_bytes()],
        bump
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(amount: u64, timestamp: i64)]
pub struct Donate<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub donor: Signer<'info>,
    #[account(
        init,
        payer = donor,
        space = DonationRecord::SPACE,
        seeds = [b"donation", campaign.key().as_ref(), donor.key().as_ref(), &timestamp.to_le_bytes()],
        bump
    )]
    pub donation_record: Account<'info, DonationRecord>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut, has_one = creator)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub creator: Signer<'info>,
}

#[derive(Accounts)]
pub struct Refund<'info> {
    #[account(mut)]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub donor: Signer<'info>,
    #[account(
        mut,
        seeds = [b"donation", campaign.key().as_ref(), donor.key().as_ref()],
        bump = donation_record.bump,
        close = donor
    )]
    pub donation_record: Account<'info, DonationRecord>,
}

#[derive(Accounts)]
pub struct DeleteCampaign<'info> {
    #[account(
        mut,
        has_one = creator,
        close = creator
    )]
    pub campaign: Account<'info, Campaign>,
    #[account(mut)]
    pub creator: Signer<'info>,
}

#[account]
pub struct Campaign {
    pub creator: Pubkey,           // 32
    pub title: String,             // 4 + 200
    pub description: String,       // 4 + 1000
    pub goal_amount: u64,          // 8
    pub donated_amount: u64,       // 8
    pub deadline: i64,             // 8
    pub metadata_uri: String,      // 4 + 200
    pub created_at: i64,           // 8
    pub is_active: bool,           // 1
    pub bump: u8,                  // 1
}

impl Campaign {
    pub const SPACE: usize = 8 + 32 + 4 + 200 + 4 + 1000 + 8 + 8 + 8 + 4 + 200 + 8 + 1 + 1;
}

#[account]
pub struct DonationRecord {
    pub donor: Pubkey,        // 32
    pub campaign: Pubkey,     // 32
    pub amount: u64,          // 8
    pub timestamp: i64,       // 8
    pub bump: u8,             // 1
}

impl DonationRecord {
    pub const SPACE: usize = 8 + 32 + 32 + 8 + 8 + 1;
}

#[event]
pub struct CampaignCreated {
    pub campaign: Pubkey,
    pub creator: Pubkey,
    pub goal_amount: u64,
    pub deadline: i64,
}

#[event]
pub struct DonationMade {
    pub campaign: Pubkey,
    pub donor: Pubkey,
    pub amount: u64,
    pub total_donated: u64,
}

#[event]
pub struct FundsWithdrawn {
    pub campaign: Pubkey,
    pub creator: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RefundIssued {
    pub campaign: Pubkey,
    pub donor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct CampaignDeleted {
    pub campaign: Pubkey,
    pub creator: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid goal amount")]
    InvalidGoalAmount,
    #[msg("Invalid deadline")]
    InvalidDeadline,
    #[msg("Title too long")]
    TitleTooLong,
    #[msg("Description too long")]
    DescriptionTooLong,
    #[msg("URI too long")]
    UriTooLong,
    #[msg("Invalid donation amount")]
    InvalidDonationAmount,
    #[msg("Campaign not active")]
    CampaignNotActive,
    #[msg("Campaign expired")]
    CampaignExpired,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Campaign not expired")]
    CampaignNotExpired,
    #[msg("Goal not reached")]
    GoalNotReached,
    #[msg("Goal already reached")]
    GoalReached,
    #[msg("Invalid campaign")]
    InvalidCampaign,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Arithmetic underflow")]
    Underflow,
    #[msg("Campaign has donations and cannot be deleted")]
    CampaignHasDonations,
}
