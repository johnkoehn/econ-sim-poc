use anchor_lang::prelude::*;
use crate::tiles::hexagons::*;

pub mod cycles;

pub fn initialize_game(ctx: Context<InitializeGame>, max_tiles_from_center: u8, cycle_time: i32, cycles_per_period: i32) -> ProgramResult {
    let game_account = &mut ctx.accounts.game_account;

    game_account.authority = ctx.accounts.signer.key();
    game_account.current_number_of_tiles = 0;
    game_account.max_tiles_from_center = max_tiles_from_center;
    game_account.max_tiles = calculate_number_of_tiles(max_tiles_from_center);
    game_account.current_q = -(max_tiles_from_center as i32);
    game_account.current_r = 0;
    game_account.cycle_time = cycle_time;
    game_account.cycles_per_period = cycles_per_period;
    game_account.start_time = Clock::get().unwrap().unix_timestamp;

    Ok(())
}

#[derive(Accounts)]
#[instruction(max_tiles_from_center: u8, cycle_time: i32, cycles_in_period: i32)]
pub struct InitializeGame<'info> {
    #[account(init, payer = signer, space = 8 + 32 + 4 + 4 + 1 + 4 + 4 + 8 + 4 + 4)]
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

    // important for keeping cycle time in sync
    pub start_time: i64,

    // this is the number of seconds in a cycle
    pub cycle_time: i32,

    // cycles in period determine the max capacity of a tile (resources per cycle * cycles_in_period)
    pub cycles_per_period: i32
}