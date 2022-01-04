import React from 'react';
import { Accordion } from 'react-bootstrap';
import Skill from './Skill';

const Worker = ({ worker, workerName }) => {
    console.log(worker);

    const buildSkills = () => {
        return Object.keys(worker.skills).map((skillName) => {
            return <Skill skillName={skillName} skillInfo={worker.skills[skillName]} />;
        });
    };

    return (
        <Accordion.Item eventKey={workerName}>
            <Accordion.Header>{workerName}</Accordion.Header>
            <Accordion.Body>
                {buildSkills()}
            </Accordion.Body>
        </Accordion.Item>
    );
};

export default Worker;
