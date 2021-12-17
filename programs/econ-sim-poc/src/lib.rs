use anchor_lang::prelude::*;

pub mod game;
pub mod tiles;

use game::*;
use tiles::*;


declare_id!("5iUUMTJivwjNVUD4qqqdNuTnr79avJ76TuddrJvdwKXx");

#[program]
pub mod econ_sim_poc {
    use super::*;
    pub fn initialize_game(ctx: Context<InitializeGame>, max_tiles_from_center: u8) -> ProgramResult {
        game::initialize_game(ctx, max_tiles_from_center)
    }
}

