const axios = require('axios');
const https = require('https');
const MOBILEAPI = process.env.MOBILEAPI;

exports.insert_mobile_booking = async function (payload) {
    try {
      let response = await axios.post(
        `${MOBILEAPI}/healthchain_insert_patientbooking`,
        payload,
        { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
      );
      console.log(response);
    } catch (error) {
      console.log(error);
    }
};
