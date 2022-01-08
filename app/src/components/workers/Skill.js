import React from 'react';
import { ProgressBar, Row } from 'react-bootstrap';
import './Skill.css';
import skillTypesMapping from './skillTypesMapping';

const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const getExperienceNeeded = (currentLevel) => 3 ** (currentLevel + 1);

const calculateProgressToNextLevel = (currentLevel, experience) => {
    if (experience === 0) {
        return 0;
    }

    const experienceNeeded = getExperienceNeeded(currentLevel);

    return (experience / experienceNeeded) * 100;
};

const Skill = ({ skillName, skillInfo }) => {
    const level = skillInfo.level;
    const experience = skillInfo.experience.toString();

    const progress = calculateProgressToNextLevel(level, experience);

    return (
        <div className="skill-space">
            <Row>{skillTypesMapping[skillName].title}:</Row>
            <Row>&nbsp;&nbsp;&nbsp;&nbsp;Level: {level}</Row>
            <Row>&nbsp;&nbsp;&nbsp;&nbsp;Experience: {`${experience}/${getExperienceNeeded(level)}`}</Row>
            <Row>
                <ProgressBar
                    variant="info"
                    now={progress}
                    label={`${progress}%`}
                />
            </Row>
        </div>
    );
};

export default Skill;
