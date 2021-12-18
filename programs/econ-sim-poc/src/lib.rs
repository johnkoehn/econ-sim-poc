use anchor_lang::prelude::*;

pub mod game;
pub mod tiles;
pub mod workers;

use game::*;
use tiles::*;
use workers::*;

declare_id!("5iUUMTJivwjNVUD4qqqdNuTnr79avJ76TuddrJvdwKXx");

#[program]
pub mod econ_sim_poc {
    use super::*;
    pub fn initialize_game(ctx: Context<InitializeGame>, max_tiles_from_center: u8, cycle_time: i32, cycles_in_period: i32) -> ProgramResult {
        game::initialize_game(ctx, max_tiles_from_center, cycle_time, cycles_in_period)
    }

    pub fn mint_tile(ctx: Context<MintTile>, tile_type: TileTypes, tile_mint_bump: u8, tile_mint_seed: String) -> ProgramResult {
        tiles::mint_tile(ctx, tile_type, tile_mint_bump, tile_mint_seed)
    }

    pub fn mint_worker(ctx: Context<MintWorker>, worker_mint_bump: u8, worker_mint_seed: String) -> ProgramResult {
        workers::mint_worker(ctx, worker_mint_bump, worker_mint_seed)
    }
}

