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

    pub fn mint_tile(ctx: Context<MintTile>, tile_type: TileTypes, tile_mint_bump: u8, tile_mint_seed: String) -> ProgramResult {
        tiles::mint_tile(ctx, tile_type, tile_mint_bump, tile_mint_seed)
    }
}

