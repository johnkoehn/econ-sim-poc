import React, { useState } from 'react';
import { useEconSim } from '../../../providers/EconSimProvider';
import Tile from './Tile';

const Tiles = () => {
    const [selectedTile, setSelectedTile] = useState(undefined);

    const gameData = useEconSim();

    return gameData.tiles.map((tile) => {
        const { account } = tile;
        const onTileSelect = () => {
            setSelectedTile({
                q: account.q,
                r: account.r
            });
        };

        const onTileUnselect = () => {
            setSelectedTile(undefined);
        };

        // TODO -- add if they own the tile or not
        if (selectedTile && selectedTile.q === account.q && selectedTile.r === account.r) {
            return <Tile key={account.mintKey.toString()} tile={tile} selected onSelect={onTileSelect} onUnselect={onTileUnselect} />;
        }

        return <Tile key={account.mintKey.toString()} tile={tile} onSelect={onTileSelect} onUnselect={onTileUnselect} />;
    });
};

export default Tiles;
