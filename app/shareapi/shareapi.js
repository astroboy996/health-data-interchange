const axios = require('axios');
const SecureManager = require('./securemanager');
const KWANP_HR_URL = '' //KWANP_HR_URL SERVICE FOR UPDATE 
const KWANP_INVEN_URL = '' //KWANP_INVEN_URL SERVICE FOR UPDATE 
const {ObjectId} = require('mongodb'); // or ObjectID 

const secureManager = new SecureManager();

const HealthDB = require('./healthdb');

const username = 'healthchaindba';
const password = '$$$HealthChain@KaSemRad2023!';
const dbhost = '10.31.31.33';
const dbport = '45354';
const database = 'healthchaindb';

const healthDB = new HealthDB(username, password, dbhost, dbport, database);
exports.updatePassword_inbound = async (req, res) => { //share update password service
   
    const salt = secureManager.generateSalt();
    const hashedPassword = secureManager.hashPassword(req.body.pwd, salt);
    const usercode = req.body.code;
    try {
        let result = await _update_password_user(healthDB,usercode,hashedPassword,salt);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ error: error.message }); 
    }
}

exports.updatePassword_outbound = async (req, res) => { //share update password service

    try {
        let payload = { userid : req.body.code , password : req.body.pwd }
        let response = await axios.post(
            `${KWANP_HR_URL}`, //need to hook to destincation URL 
            payload,
            { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
          ); 
        res.status(200).json({ data: response });    
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getwellfare = async (req, res) => { //share update password service

    try {
        let payload = { userid : req.body.code , pid : req.body.pid }
        let response = await axios.post(
            `${KWANP_HR_URL}`, //need to hook to destincation URL 
            payload,
            { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
          ); 
        res.status(200).json({ data: response });    
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

exports.getBatchNo = async (req, res) => { //share update password service

   //confirm url
   //receive "item_code","store_code"
   try {
     let payload = { userid: req.body.itemcode, password: req.body.storecode };
     let response = await axios.post(
       `${KWANP_INVEN_URL}`, //need to hook to destincation URL
       payload,
       { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
     );
     // res.status(200).json({ data: response });
     res.status(200).json({
       data: {
         batchNo: "xxxx",
         exprireDate: new Date(),
       },
     });
   } catch (error) {
    res.status(500).json({ error: error.message });
}

}

exports.activateUser = async (req, res) => { //activate user when terminate
    try {
        let result = await _activate_user(healthDB,req.body.code, req.body.isactive);
        res.status(200).json({ data: result });

    } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
    }
}

async function _activate_user(healthDB,code, isactive){
    const collection = "trn_users";
    const where = {  "code" : code };
    const data ={ $set : { "isActive" : isactive }} ;
    try {
       let result = await healthDB.UpdateCommand(collection,where,data);
    if (result !=null){
        console.log(result)
    }    
    } catch (error) {
        console.log("*** " + error.message)
    }
}

async function _update_password_user(healthDB,code, password,salt){
    const collection = "trn_users";
    const where = {  "code" : code };
    const data ={ $set : { "password" : password, "salt" : salt }} ;
    try {
       let result = await healthDB.UpdateCommand(collection,where,data);
    if (result !=null){
        console.log(result)
    }    
    } catch (error) {
        console.log("*** " + error.message)
    }
}

async function triggerPassword(userid , password){
    let payload = { userid : userid , password : password }
    let response = await axios.post(
        `${KWANP_HR_URL}`,
        payload,
        { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
      );
}