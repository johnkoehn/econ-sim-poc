import React from 'react';
import Hexagon from 'react-hexgrid/lib/Hexagon/Hexagon';
import './Tile.css';
import tileTypesToColor from './tileTypesToColor';

const Tile = ({ tile, onSelect, onUnselect, selected }) => {
    const getCellStyle = () => {
        const cellStyle = {};

        // based on the resource type and if selected the cell style should change
        const color = tileTypesToColor[Object.keys(tile.tileType)[0]];

        cellStyle.fill = color;
        cellStyle.stroke = selected ? 'pink' : 'black';

        return cellStyle;
    };

    const handleOnClick = () => {
        onSelect();
    };

    return (
        <Hexagon onClick={handleOnClick} cellStyle={getCellStyle()} key={tile.mintKey.toString()} q={tile.q} r={tile.r} s={-tile.q - tile.r} />
    );
};

export default Tile;
