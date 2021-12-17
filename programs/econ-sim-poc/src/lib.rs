use anchor_lang::prelude::*;

declare_id!("5iUUMTJivwjNVUD4qqqdNuTnr79avJ76TuddrJvdwKXx");

#[program]
pub mod econ_sim_poc {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
