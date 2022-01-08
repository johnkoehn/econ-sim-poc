import React, { useState, useEffect } from 'react';
import { Offcanvas, Row, Col } from 'react-bootstrap';
import Hexagon from 'react-hexgrid/lib/Hexagon/Hexagon';
import './Tile.css';
import tileTypesMapping from './tileTypesMapping';
import { useEconSim } from '../../../providers/EconSimProvider';
import { calculateCapacity } from '../../../gameLogic/tileMath';

const Tile = ({ tile, onSelect, onUnselect, selected }) => {
    // tile data is information not directly stored in the account such as current capacity
    const [tileData, setTileData] = useState(undefined);
    const { gameAccount } = useEconSim();
    const tileTypeInfo = tileTypesMapping[Object.keys(tile.tileType)[0]];

    useEffect(() => {
        if (tileData) {
            return;
        }

        setTileData({
            capacity: calculateCapacity(tile, gameAccount)
        });
    }, [tileData]);

    const getCellStyle = () => {
        const cellStyle = {};

        // based on the resource type and if selected the cell style should change
        const color = tileTypeInfo.color;

        cellStyle.fill = color;
        cellStyle.stroke = selected ? 'pink' : 'black';

        return cellStyle;
    };

    const handleOnClick = () => {
        setTileData({
            capacity: calculateCapacity(tile, gameAccount)
        });
        onSelect();
    };

    const buildTileData = () => {
        if (!tileData) {
            return undefined;
        }

        return (
            <>
                <Row>
                    <Col>
                        {`Resource: ${tileTypeInfo.title}`}
                    </Col>
                </Row>
                <Row>
                    <Col>
                        {`Capacity: ${tileData.capacity}`}
                    </Col>
                </Row>
                <Row>
                    <Col>
                        {`Level: ${tile.level}`}
                    </Col>
                </Row>
            </>
        );
    };

    return (
        <>
            <Hexagon onClick={handleOnClick} cellStyle={getCellStyle()} key={tile.mintKey.toString()} q={tile.q} r={tile.r} s={-tile.q - tile.r} />
            <Offcanvas placement="end" show={selected} onHide={onUnselect}>
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title>{`${tileTypeInfo.title} Tile`}</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {buildTileData()}
                </Offcanvas.Body>
            </Offcanvas>
        </>
    );
};

export default Tile;
