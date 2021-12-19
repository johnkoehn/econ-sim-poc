use anchor_lang::{prelude::*, solana_program::instruction};
use borsh::{BorshDeserialize, BorshSerialize};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, accessor::authority},
};
use spl_token;

use crate::{tiles::{TileAccount, TileTypes}, game::{GameAccount, cycles::calculate_capacity}};

fn calculate_worker_capacity(level: u8) -> u64 {
    if level == 1 {
        return 1
    }

    u64::pow(2, (level - 1) as u32)
}

// here we are telling the rust complier, good day to you sir
// we are returning a Skill reference from worker_account not tile_type
fn get_worker_skill<'a>(tile_type: &TileTypes, skills: &'a &Skills) -> (&'a Skill, TaskTypes) {
    match tile_type {
        TileTypes::Food => (&skills.farm, TaskTypes::Farm),
        TileTypes::Iron => (&skills.mine, TaskTypes::Mine),
        TileTypes::Coal => (&skills.mine, TaskTypes::Mine),
        TileTypes::Wood => (&skills.woodcutting, TaskTypes::Woodcutting),
        TileTypes::RareMetals => (&skills.mine, TaskTypes::Mine),
        TileTypes::Herbs => (&skills.gather, TaskTypes::Gather)
    }
}

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
            level: 1,
            experience: 0
        },
        mine: Skill {
            level: 1,
            experience: 0
        },
        woodcutting: Skill {
            level: 1,
            experience: 0
        },
        gather: Skill {
            level: 1,
            experience: 0
        },
        transport: Skill {
            level: 1,
            experience: 0
        },
        forge: Skill {
            level: 1,
            experience: 0
        },
        alchamey: Skill {
            level: 1,
            experience: 0
        },
        craft: Skill {
            level: 1,
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

pub fn assign_task(ctx: Context<AssignTask>) -> ProgramResult {
    let worker_account = &mut ctx.accounts.worker_account;
    let worker_token_account = &ctx.accounts.worker_token_account;
    let authority = &ctx.accounts.authority;

    if worker_account.mint_key != worker_token_account.mint.key() {
        return Err(ErrorCode::IncorrectTokenAccount.into())
    }

    if authority.key() != worker_token_account.owner {
        return Err(ErrorCode::NotTokenAccountOwner.into())
    }

    if worker_token_account.amount != 1 {
        return Err(ErrorCode::NotWorkerOwner.into())
    }

    if worker_account.task.is_some() {
        return Err(ErrorCode::WorkerHasTask.into())
    }

    // does the tile have the capacity ?
    let tile_account = &mut ctx.accounts.tile_account;
    let game_account = &ctx.accounts.game_account;

    let (current_capacity, new_time) = calculate_capacity(tile_account, game_account);

    if current_capacity == 0 {
        return Err(ErrorCode::NoCapacity.into())
    }
    // so we have the capacity
    // we have time last updated
    let skills = &worker_account.skills;
    let (skill, task_type) = get_worker_skill(&tile_account.tile_type, &skills);
    let worker_capacity = calculate_worker_capacity(skill.level);

    let capacity_taken = if (current_capacity as i64 - worker_capacity as i64) < 0 { current_capacity } else { worker_capacity };

    worker_account.task = Some(Task {
        reward: capacity_taken,
        task_type: task_type,
        task_complete_time: new_time + (game_account.cycle_time as i64 * game_account.cycles_per_period as i64),
        tile_key: tile_account.key()
    });

    // update tile capacity and cycle time
    tile_account.capacity = current_capacity - capacity_taken;
    tile_account.last_cycle_time = new_time;

    Ok(())
}

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

    pub game_account: Account<'info, GameAccount>,

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

    #[msg("Tile has no capacity, please wait until resource are available")]
    NoCapacity
}