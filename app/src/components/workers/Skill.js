import React from 'react';

const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const Skill = ({ skillName, skillInfo }) => {
    return (
        <>
            <p>{capitalizeFirstLetter(skillName)}:</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;Level: {skillInfo.level}</p>
            <p>&nbsp;&nbsp;&nbsp;&nbsp;Experience: {skillInfo.experience.toString()}</p>
        </>
    );
};

export default Skill;
