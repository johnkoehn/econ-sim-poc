use anchor_lang::{prelude::*, solana_program::{instruction, clock}};
use borsh::{BorshDeserialize, BorshSerialize};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use spl_token;

use crate::{tiles::{TileAccount, TileTypes, TileTokenAccount, tile_token_account_checks, TileErrorCodes}, game::{GameAccount, cycles::calculate_capacity}};

pub fn calculate_worker_capacity(level: u8) -> u64 {
    if level == 1 {
        return 1
    }

    u64::pow(2, (level - 1) as u32)
}

pub fn calculate_skill_level(current_level: u8, experience: u64) -> u8 {
    if current_level == std::u8::MAX {
        return current_level
    }

    let exp_to_next_level: u64 = u64::pow(3, (current_level + 1) as u32);
    if experience >=  exp_to_next_level {
        return current_level + 1
    }

    return current_level
}

pub fn worker_ownership_checks(worker_account: &Account<WorkerAccount>, worker_token_account: &Account<TokenAccount>, authority: &Signer) -> ProgramResult {
    if worker_account.mint_key != worker_token_account.mint.key() {
        return Err(WorkerErrorCodes::IncorrectTokenAccount.into())
    }

    if authority.key() != worker_token_account.owner {
        return Err(WorkerErrorCodes::NotTokenAccountOwner.into())
    }

    if worker_token_account.amount != 1 {
        return Err(WorkerErrorCodes::NotWorkerOwner.into())
    }

    Ok(())
}

// here we are telling the rust complier, good day to you sir
// we are returning a Skill reference from worker_account not tile_type
pub fn get_worker_skill<'a>(tile_type: &TileTypes, skills: &'a mut Skills) -> (&'a mut Skill, TaskTypes) {
    match tile_type {
        TileTypes::Food => (&mut skills.farm, TaskTypes::Farm),
        TileTypes::Iron => (&mut skills.mine, TaskTypes::Mine),
        TileTypes::Coal => (&mut skills.mine, TaskTypes::Mine),
        TileTypes::Wood => (&mut skills.woodcutting, TaskTypes::Woodcutting),
        TileTypes::RareMetals => (&mut skills.mine, TaskTypes::Mine),
        TileTypes::Herbs => (&mut skills.gather, TaskTypes::Gather),
        TileTypes::City => (&mut skills.transport, TaskTypes::Transport)
    }
}

pub fn mint_worker(ctx: Context<MintWorker>, worker_mint_bump: u8, worker_mint_seed: String, worker_name: [u8; 10]) -> ProgramResult {
    let worker = &mut ctx.accounts.worker_account;
    let worker_mint = &mut ctx.accounts.worker_mint;

    worker.worker_name = worker_name;
    worker.game_account = ctx.accounts.game_account.key();
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
        alchemy: Skill {
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

    worker_ownership_checks(worker_account, worker_token_account, authority)?;

    if worker_account.task.is_some() {
        return Err(WorkerErrorCodes::WorkerHasTask.into())
    }

    let tile_account = &mut ctx.accounts.tile_account;
    let game_account = &ctx.accounts.game_account;

    if worker_account.game_account != game_account.key() {
        return Err(WorkerErrorCodes::InvalidGameAccountForWorker.into());
    }

    if tile_account.game_account != game_account.key() {
        return Err(TileErrorCodes::InvalidGameAccountForTile.into());
    }

    if tile_account.tile_type == TileTypes::City {
        return Err(WorkerErrorCodes::InvalidTileType.into())
    }

    let (current_capacity, new_time) = calculate_capacity(tile_account, game_account);

    if current_capacity == 0 {
        return Err(WorkerErrorCodes::NoCapacity.into())
    }

    let skills = &mut worker_account.skills;
    let (skill, task_type) = get_worker_skill(&tile_account.tile_type, skills);
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

pub fn complete_task(ctx: Context<CompleteTask>) -> ProgramResult {
    fn get_task_info(worker_account: &mut WorkerAccount) -> Task {
        worker_account.task.as_ref().unwrap().clone()
    }

    let worker_account = &mut ctx.accounts.worker_account;
    let worker_token_account = &ctx.accounts.worker_token_account;
    let authority = &ctx.accounts.authority;
    let tile_account = &mut ctx.accounts.tile_account;
    let tile_token_account = &mut ctx.accounts.tile_token_account;
    let game_account = &ctx.accounts.game_account;

    worker_ownership_checks(worker_account, worker_token_account, authority)?;

    if worker_account.task.is_none() {
        return Err(WorkerErrorCodes::WorkerHasNoTask.into())
    }

    if worker_account.game_account != game_account.key() {
        return Err(WorkerErrorCodes::InvalidGameAccountForWorker.into());
    }

    if tile_account.game_account != game_account.key() {
        return Err(TileErrorCodes::InvalidGameAccountForTile.into());
    }

    let current_time = Clock::get().unwrap().unix_timestamp;
    let task = get_task_info(worker_account);

    if current_time < task.task_complete_time {
        return Err(WorkerErrorCodes::TaskNotComplete.into())
    }

    if task.tile_key != tile_account.key() {
        return Err(WorkerErrorCodes::WrongTile.into())
    }

    // is tile token account new or not?
    if tile_token_account.is_initialized {
        // preform checks
        tile_token_account_checks(tile_token_account, tile_account, authority)?
    } else {
        // initialize account
        tile_token_account.owner = authority.key();
        tile_token_account.tile = tile_account.key();
        tile_token_account.resources = 0;
        tile_token_account.is_initialized = true;
    }

    tile_token_account.resources += task.reward;
    tile_account.resources_owed_to_owner_by_10 += task.reward;

    let skills = &mut worker_account.skills;

    let result = get_worker_skill(&tile_account.tile_type, skills);
    let skill = result.0;
    skill.experience += task.reward;
    skill.level = calculate_skill_level(skill.level, skill.experience);

    worker_account.task = None;

    Ok(())
}

#[derive(Accounts)]
#[instruction(worker_mint_bump: u8, worker_mint_seed: String, worker_name: [u8; 10])]
pub struct MintWorker<'info> {
    #[account(init, payer=authority, space = 8 + 32 + 10 + 32 + 32 + 4 + 4 + 72 + 50)]
    pub worker_account: Account<'info, WorkerAccount>,

    pub game_account: Account<'info, GameAccount>,

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

    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct CompleteTask<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + 1 + 32 + 32 + 8
    )]
    pub tile_token_account: Account<'info, TileTokenAccount>,

    #[account(mut)]
    pub worker_account: Account<'info, WorkerAccount>,
    pub worker_token_account: Account<'info, TokenAccount>,

    pub game_account: Account<'info, GameAccount>,

    #[account(mut)]
    pub tile_account: Account<'info, TileAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>
}

// 32 + 10 + 32 + 32 + 4 + 4 + 72 + 50
#[account]
pub struct WorkerAccount {
    pub game_account: Pubkey,

    pub worker_name: [u8; 10],

    // makes look up quicker but a user must always present actual proof through NFT
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
    pub farm: Skill,
    pub mine: Skill,
    pub woodcutting: Skill,
    pub gather: Skill,
    pub transport: Skill,
    // city types (forge, market, alchemy, factory)
    pub forge: Skill,
    pub alchemy: Skill,
    pub craft: Skill
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
    Alchemy = 6,
    Craft = 7
}

#[error]
pub enum WorkerErrorCodes {
    #[msg("Invalid Game Account for Worker")]
    InvalidGameAccountForWorker,

    #[msg("You do not own the worker")]
    NotWorkerOwner,

    #[msg("Incorrect token account")]
    IncorrectTokenAccount,

    #[msg("You are not the token account owner")]
    NotTokenAccountOwner,

    #[msg("Worker already has a task")]
    WorkerHasTask,

    #[msg("Worker has no task, first assign a task")]
    WorkerHasNoTask,

    #[msg("Task Not Complete")]
    TaskNotComplete,

    #[msg("Wrong tile for task")]
    WrongTile,

    #[msg("Tile has no capacity, please wait until resource are available")]
    NoCapacity,

    #[msg("Invalid tile type for the task")]
    InvalidTileType
}