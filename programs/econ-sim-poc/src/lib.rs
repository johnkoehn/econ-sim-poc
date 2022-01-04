use anchor_lang::prelude::*;

pub mod game;
pub mod tiles;
pub mod workers;
pub mod resource_mints;

use game::*;
use tiles::*;
use workers::*;
use resource_mints::*;

declare_id!("2gQqArNBd6qPP8xSJrfwuWMdKzfqkrHwcZL79h7wpvio");

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

    pub fn assign_task(ctx: Context<AssignTask>) -> ProgramResult {
        workers::assign_task(ctx)
    }

    pub fn complete_task(ctx: Context<CompleteTask>) -> ProgramResult {
        workers::complete_task(ctx)
    }

    pub fn create_resource_mint(ctx:Context<CreateResourceMint>, resource_type: ResourceTypes, mint_bump: u8, mint_seed: String) -> ProgramResult {
        resource_mints::create_resource_mint(ctx, resource_type, mint_bump, mint_seed)
    }

    pub fn transport_resource(ctx: Context<TransportResource>) -> ProgramResult {
        resource_mints::transport_resource(ctx)
    }

    pub fn complete_transport_resource(ctx: Context<CompleteTransportResource>, resource_mint_bump: u8, resource_mint_seed: String) -> ProgramResult {
        resource_mints::complete_transport_resource(ctx, resource_mint_bump, resource_mint_seed)
    }
}

