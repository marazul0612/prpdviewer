import React from 'react'

const MakeFileList = ({ file, handleChangeList }) => {
    console.log(file);
    const fileName = file.name;
    const fileData = file;


    return (
        <>
            <li button onClick={() => handleChangeList(fileData)} className="list-group-item" >
                {fileName}
            </li>
        </>
    )
}

export default MakeFileList
