// const User = require('../model/healthchain-schema/enterprise/user');
// const Department = require('../model/healthchain-schema/enterprise/department');
// const OrderItem = require('../model/healthchain-schema/ordermanagement/orderitem');
// const PatientVisit = require('../model/healthchain-schema/patient/trn_visitdetail');
const CoreAPI = require('../coreapi');


const moment = require('moment');
var winston = require('winston');

exports.createorder = async (req, res) => {

    try {

        var jsonQuery = JSON.parse(req.query.report);

        req.body = jsonQuery;

        await Promise.all([
            getPatientVisit(req),
            getDepartment(req),
            getUser(req),
            getOrderItemDetail(req)
                
        ]);

        await updateVisit(req);

        const [orderRoute, tariff]= await Promise.all([
            CoreAPI.getOrderRoute({
                orderitemuid: req.body.orderitem._id,
                departmentuid: req.body?.department?._id || req.body.mainclinic.departmentuid._id,
                entypeuid: req.session.reference.ENTYPE.ENTYPE1,
                orguid: req.body.patientvisit.orguid
            }),
            CoreAPI.getTariff({
                orderitemuid: req.body.orderitem._id,
                quantity: req.body.qty,
                isnoned: req.body.orderitem.isnoned,
                ordertypecode: 'ORDTYP1',
                departmentuid: req.body?.department?._id || req.body.mainclinic.departmentuid._id,
                patientvisituid: req.body.patientvisit._id,
                orguid: req.body.patientvisit.orguid
            })]
        );

        req.body.orderroute = orderRoute;
        req.body.tariff = tariff;

        const patientorder = getPatientOrderObject(req);

        let response = await CoreAPI.createOrder({
            entypeuid: patientorder.entypeuid,
            orderfromdepartmentuid: patientorder.orderdepartmentuid,
            patientuid: patientorder.patientuid,
            patientvisituid: patientorder.patientvisituid,
            patientorder: [patientorder],
            orguid: req.body.patientvisit.orguid,
            useruid: patientorder.orderinguseruid,
            isdft: true
        });

        if (response) {
            res.status(200).json({ message: 'ok', ordernumber: response?.data?.orderNumbers });
        }
        else {
            res.status(500).json({ message: 'Create Order Error' });
        }

    } catch (error) {
        res.status(500).json(error);
    }


}

function getPatientVisit(req) {
    return new Promise(async (resolve, reject) => {

        req.body.patientvisit = await PatientVisit.findOne({ statusflag: 'A', visitid: req.body.visitid }).populate('clinics.departmentuid', 'code').lean().exec();

        if (!req.body.patientvisit) {
            reject({ message: 'not found visit id.' });
        }
        else {
            req.body.mainclinic = getMainClinic(req.body.patientvisit, req.body.deptcode);
            resolve();
        }
    });
}

function getMainClinic(patientvisit, departmentcode) {

    let clinic = patientvisit.clinics.find(e => e.departmentuid.code == departmentcode);

    if (!clinic) {
        clinic = patientvisit.clinics.find(e => e.isprimarycareprovider);
    }

    if (!clinic) {
        clinic = patientvisit.clinics[0];
    }

    return clinic;
}

function getDepartment(req) {
    return new Promise(async (resolve, reject) => {

        req.body.department = await Department.findOne({ statusflag: 'A', code: req.body.deptcode }).lean().exec();
        resolve();
    });
}

function getUser(req) {
    return new Promise(async (resolve, reject) => {
        req.body.user = await User.findOne({ code: req.body.usercode }).lean().exec();
        resolve();
    })
}

function getOrderItemDetail(req) {
    return new Promise(async (resolve, reject) => {
        req.body.orderitem = await OrderItem.findOne({ code: req.body.ordercode, statusflag: 'A' }).lean();
        if (!req.body.orderitem) {
            reject({ message: 'not found orderitem' })
        }
        else {
            resolve();
        }

    });
}

function getPatientOrderObject(req) {

    try {
        let patientorder = {};

    patientorder.entypeuid = req.session.reference.ENTYPE.ENTYPE1;
    patientorder.ordertypeuid = req.session.reference.ORDTYP.ORDTYP1;
    patientorder.orderpriorityuid = req.session.reference.ORDPRY.ORDPRY1;

    patientorder.patientuid = req.body.patientvisit.patientuid;
    patientorder.patientvisituid = req.body.patientvisit._id;
    patientorder.orderdate = new Date(moment(req.body.orderdate, "YYYYMMDDHHmmss"));

    patientorder.careprovideruid = req.body.mainclinic.careprovideruid;
    patientorder.orderdepartmentuid = req.body?.department?._id || req.body.mainclinic.departmentuid._id;
    patientorder.userdepartmentuid = req.body?.department?._id || req.body.mainclinic.departmentuid._id;
    patientorder.orderinguseruid = req.body?.user?._id || req.session.useruid;
    patientorder.ordercattype = req.body.orderitem.ordercattype;


    patientorder.orderitemuid = req.body.orderitem._id;
    patientorder.orderitemname = req.body.orderitem.name;
    patientorder.billingtype = "ON RAISING";
    patientorder.startdate = new Date(moment(req.body.orderdate, "YYYYMMDDHHmmss"));
    patientorder.enddate = new Date(moment(req.body.orderdate, "YYYYMMDDHHmmss").add(1, 'days'));
    patientorder.statusuid = req.session.reference.ORDSTS.ORDSTS1;
    patientorder.careprovideruid = req.body?.user?._id;
    patientorder.isactive = true;
    patientorder.quantity = req.body.qty;
    patientorder.orderdate = new Date(moment(req.body.orderdate, "YYYYMMDDHHmmss"));
    patientorder.priorityuid = req.session.reference.ORDPRY.ORDPRY1;


    if (req.body.orderroute) {
        patientorder.invstoreuid = req.body.orderroute?.storeuid?._id;
        patientorder.ordertodeptuid = req.body.orderroute?.ordertodeptuid?._id;
    }

    if (req.body.tariff) {
        patientorder.patientvisitpayoruid = req.body.tariff.visitpayoruid;
        patientorder.unitprice = req.body.tariff.unitprice;
        patientorder.unitpayordiscount = (req.body.tariff.payordiscount / req.body.qty);
        patientorder.payordiscount = req.body.tariff.payordiscount;
        patientorder.payorCondDiscountAmount = req.body.tariff.payorCondDiscountAmount;
        patientorder.payorCondDiscountPercentage = req.body.tariff.payorCondDiscountPercentage;
        patientorder.chargecode = req.body.tariff.chargecode;
        patientorder.tariffuid = req.body.tariff.tariffuid;
        patientorder.maximumtariffprice = req.body.tariff.maximumtariffprice;
        patientorder.minimumtariffprice = req.body.tariff.minimumtariffprice;
        patientorder.canoverrideprice = req.body.tariff.canoverrideprice;

        if (req.body.tariff.duration != null && req.body.tariff.duration > 0) {
            patientorder.maxduration = req.body.tariff.duration;
        }
        if (req.body.tariff.maxquantity != null && req.body.tariff.maxquantity > 0) {
            patientorder.maxquantity = req.body.tariff.maxquantity;
        }
        if (req.body.tariff.maxprice != null && req.body.tariff.maxprice > 0) {
            patientorder.maxprice = req.body.tariff.maxprice;
        }
    }

    return patientorder;
    } catch (error) {
        console.log(error)
    }
    

}

function updateVisit(req){
    return new Promise(async (resolve, reject) => {
        var error = null;
        var response = await PatientVisit.update({
            _id: req.body.patientvisit?._id,
            
        }, 
        {
            $set: {
                'isdft': true,
                'modifiedby': req.session.useruid,
                'modifiedat': Date.now()
            }
        }, 
        {
            new: false,
            upsert: true
        }).catch(err => error = err);

        if (error) {
            reject({ message: 'error update visit' })
        }
        else {
            resolve();
        }
    });
}

exports.createNewOrder = async (req, res) => {
    try {
        let jsonQuery = JSON.parse(req.query.report);
        let { mrn, visitid, deptcode, usercode, ordercode, qty, orderdate, ICDs, exam, CC, impression, icd9 } = jsonQuery;

        let [patientRecord, user, orderItem] = await Promise.all([
            CoreAPI.getPatientRecordByVisitIdAndHN(visitid, mrn),
            CoreAPI.getUserByCode(usercode),
            CoreAPI.getOrderItemByCode(ordercode)
        ])

        if (patientRecord?._id) {
            if (!orderItem) {
                throw new Error(`Order Item Code: ${ordercode} not found!`);
            }

            let patientOrderItem = {
                orderItem,
                orderStatus: 1,
                orderPriority: 'ROUTINE',
                quantity: qty,
                orderGroup: orderItem.orderGroup,
                orderGroupType: orderItem.orderGroupType,
                orderSubGroup: orderItem.orderSubGroup,
                startDate: moment(orderdate + "+0700", 'YYYYMMDDHHmmssZZ').toDate(),
            }

            let visitClinic = (patientRecord.clinics ?? []).find(clinic => clinic.clinic?.code == deptcode);

            if (!visitClinic) {
                throw new Error(`Clinic Code: ${deptcode} not found in this visit!`);
            }

            let diagTypes = await CoreAPI.getKeyLinkByGroup('DIAGTYPE');

            if (ICDs?.length) {
                for (let index = 0; index < ICDs.length; index++) {
                    const element = ICDs[index];
                    if ((element?.scheme ?? '').includes('10')) {
                        let icd10s = await CoreAPI.searchICD10(element.name)

                        if (icd10s?.length) {
                            let icd10 = icd10s[0];
                            let patientICD10 = {
                                icd10,
                                isPrimary: element.isPrimary == '1',
                                patient: patientRecord.patient,
                                patientRecord: patientRecord._id,
                                doctor: visitClinic?.doctor,
                                clinic: visitClinic?.clinic,
                                createBy: user?._id ?? req.session.useruid,
                                createDate: moment(element.date + "+0700", 'YYYYMMDDHHmmssZZ').toDate(),
                                modifyBy: user?._id ?? req.session.useruid,
                                modifyDate: moment(element.date + "+0700", 'YYYYMMDDHHmmssZZ').toDate(),
                                tenant: '65797a62b4c45a9c57642bef',
                                severity: diagTypes.find(d => {
                                    if (element.isPrimary == '1') {
                                        return d.value == 'DIAGTYPE01'
                                    } else {
                                        return d.value == 'DIAGTYPE02'
                                    }
                                })
                            }

                            let results = await CoreAPI.createPatientICD10(patientICD10);
                            if (results) {
                                console.log('create patient icd10 success!');
                            }
                        } else {
                            console.log('ICD10 not found!');
                        }

                    }

                }

            }

            if(exam?.length){
                visitClinic.physicalExam = exam
                  .map((e) => `${e.type} : ${e.result}`)
                  .join(", ");
            }

            if(CC?.length){
                let patientCCHPI = await CoreAPI.getPatientCCHPI(
                  patientRecord._id,
                  user?._id ?? req.session.useruid
                );

                if(!patientCCHPI){
                    patientCCHPI = {
                      patient: patientRecord.patient,
                      patientrecord: patientRecord._id,
                      cc: CC.join(", "),
                      doctor: user?._id ?? req.session.useruid,
                      createBy: user?._id ?? req.session.useruid,
                      createDate:new Date(),
                      modifyBy: user?._id ?? req.session.useruid,
                      modifyDate: new Date(),
                      tenant: "65797a62b4c45a9c57642bef",
                    };
                }
                else{
                    patientCCHPI.cc = patientCCHPI.cc + `, ${CC.join(', ')}`; 
                }

                let results = await CoreAPI.upsertPatientCCHPI(patientCCHPI);
                if (results) {
                  console.log("create patient CC HPI success!");
                }

            }

            let rights = (visitClinic.clinicRights ?? []).find(r => r.rank == 1)?.rights;
            let selectedRightId = rights?._id ?? rights

            let patientOrder = await CoreAPI.createNewOrder({
                patientRecord: patientRecord._id,
                patient: patientRecord.patient,
                patientCase: patientRecord.patientCase,
                clinic: visitClinic.clinic?._id,
                patientOrderItem,
                isOnBehalf: false,
                selectedRightId,
                user: user?._id ?? req.session.useruid,
                tenant: '65797a62b4c45a9c57642bef'
            })

            if (patientOrder) {
                if (!patientRecord?.isDFT) {
                    patientRecord.isDFT = true;
                }

                patientRecord.modifyDate = new Date();
                patientRecord.modifyBy = user?._id ?? req.session.useruid;

                await CoreAPI.updatePatientRecord(patientRecord);
                console.log('update patient record success!');
                return res.status(200).json({ data: patientOrder });
            }


        } else {
            throw new Error(`Visit ID: ${visitid} not found!`);
        }
        console.log(jsonQuery);
    } catch (error) {
        //TODO handle error
        console.log(error);
        return res.status(500).json({ error: error.message ?? error });
    }
}