use anchor_lang::{prelude::*, solana_program::instruction};
use borsh::{BorshDeserialize, BorshSerialize};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use spl_token;

use crate::game::GameAccount;

use self::hexagons::calculate_next_coordinates;

pub mod hexagons;


#[derive(Debug, Clone, PartialEq, BorshDeserialize, AnchorSerialize)]
pub enum TileTypes {
    Food = 0,
    Iron = 1,
    Coal = 2,
    Wood = 3,
    RareMetals = 4,
    Herbs = 5
}

pub fn mint_tile(ctx: Context<MintTile>, tile_type: TileTypes, tile_mint_bump: u8, tile_mint_seed: String) -> ProgramResult {
    let game_account = &mut ctx.accounts.game_account;

    if game_account.current_number_of_tiles >= game_account.max_tiles {
        return Err(ErrorCode::MaxTiles.into())
    }

    let tile_mint = &mut ctx.accounts.tile_mint;
    let tile_account = &mut ctx.accounts.tile_account;

    tile_account.owner = ctx.accounts.receiver.key();
    tile_account.mint_key = tile_mint.key();
    tile_account.tile_type = tile_type;
    tile_account.q = game_account.current_q;
    tile_account.r = game_account.current_r;
    tile_account.level = 0;
    tile_account.tax_percent = 10;
    tile_account.min_worker_level = 0;

    tile_account.capacity = 0;
    tile_account.last_assignment = Clock::get().unwrap().unix_timestamp;

    // mint tile
    anchor_spl::token::mint_to(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::MintTo {
                mint: tile_mint.to_account_info(),
                to: ctx.accounts.tile_token_account.to_account_info(),
                authority: tile_mint.to_account_info(),
            },
            &[&[&tile_mint_seed.as_bytes(), &[tile_mint_bump]]],
        ),
        1,
    )?;
    anchor_spl::token::set_authority(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::SetAuthority {
                current_authority: tile_mint.to_account_info(),
                account_or_mint: tile_mint.to_account_info()
            },
            &[&[&tile_mint_seed.as_bytes(), &[tile_mint_bump]]]
        ),
        spl_token::instruction::AuthorityType::MintTokens,
        None
    )?;

    // update game q and r
    let (q, r) = calculate_next_coordinates(
        game_account.max_tiles_from_center,
        game_account.current_q,
        game_account.current_r
    );

    game_account.current_q = q;
    game_account.current_r = r;
    game_account.current_number_of_tiles += 1;

    msg!("Current number of tiles {:?}", game_account.current_number_of_tiles);
    msg!("q {:?}", game_account.current_q);
    msg!("r {:?}", game_account.current_r);
    Ok(())
}

#[derive(Accounts)]
#[instruction(tile_type: TileTypes, tile_mint_bump: u8, tile_mint_seed: String)]
pub struct MintTile<'info> {
    #[account(init, payer = authority, space = 8 + 32 + 32 + 1 + 4 + 4 + 1 + 1 + 1 + 8 + 8)]
    pub tile_account: Account<'info, TileAccount>,

    #[account(has_one = authority, mut)]
    pub game_account: Account<'info, GameAccount>,

    #[account(
        init,
        payer = authority,
        seeds = [tile_mint_seed.as_bytes()],
        bump = tile_mint_bump,
        mint::decimals = 0,
        mint::authority = tile_mint
    )]
    pub tile_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = tile_mint,
        associated_token::authority = receiver,
    )]
    pub tile_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    // need this when testing on the UI qqq
    pub receiver: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub rent: Sysvar<'info, Rent>
}

#[account]
pub struct TileAccount {
    pub owner: Pubkey,
    pub mint_key: Pubkey,
    pub tile_type: TileTypes,
    pub q: i32,
    pub r: i32,

    // level affects max capacity and the rate at which
    // capacity is 'refilled'
    pub level: u8,

    // 0 to 100
    pub tax_percent: u8,

    pub min_worker_level: u8,

    // this is the number of remaining resources that could be
    // consumed last time a worker was tasked
    pub capacity: u64,

    pub last_assignment: i64
}

#[error]
pub enum ErrorCode {
    #[msg("Max tiles minted")]
    MaxTiles,

    #[msg("Only the game master can create tiles")]
    NotGameMaster
}