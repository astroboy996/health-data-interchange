const axios = require('axios');
const option = { headers: { 'healthchain-token': '155898' } };
const FILEAPI = process.env.FILEAPI;

exports.uploadMDM = async function (fileName, fileType, base64) {
    let payload = { fileName, fileType, base64 };
    try {
        let { data } = await axios.post(`${FILEAPI}/upload/mdm`, payload);
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}