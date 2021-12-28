import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import * as spl from '@solana/spl-token';
import { setTimeout } from 'timers/promises';
import { nanoid } from 'nanoid';
import { EconSimPoc, IDL } from '../target/types/econ_sim_poc';
import createMintInfo from './util/createMintInfo';
import getRandomTileType from './util/getRandomTileType';
import tileTypes from './types/tileTypes';
import resourceTypes from './types/resourceTypes';

// center tile is the city

// surronding tiles

describe.skip('Setup testing environment for the UI', () => {

});
