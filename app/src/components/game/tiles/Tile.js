import React, { useState, useEffect } from 'react';
import { Offcanvas, Row, Col } from 'react-bootstrap';
import Hexagon from 'react-hexgrid/lib/Hexagon/Hexagon';
import { useWallet } from '@solana/wallet-adapter-react';
import * as spl from '@solana/spl-token';
import { web3 } from '@project-serum/anchor';
import './Tile.css';
import tileTypesMapping from './tileTypesMapping';
import { useEconSim } from '../../../providers/EconSimProvider';
import { calculateCapacity } from '../../../gameLogic/tileMath';
import SelectWorkerDropdown from '../../workers/SelectWorkerDropdown';
import Error from '../../util/Error';
import AssignedWorkersTable from './AssignedWorkersTable';

const Tile = ({ tile, onSelect, onUnselect, selected }) => {
    // tile data is information not directly stored in the account such as current capacity
    const [tileData, setTileData] = useState(undefined);
    const [error, setError] = useState('');
    const { gameAccount, gameAccountKey, program, refreshWorker } = useEconSim();
    const wallet = useWallet();

    const tileAccount = tile.account;
    const tileTypeInfo = tileTypesMapping[Object.keys(tileAccount.tileType)[0]];

    useEffect(() => {
        if (tileData) {
            return;
        }

        setTileData({
            capacity: calculateCapacity(tileAccount, gameAccount)
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
            capacity: calculateCapacity(tileAccount, gameAccount)
        });
        onSelect();
    };

    const assignWorker = async (worker) => {
        setError('');
        const workerTokenAccount = await spl.Token.getAssociatedTokenAddress(
            spl.ASSOCIATED_TOKEN_PROGRAM_ID,
            spl.TOKEN_PROGRAM_ID,
            worker.account.mintKey,
            wallet.publicKey
        );

        try {
            await program.rpc.assignTask({
                accounts: {
                    workerAccount: worker.publicKey,
                    workerTokenAccount,
                    tileAccount: tile.publicKey,
                    gameAccount: gameAccountKey,
                    authority: wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                    associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
                    rent: web3.SYSVAR_RENT_PUBKEY
                },
                signers: []
            });
        } catch (err) {
            setError(`Failed to assign worker, received message: ${err.message}`);
            return;
        }

        await refreshWorker(worker);
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
                        {`Level: ${tileAccount.level}`}
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <SelectWorkerDropdown tileType={Object.keys(tileAccount.tileType)[0]} onSelect={assignWorker} />
                    </Col>
                </Row>
                <Row>
                    <AssignedWorkersTable tile={tile} />
                </Row>
                <Row>
                    <Col>
                        <Error message={error} />
                    </Col>
                </Row>
            </>
        );
    };

    return (
        <>
            <Hexagon onClick={handleOnClick} cellStyle={getCellStyle()} key={tileAccount.mintKey.toString()} q={tileAccount.q} r={tileAccount.r} s={-tileAccount.q - tileAccount.r} />
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
