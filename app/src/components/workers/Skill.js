import React from 'react';
import { ProgressBar } from 'react-bootstrap';

const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const calculateProgressToNextLevel = (currentLevel, experience) => {
    if (experience === 0) {
        return 0;
    }

    const experienceNeeded = 3 ** (currentLevel + 1);

    return (experience / experienceNeeded) * 100;
};

const Skill = ({ skillName, skillInfo }) => {
    const progress = calculateProgressToNextLevel(skillInfo.level, skillInfo.experience.toString());

    return (
        <>
            <p>{capitalizeFirstLetter(skillName)}:</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;Level: {skillInfo.level}</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;Experience: <ProgressBar variant="info" now={progress} /></p>
        </>
    );
};

export default Skill;
