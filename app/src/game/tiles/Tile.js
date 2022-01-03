import React from 'react';
import Hexagon from 'react-hexgrid/lib/Hexagon/Hexagon';

const Tile = ({ tile, onSelect, onUnselect, selected }) => {
    return (
        <Hexagon key={tile.mintKey.toString()} q={tile.q} r={tile.r} s={-tile.q - tile.r} />
    );
};

export default Tile;
