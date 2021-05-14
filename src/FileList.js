import MakeFileList from './MakeFileList'



const FileList = ({ files, handleChangeList }) => {

    const fileList = [];

    if (files !== undefined) {
        for (const file of files) {
            fileList.push(file);
        }
    }

    return (
        <>
            {/* map 사용할때  array 안에 있는 차일드들은 고유한(unique) key prop을 가져야 한다.*/}
            {fileList.map(file => <MakeFileList file={file} handleChangeList={handleChangeList} />)}
        </>
    )
}

export default FileList
