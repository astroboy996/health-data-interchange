// schema
// const Organisation = require('../model/healthchain-schema/enterprise/organisation');
// const OrderItem = require('../model/healthchain-schema/ordermanagement/orderitem');
// const PatientVisit = require('../model/healthchain-schema/patient/trn_visitdetail');
// const User = require('../model/healthchain-schema/enterprise/user');
// const OrderResultItem = require('../model/healthchain-schema/ordermanagement/orderresultitem');
// const Observation = require('../model/healthchain-schema/emr/trn_observation');
// const Patient =require('../model/healthchain-schema/patient/trn_patient');

// setting
const codeConfig = require('../../config/codesetting');

// lib
const mongoose = require('mongoose');
const moment = require('moment');
var winston = require('winston');

const CoreAPI = require('../coreapi');
    //  episode : "xxx", //VN or AN
	// 	usercode : "xxx", // Nurse or Assist
	// 	bucode : "xxx" , // Hospital code ใช้เป็น "01" 
	// 	createwhen:"YYYYMMddHHmmss",
	// 	data:
	// 	{
	// 		"sys": "140",
	// 		"dia" : "70",
	// 		"pulse": "100",
	// 		"temp":"36.5",
	//      "spo2" : "98" // O2BY
	// 	}

exports.create = async (req, res) => {
    // find uid from data
    let searchErr = null;
    var [org, patientvisit, user, orderitem] = await Promise.all([
        Organisation.findOne({
            statusflag: 'A',
            code: req.body.bucode
        }).lean().exec(),
        PatientVisit.findOne({
            statusflag: 'A',
            visitid: req.body.episode,
            enddate: null
        }).lean().exec(),
        User.findOne({
            statusflag: 'A',
            code: req.body.usercode
        }).lean().exec(),
        OrderItem.findOne({
            statusflag: 'A',
            code: codeConfig.vitalsign_code,
            $or: [{ activeto: { $gte: new Date(moment().startOf('day').toISOString()) } }, { activeto: null }]
        })
        .populate({ path: 'resultitems.resultitemuid', model: 'OrderResultItem'})
        .lean().exec()
    ]).catch(err => searchErr = err);

    if(searchErr){
        winston.error(searchErr);
        res.status(500).json({ error: 'Search Error', error_code: 'E3', message: searchErr});
    }

    if(!org){
        res.status(500).json({ error: 'bucode not found in HIS', error_code: 'E0'});
    }

    if(!patientvisit){
        res.status(500).json({ error: 'episode not found in HIS', error_code: 'E1'});
    }

    if(!user){
        res.status(500).json({ error: 'usercode not found in HIS', error_code: 'E2'});
    }

    // create object for save data 
    var newObservation = new Observation();
    newObservation.patientuid = patientvisit.patientuid;
    newObservation.patientvisituid = patientvisit._id;
    newObservation.observationdate = moment(req.body.createwhen,'YYYYMMDDHHmmss').format();
    newObservation.observinguseruid = user._id;
    newObservation.orderitemuid = orderitem._id;
    newObservation.observationvalues = [];

    orderitem.resultitems.forEach(resultitem => {
        var dataInput = req.body.data;
        var objectResult = {};
        var keyobject = Object.keys(req.body.data);
        keyobject.forEach(key => {
            if ((key.toUpperCase() == resultitem.resultitemuid.code) && (dataInput.hasOwnProperty(key))) {
                objectResult.orderresultitemuid = resultitem.resultitemuid._id;
                objectResult.name = resultitem.resultitemuid.name;
                objectResult.shorttext = resultitem.resultitemuid.shorttext;
                objectResult.resulttype = resultitem.resultitemuid.resulttype;
                objectResult.uomuid = resultitem.resultitemuid.uomuid;
                objectResult.normalrange = null;
                objectResult.displayorder = resultitem.displayorder;
                objectResult.resultvalue = dataInput[key]; //
                newObservation.observationvalues.push(objectResult);
            }
        });
        // newObservation.observationvalues.push(objectResult);
    });

    newObservation.createdby = user._id;
    newObservation.createdat = Date.now();
    newObservation.modifiedby = user._id;
    newObservation.modifiedat = Date.now();
    newObservation.statusflag = "A";
    newObservation.orguid = org._id;

    let error = null;
    var response =  await newObservation.save().catch(err => error = err);
    if(error){
        winston.error(error);
        res.status(500).json({ error: 'Save Error', error_code: 'E4', message: error});
    }
    else{
        res.status(200).json({ response: 'Save Success' });
    }

}


exports.getpatientinfo = async (req, res) => {
    // req.body.vn, bucode --> return patinfo vn patname dob gender
    var error = null;

    var budata = await Organisation.findOne({
        code: req.body.bucode,
        statusflag: 'A',
    }).lean().exec().catch(err => error = err);

    if(error){
        winston.error(searchErr);
        res.status(500).json({ error: 'Search Error', error_code: 'E3', message: searchErr});
    }

    if(!budata){
        res.status(500).json({ error: 'bucode not found in HIS', error_code: 'E0'});
    }

    var visitdata = await PatientVisit.findOne({
        statusflag: 'A',
        visitid: req.body.vn,
        orguid: budata?._id
    })
    .populate({
        path: 'patientuid', model: 'TRN_Patient',
        populate:
            [{
                path: 'genderuid',
                model: 'ReferenceValue',
                select: 'valuecode valuedescription relatedvalue'
            },
            {
                path: 'titleuid',
                model: 'ReferenceValue',
                select: 'valuedescription relatedvalue'
            }]
    })
    .lean().exec().catch(err => error = err);

    if(error){
        winston.error(searchErr);
        res.status(500).json({ error: 'Search Error', error_code: 'E3', message: searchErr});
    }

    if(!visitdata){
        res.status(500).json({ error: 'episode not found in HIS', error_code: 'E1'});
    }
    else{
        var result = {
            patientname: visitdata.patientuid.titleuid.valuedescription + ' ' + visitdata.patientuid.firstname + ' ' + visitdata.patientuid.middlename + ' ' + visitdata.patientuid.lastname,
            vn: visitdata.visitid,
            dob: visitdata.patientuid.dateofbirth,
            gender: visitdata.patientuid.genderuid.valuedescription
        }

        res.status(200).json({ response: result });
    }
}

exports.createNewVitalSign = async (req, res) => {
    const { episode, usercode, bucode, createwhen, data } = req.body;
    const VITALSIGN_CODE = "VITALSIGN";

    const [tenant, patientRecord, user, observation] = await Promise.all([
        CoreAPI.getTenantByCode(bucode),
        CoreAPI.getPatientRecordByVisitId(episode), //!deprecated 
        CoreAPI.getUserByCode(usercode),
        CoreAPI.getObservationByCode(VITALSIGN_CODE)
    ]).catch(err => res.status(500).json({ error: 'Search Error', error_code: 'E3', message: err }))

    if (!tenant) {
        res.status(500).json({ error: 'BU Code not found in HIS', error_code: 'E0' });
    }

    if (!patientRecord) {
        res.status(500).json({ error: 'Episode not found in HIS', error_code: 'E1' });
    }

    if (!user) {
        res.status(500).json({ error: 'User Code not found in HIS', error_code: 'E2' });
    }

    const patientAgeRule = await CoreAPI.getAgeRuleByCode(patient).catch(err => res.status(500).json({ error: 'Search Age Rule Error', error_code: 'E3', message: err }))

    let newObservation = {
        patient: patientRecord.patient,
        patientRecord: patientRecord._id,
        observationDate: moment(createwhen, "YYYYMMddHHmmss"),
        clinic: patientRecord.clinics?.[0]?.clinic?.name, //TODO fix for multiple clinic
        observingUser: req.session.useruid,
        observation: observation
    };

    let dataKeys = Object.keys(data);
    newObservation.observation.forEach(obs => {
        // mapping code from interface
        let codeMapping = {
            "BPSYS": "sys",
            "BPDIA": "dia",
            "HRATE": "pulse",
            "TEMP": "temp",
            "SPO2": "spo2",
        }
        let code = codeMapping[obs.code];
        if (dataKeys.includes(code)) {
            obs.result = data[code];
        }
        //TODO check age rules

        let normalRange;
        if (patientAgeRule) {
            normalRange = obs.normalRanges.find(norm => {
                return patientAgeRule?._id == (norm.ageRule ?? "").toString();
            })
        } else {
            normalRange = obs.normalRanges.find(norm => {
                return !norm.ageRule;
            });
        }

        if (normalRange) {
            if (normalRange.min && normalRange.max) {
                if (obs.result < normalRange.min) {
                    obs.HLN = "L";
                } else if (obs.result > normalRange.max) {
                    obs.HLN = "H";
                } else {
                    obs.HLN = "N";
                }
            } else {
                obs.HLN = "N";
            }
        }


    })

    const newObservationRecord = await CoreAPI.createNewObservation(newObservation).catch(err => res.status(500).json({ error: 'Create Observation Error', error_code: 'E4', message: err }))

    if (newObservationRecord) {
        res.status(200).json({ response: 'created' });
    } else {
        res.status(500).json({ error: 'Create Observation Error', error_code: 'E4' });
    }


};
// exports.getpatientinfo = getpatientinfo;