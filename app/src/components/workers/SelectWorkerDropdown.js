import React from 'react';
import { Dropdown } from 'react-bootstrap';
import { useEconSim } from '../../providers/EconSimProvider';
import tileTypeToSkills from './tileTypeToSkills';
import skillTypesMapping from './skillTypesMapping';
import uint8ArrayToString from '../../util/uint8ArrayToString';

const SelectWorkerDropdown = ({ tileType, onSelect }) => {
    const { workers } = useEconSim();

    const skillName = tileTypeToSkills[tileType];

    const sortBySkill = (a, b) => {
        const account1 = a.account;
        const account2 = b.account;

        return account2.skills[skillName].level - account1.skills[skillName].level;
    };

    const availableWorkers = workers
        .filter(({ account }) => !account.task)
        .sort(sortBySkill);

    const buildDropdownMenu = () => {
        const items = availableWorkers
            .map((worker) => {
                const { account } = worker;
                const skillTitle = skillTypesMapping[skillName].title;
                const skillLevel = account.skills[skillName].level;
                const name = uint8ArrayToString(account.workerName);

                return (
                    <Dropdown.Item key={worker.publicKey.toString()} onClick={() => onSelect(worker)}>
                        {`Worker ${name} - ${skillTitle} Level ${skillLevel}`}
                    </Dropdown.Item>
                );
            });

        return (
            <Dropdown.Menu>
                {items}
            </Dropdown.Menu>
        );
    };

    if (availableWorkers.length === 0) {
        return (<span>No available workers</span>);
    }

    return (
        <Dropdown>
            <Dropdown.Toggle variant="primary" id="available-workers">
                Assign Worker
            </Dropdown.Toggle>
            {buildDropdownMenu()}
        </Dropdown>
    );
};

export default SelectWorkerDropdown;
