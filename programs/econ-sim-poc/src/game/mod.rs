use anchor_lang::prelude::*;
use crate::tiles::hexagons::*;

pub fn initialize_game(ctx: Context<InitializeGame>, max_tiles_from_center: u8) -> ProgramResult {
    let game_account = &mut ctx.accounts.game_account;

    game_account.authority = ctx.accounts.signer.key();
    game_account.current_number_of_tiles = 0;
    game_account.max_tiles_from_center = max_tiles_from_center;
    game_account.max_tiles = calculate_number_of_tiles(max_tiles_from_center);


    Ok(())
}

#[derive(Accounts)]
#[instruction(max_tiles_from_center: u8)]
pub struct InitializeGame<'info> {
    #[account(init, payer = signer, space = 8 + 32 + 4 + 4 + 1)]
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
    pub max_tiles_from_center: u8
}