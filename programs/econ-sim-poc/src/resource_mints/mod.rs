use std::string;

use anchor_lang::{prelude::*, solana_program::{instruction, clock}};
use borsh::{BorshDeserialize, BorshSerialize};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use spl_token;

use crate::{
    game::{GameAccount, cycles::get_current_cycle_time},
    tiles::{TileAccount, TileTokenAccount, TileTypes, tile_token_account_checks, TileErrorCodes, hexagons::calculate_distance},
    workers::{WorkerAccount, worker_ownership_checks, WorkerErrorCodes, TaskTypes, calculate_worker_capacity, Task}
};

// make sure we know the mint bump and seed for each resource
pub fn create_resource_mint(ctx: Context<CreateResourceMint>, resource_type: ResourceTypes, _mint_bump: u8, _mint_seed: String) -> ProgramResult {
    let game_account = &ctx.accounts.game_account;
    let mint = &ctx.accounts.resource_mint;
    let resource_info = &mut ctx.accounts.resource_info;


    resource_info.game_account = game_account.key();
    resource_info.resource_type = resource_type;
    resource_info.mint_key = mint.key();

    Ok(())
}

// destination must be a city
// the user must have a valid tile token account for the given tile
// must be resources to transport
// worker will be assinged a task
// each tile moved will be one cycle
// on task complete they will be minted the tokens for the given amount
pub fn transport_resource(ctx: Context<TransportResource>) -> ProgramResult {
    let game_account = &ctx.accounts.game_account;
    let start_tile = &ctx.accounts.start_tile;
    let destination_tile = &ctx.accounts.destination_tile;
    let tile_token_account = &mut ctx.accounts.tile_token_account;
    let worker_account = &mut ctx.accounts.worker_account;
    let worker_token_account = &mut ctx.accounts.worker_token_account;
    let authority = &ctx.accounts.authority;

    worker_ownership_checks(worker_account, worker_token_account, authority)?;

    if worker_account.task.is_some() {
        return Err(WorkerErrorCodes::WorkerHasTask.into());
    }

    if destination_tile.tile_type != TileTypes::City {
        return Err(ResourceMintErrorCodes::DestinationTileMustBeCity.into());
    }
    // naturally, a city tile has no tile token accounts

    tile_token_account_checks(tile_token_account, start_tile, authority)?;

    // check for resources to transfer
    if tile_token_account.resources == 0 {
        return Err(TileErrorCodes::NoResources.into())
    }

    // calculate distance
    let distance = calculate_distance(start_tile.q, start_tile.r, destination_tile.q, destination_tile.r);

    // calculate amount
    let max_transport_amount = calculate_worker_capacity(worker_account.skills.transport.level);
    let amount = if (tile_token_account.resources as i64 - max_transport_amount as i64) < 0  { tile_token_account.resources } else { max_transport_amount };

    worker_account.task = Some(Task {
        tile_key: start_tile.key(),
        task_type: TaskTypes::Transport,
        reward: amount,
        // each hex is one cycle time
        task_complete_time: get_current_cycle_time(game_account) + (distance as i64 * game_account.cycle_time as i64)
    });

    tile_token_account.resources -= amount;

    Ok(())
}

pub fn compelete_transport_resource(ctx: Context<CompleteTransportResource>, resource_mint_bump: u8, resource_mint_seed: String) -> ProgramResult {
    msg!("here0");
    let game_account = &ctx.accounts.game_account;
    let start_tile = &ctx.accounts.start_tile;
    let destination_tile = &ctx.accounts.destination_tile;
    let worker_account = &mut ctx.accounts.worker_account;
    let worker_token_account = &ctx.accounts.worker_token_account;
    let resource_info = &ctx.accounts.resource_info;
    let resource_token_mint = &mut ctx.accounts.resource_token_mint;
    let resource_token_account = &mut ctx.accounts.resource_token_account;
    let authority = &ctx.accounts.authority;

    worker_ownership_checks(worker_account, worker_token_account, authority)?;

    if worker_account.task.is_none() {
        return Err(WorkerErrorCodes::WorkerHasNoTask.into());
    }

    let task = worker_account.task.as_ref().unwrap().clone();
    let current_time = Clock::get().unwrap().unix_timestamp;

    if current_time < task.task_complete_time {
        return Err(WorkerErrorCodes::TaskNotComplete.into())
    }

    if task.task_type != TaskTypes::Transport {
        return Err(ResourceMintErrorCodes::MustBeTransportTask.into())
    }

    if start_tile.key() != task.tile_key {
        return Err(WorkerErrorCodes::WrongTile.into())
    }

    if resource_info.mint_key != resource_token_mint.key() {
        return Err(ResourceMintErrorCodes::InvalidResourceMint.into())
    }

    // is the resource the correct resource for the given tile
    let resource_type = match start_tile.tile_type {
        TileTypes::Food => Some(ResourceTypes::Food),
        TileTypes::Iron => Some(ResourceTypes::Iron),
        TileTypes::Coal => Some(ResourceTypes::Coal),
        TileTypes::Wood => Some(ResourceTypes::Wood),
        TileTypes::Herbs => Some(ResourceTypes::Herbs),
        TileTypes::RareMetals => Some(ResourceTypes::RareMetals),
        TileTypes::City => None
    };

    if resource_type.is_none() {
        return Err(ResourceMintErrorCodes::InvalidResourceType.into())
    }

    if resource_info.resource_type != resource_type.unwrap() {
        return Err(ResourceMintErrorCodes::InvalidResourceMintForTask.into())
    }

    // phew, now we can mint tokens, set task to none
    anchor_spl::token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::MintTo {
                mint: resource_token_mint.to_account_info(),
                to: resource_token_account.to_account_info(),
                authority: resource_token_mint.to_account_info(),
            },
            &[&[&resource_mint_seed.as_bytes(), &[resource_mint_bump]]],
        ),
        task.reward,
    )?;

    // TODO -- we need to incoporate amount of tiles the worker went through
    worker_account.skills.transport.experience += task.reward;
    worker_account.task = None;

    Ok(())
}

#[derive(Accounts)]
#[instruction(resource_mint_bump: u8, resource_mint_seed: String)]
pub struct CompleteTransportResource<'info> {
    pub game_account: Box<Account<'info, GameAccount>>,
    pub start_tile: Box<Account<'info, TileAccount>>,
    pub destination_tile: Box<Account<'info, TileAccount>>,

    #[account(mut)]
    pub worker_account: Box<Account<'info, WorkerAccount>>,
    pub worker_token_account: Box<Account<'info, TokenAccount>>,

    pub resource_info: Box<Account<'info, ResourceInfo>>,

    #[account(mut)]
    pub resource_token_mint: Box<Account<'info, Mint>>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = resource_token_mint,
        associated_token::authority = authority,
    )]
    pub resource_token_account: Box<Account<'info, TokenAccount>>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
pub struct TransportResource<'info> {
    pub game_account: Account<'info, GameAccount>,
    pub start_tile: Account<'info, TileAccount>,
    pub destination_tile: Account<'info, TileAccount>,

    #[account(mut)]
    pub tile_token_account: Account<'info, TileTokenAccount>,

    #[account(mut)]
    pub worker_account: Account<'info, WorkerAccount>,
    pub worker_token_account: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>
}

#[derive(Accounts)]
#[instruction(resource_type: ResourceTypes, mint_bump: u8, mint_seed: String)]
pub struct CreateResourceMint<'info> {
    #[account(
        init,
        payer = authority,
        seeds = [mint_seed.as_bytes()],
        bump = mint_bump,
        mint::decimals = 0,
        mint::authority = resource_mint
    )]
    pub resource_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 4 + 32
    )]
    pub resource_info: Account<'info, ResourceInfo>,

    #[account(has_one = authority)]
    pub game_account: Account<'info, GameAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>
}

#[account]
pub struct ResourceInfo {
    pub game_account: Pubkey,
    pub resource_type: ResourceTypes,
    pub mint_key: Pubkey
}

// could we have many mints?
#[derive(Debug, Clone, PartialEq, BorshDeserialize, AnchorSerialize)]
pub enum ResourceTypes {
    Food = 0,
    Iron = 1,
    Coal = 2,
    Wood = 3,
    RareMetals = 4,
    Herbs = 5
}

#[error]
pub enum ResourceMintErrorCodes {
    #[msg("Destination tile must be a city")]
    DestinationTileMustBeCity,

    #[msg("Must be transport task")]
    MustBeTransportTask,

    #[msg("Invalid Resource Mint")]
    InvalidResourceMint,

    #[msg("Invalid Resource Type")]
    InvalidResourceType,

    #[msg("Invalid resource mint for the given task")]
    InvalidResourceMintForTask
}