import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Table } from 'react-bootstrap';
import { useEconSim } from '../../../providers/EconSimProvider';
import uint8ArrayToString from '../../../util/uint8ArrayToString';

const AssignedWorkersTable = ({ tile }) => {
    const gameData = useEconSim();
    const wallet = useWallet();

    const assignedWorkers = gameData.workers.filter(({ account }) => {
        if (!account.task) {
            return false;
        }

        return account.task.tileKey.toString() === tile.publicKey.toString();
    });

    if (assignedWorkers.length === 0) {
        return <span />;
    }

    const buildAssignedWorkers = () => {
        return assignedWorkers.map((worker) => {
            const workerName = uint8ArrayToString(worker.account.workerName);
            return (
                <tr>
                    <td>{`Worker ${workerName}`}</td>
                    <td>hey</td>
                </tr>
            );
        });
    };

    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    <td>Workers</td>
                    <td>Progress</td>
                </tr>
            </thead>
            <tbody>
                {buildAssignedWorkers()}
            </tbody>
        </Table>
    );
};

export default AssignedWorkersTable;
