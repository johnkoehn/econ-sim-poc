use anchor_lang::{prelude::*, solana_program::instruction};
use borsh::{BorshDeserialize, BorshSerialize};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, accessor::authority},
};
use spl_token;

use crate::tiles::TileAccount;

pub fn mint_worker(ctx: Context<MintWorker>, worker_mint_bump: u8, worker_mint_seed: String) -> ProgramResult {
    let worker = &mut ctx.accounts.worker_account;
    let worker_mint = &mut ctx.accounts.worker_mint;

    worker.owner = ctx.accounts.receiver.key();
    worker.mint_key = worker_mint.key();
    worker.q = 0;
    worker.r = 0;
    worker.task = None;
    worker.skills = Skills {
        farm: Skill {
            level: 0,
            experience: 0
        },
        mine: Skill {
            level: 0,
            experience: 0
        },
        woodcutting: Skill {
            level: 0,
            experience: 0
        },
        gather: Skill {
            level: 0,
            experience: 0
        },
        transport: Skill {
            level: 0,
            experience: 0
        },
        forge: Skill {
            level: 0,
            experience: 0
        },
        alchamey: Skill {
            level: 0,
            experience: 0
        },
        craft: Skill {
            level: 0,
            experience: 0
        }
    };

    // mint worker
    anchor_spl::token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::MintTo {
                mint: worker_mint.to_account_info(),
                to: ctx.accounts.worker_token_account.to_account_info(),
                authority: worker_mint.to_account_info(),
            },
            &[&[&worker_mint_seed.as_bytes(), &[worker_mint_bump]]],
        ),
        1,
    )?;
    anchor_spl::token::set_authority(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::SetAuthority {
                current_authority: worker_mint.to_account_info(),
                account_or_mint: worker_mint.to_account_info()
            },
            &[&[&worker_mint_seed.as_bytes(), &[worker_mint_bump]]]
        ),
        spl_token::instruction::AuthorityType::MintTokens,
        None
    )?;

    Ok(())
}

// TODO: if owner changes, update owner

pub fn assign_task(ctx: Context<AssignTask>) -> ProgramResult {
    let worker_account = &mut ctx.accounts.worker_account;
    let worker_token_account = &mut ctx.accounts.worker_token_account;
    let authority = &mut ctx.accounts.authority;

    if worker_account.mint_key != worker_token_account.mint.key() {
        return Err(ErrorCode::IncorrectTokenAccount.into())
    }

    if authority.key() != worker_token_account.key() {
        return Err(ErrorCode::NotTokenAccountOwner.into())
    }

    if worker_token_account.amount != 1 {
        return Err(ErrorCode::NotWorkerOwner.into())
    }

    if worker_account.task.is_some() {
        return Err(ErrorCode::WorkerHasTask.into())
    }

    // does the tile have the capacity ?

    // update tile capacity
    // update worker with task
    // set amount

    Ok(())
}

// #[account(mut)]
//     pub worker_account: Account<'info, WorkerAccount>,
//     pub worker_token_account: Account<'info, TokenAccount>,

//     #[account(mut)]
//     pub tile_account: Account<'info, TileAccount>,

//     #[account(mut)]
//     pub authority: Signer<'info>,

//     pub system_program: Program<'info, System>,
//     pub associated_token_program: Program<'info, AssociatedToken>,

//     pub rent: Sysvar<'info, Rent>

#[derive(Accounts)]
#[instruction(worker_mint_bump: u8, worker_mint_seed: String)]
pub struct MintWorker<'info> {
    #[account(init, payer=authority, space = 8 + 32 + 32 + 4 + 4 + 72 + 50)]
    pub worker_account: Account<'info, WorkerAccount>,

    #[account(
        init,
        payer = authority,
        seeds = [worker_mint_seed.as_bytes()],
        bump = worker_mint_bump,
        mint::decimals = 0,
        mint::authority = worker_mint
    )]
    pub worker_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = worker_mint,
        associated_token::authority = receiver,
    )]
    pub worker_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub receiver: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct AssignTask<'info> {
    #[account(mut)]
    pub worker_account: Account<'info, WorkerAccount>,
    pub worker_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub tile_account: Account<'info, TileAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>
}

// 32 + 32 + 4 + 4 + 72 + 50
#[account]
pub struct WorkerAccount {
    // makes look up quicker but a user must always present actual proof throught NFT
    pub owner: Pubkey,
    pub mint_key: Pubkey,

    // for now we wil default these to 0,0
    pub q: i32,
    pub r: i32,

    pub skills: Skills,

    pub task: Option<Task>
}

// 72
#[derive(Debug, Clone, PartialEq, AnchorDeserialize, AnchorSerialize)]
pub struct Skills {
    farm: Skill,
    mine: Skill,
    woodcutting: Skill,
    gather: Skill,
    transport: Skill,
    // city types (forge, market, alchamey, factory)
    forge: Skill,
    alchamey: Skill,
    craft: Skill
}

// 1 + 8 = 9
#[derive(Debug, Clone, PartialEq, AnchorDeserialize, AnchorSerialize)]
pub struct Skill {
    pub level: u8,
    pub experience: u64
}

// 32 + 1 + 8 + 8 + 1 (option) = 50
#[derive(Debug, Clone, PartialEq, AnchorDeserialize, AnchorSerialize)]
pub struct Task {
    pub tile_key: Pubkey,
    pub task_type: TaskTypes,
    pub task_complete_time: i64,
    pub reward: u64
}

#[derive(Debug, Clone, PartialEq, BorshDeserialize, AnchorSerialize)]
pub enum TaskTypes {
    Farm = 0,
    Mine = 1,
    Woodcutting = 2,
    Gather = 3,
    Transport = 4,
    Forge = 5,
    Alchamey = 6,
    Craft = 7
}

#[error]
pub enum ErrorCode {
    #[msg("You do not own the worker")]
    NotWorkerOwner,

    #[msg("Incorrect token account")]
    IncorrectTokenAccount,

    #[msg("You are not the token account owner")]
    NotTokenAccountOwner,

    #[msg("Worker already has a task")]
    WorkerHasTask,

    #[msg("Tile is at capacity")]
    TileAtCapacity
}