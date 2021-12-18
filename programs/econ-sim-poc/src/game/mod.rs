use anchor_lang::prelude::*;
use crate::tiles::hexagons::*;

pub fn initialize_game(ctx: Context<InitializeGame>, max_tiles_from_center: u8) -> ProgramResult {
    let game_account = &mut ctx.accounts.game_account;

    game_account.authority = ctx.accounts.signer.key();
    game_account.current_number_of_tiles = 0;
    game_account.max_tiles_from_center = max_tiles_from_center;
    game_account.max_tiles = calculate_number_of_tiles(max_tiles_from_center);
    game_account.current_q = -(max_tiles_from_center as i32);
    game_account.current_r = 0;

    Ok(())
}

#[derive(Accounts)]
#[instruction(max_tiles_from_center: u8)]
pub struct InitializeGame<'info> {
    #[account(init, payer = signer, space = 8 + 32 + 4 + 4 + 1 + 32 + 1)]
    pub game_account: Account<'info, GameAccount>,

    #[account(mut)]
    pub signer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct GameAccount {
    pub authority: Pubkey,
    pub max_tiles: u32,
    pub current_number_of_tiles: u32,
    pub max_tiles_from_center: u8,

    pub current_q: i32,
    pub current_r: i32,
}