const config = require('../config/db');
const axios = require('axios');
const option = { headers:{'healthchain-token': '155898'}};
const COREAPI = process.env.COREAPI;

exports.getOrderRoute = async function (body = { entypeuid, departmentuid, orderitemuid, orguid}) {
    let response = await axios.post(`${COREAPI}/ordermanagement/orderroute/getavailableroute`, body, option);
    return (response.data?.availableorderroute || []).find(elem => elem.isdefault);
}

exports.getTariff = async function (body = { departmentuid, orderitemuid, patientvisituid, quantity, ordertypecode, isnoned, orguid}) {
    let response = await axios.post(`${COREAPI}/billing/orderitemprice`, body, option);
    return response?.data;
}

exports.createOrder = async function (body = { orderfromdepartmentuid, patientuid, patientvisituid, entypeuid, patientorder, orguid, useruid, isdft}) {
    let response = await axios.post(`${COREAPI}/ordermanagement/patientorder/createpatientorder`, body, option);
    return response?.data;
}

exports.updatePatientRecord = async function (patientRecord) {
    try {
        let { data } = await axios.post(`${COREAPI}/api/v0/patientrecord/update`, patientRecord);
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}

exports.getPatientRecordByVisitId = async function (visitId) {
    try {
        let { data } = await axios.get(`${COREAPI}/api/v0/patientrecord/search/by/visitid/${visitId}`);
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}
exports.getPatientRecordByVisitIdAndHN = async function (visitId, hn) {
    try {
        let { data } = await axios.get(`${COREAPI}/api/v0/patientrecord/search/visitid_hn/${visitId}/${hn}`);
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}

exports.getClinicByCode = async function (clinicCode) {
    try {
        let { data } = await axios.get(`${COREAPI}/api/v0/clinic/search/by/code/${clinicCode}`);
        return data
    } catch (error) {
        console.log(error);
        throw error
    }
}

exports.getTenantByCode = async function (tenantCode) {
    try {
        let { data } = await axios.get(`${COREAPI}/api/v0/tenant/search/code/${tenantCode}`);
        return data
    } catch (error) {
        console.log(error);
        throw error
    }
}

exports.getUserByCode = async function (userCode) {
    if (!userCode) return null;
    let encodeUserCode = encodeURIComponent(userCode);
    try {
        let { data } = await axios.get(`${COREAPI}/api/v0/user/search/code/${encodeUserCode}`);
        return data
    } catch (error) {
        console.log(error);
        throw error
    }
}


exports.getOrderItemByCode = async function (orderItemCode) {
    try {
        let { data } = await axios.get(`${COREAPI}/api/v0/orderitem/search/code/${orderItemCode}`);
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}

exports.createNewOrder = async function ({ patientRecord, patient, patientCase, isOnBehalf, selectedRightId, clinic, patientOrderItem, user, tenant }) {
    try {
        let payload = {
            patient,
            patientCase,
            isOnBehalf,
            selectedRightId,
            patientRecord,
            clinic,
            patientOrderItems: [
                patientOrderItem
            ]
        }
        let { data } = await axios.post(`${COREAPI}/api/v0/patientorder/create`, payload, {
            headers: {
                user:user,
                tenant:tenant
            }
        });
        return data
    } catch (error) {
        throw error
    }
}

exports.getPatientByHN = async function (patientHN) {
    try {
        let { data } = await axios.get(`${COREAPI}/api/v0/patient/search/hn/${patientHN}`);
        return data
    } catch (error) {
        console.log(error);
        throw error
    }
}

exports.getKeyLinkByGroup = async function (group) {
    try {
        let { data } = await axios.post(`${COREAPI}/api/v0/keyink/searchbygroup`, { group });
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}

exports.getObservationByCode = async function (observationCode) {
    if (!observationCode) return [];
    try {
        let { data } = await axios.get(`${COREAPI}/api/v0/observation?code=${observationCode}`);
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}

exports.getAgeRulesByPatient = async function (patient) {
    try {
        let { data } = await axios.post(`${COREAPI}/api/v0/agerule/search/by/patient`, { patient });
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}

exports.createNewObservation = async function (patientObservation) {
    // let headers = {
    //     user,
    //     tenant
    // }
    try {
        let { data } = await axios.post(`${COREAPI}/api/v0/patientobservation/upsert`, patientObservation);
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}

exports.createPatientICD10 = async function (patientICD10) {
    try {
        let { data } = await axios.post(`${COREAPI}/api/v0/patienticd10/upsert`, patientICD10);
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}

exports.searchICD10 = async function (searchText) {
    try {
        let { data } = await axios.post(`${COREAPI}/api/v0/icd10/search`, { searchText });
        return data
    } catch (error) {
        console.log(error)
        throw error
    }
}


exports.getPatientCCHPI = async function (patientrecordid, doctor) {
  try {
    const payload = { patientrecordid, doctor };
    let { data } = await axios.post(
      `${COREAPI}/api/v0/patientccphi/search/by/patientrecordid_doctor`,
      payload
    );
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};


exports.upsertPatientCCHPI = async function (patientCCHPI) {
  try {
    let { data } = await axios.post(
      `${COREAPI}/api/v0/patientccphi/upsert`,
      patientCCHPI
    );
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

exports.getPharmacyDispenseByDate = async function (fromdate, todate) {
    
    try {
        let { data } = await axios.get(`${COREAPI}/api/v0/pharmacy/dispense/search/by/date/${fromdate}/${todate}`);
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
};

exports.getPharmacyDispenseReturnByDate = async function (fromdate, todate) {
    
    try {
        let { data } = await axios.get(`${COREAPI}/api/v0/pharmacy/return/search/by/date/${fromdate}/${todate}`);
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
};

exports.getPatientBillByDateWithOption = async function (fromdate, todate, isinvoice) {
    let payload = {
        fromdate: fromdate,
        todate: todate,
        isinvoice: isinvoice
    }
    try {
        let { data } = await axios.post(`${COREAPI}/api/v0/patientbill/search/by/date/with/option`, payload);
        return data
    } catch (error) {
      console.log(error);
      throw error;
    }
};

exports.getPatientDepositByDateWithOption = async function (fromdate, todate, isrefund) {
    let payload = {
        fromdate: fromdate,
        todate: todate,
        isrefund: isrefund
    }
    try {
        let { data } = await axios.post(`${COREAPI}/api/v0/patientdeposit/search/by/date/with/option`, payload);
        return data
    } catch (error) {
      console.log(error);
      throw error;
    }
};

exports.getDepositByDate = async function (fromdate, todate) {
    let payload = {
        fromdate: fromdate,
        todate: todate
    }
    try {
        let { data } = await axios.post(`${COREAPI}/api/v0/search/deposit/by/date`, payload);
        return data
    } catch (error) {
      console.log(error);
      throw error;
    }
};

exports.upsertPatientDocument = async function (patient, patientRecord, clinic, documentType, documentName, fileType, url, tenant, createDate, createBy, modifyDate, modifyBy) {
    let payload = {
        isActive: true,
        tenant,
        createDate,
        createBy,
        modifyDate,
        modifyBy
    };
    if (patient) payload.patient = patient;
    if (patientRecord) payload.patientRecord = patientRecord;
    if (clinic) payload.clinic = clinic;
    if (documentType) payload.documentType = documentType;
    if (documentName) payload.documentName = documentName;
    if (fileType) payload.fileType = fileType;
    if (url) payload.url = url;

    try {
        let { data } = await axios.post(`${COREAPI}/api/v0/patientdocument/upsert`, payload, {
            headers: {
                tenant,
                user: createBy?._id ?? createBy
            }
        });
        return data
    } catch (error) {
        console.log(error);
        throw error;
    }
};