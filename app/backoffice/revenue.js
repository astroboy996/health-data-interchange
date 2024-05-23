const moment = require('moment');
var winston = require('winston');

const CoreAPI = require('../coreapi');

exports.revenue = async (req, res) => {
    try {
        const fromDate = new Date(moment(req.body.fromdate).startOf("day").toISOString());
        const toDate = new Date(moment(req.body.todate).endOf("day").toISOString())
        const isinvoice = false;

    const [revevueData] =
      await Promise.all([
        CoreAPI.getPatientBillByDateWithOption(fromDate, toDate, isinvoice)
    ]);

    const result = mapping_data_patientBill(revevueData, 'RECEIPT', res)
    
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error });
    }
}

exports.ar = async (req, res) => {
    try {
        const fromDate = new Date(moment(req.body.fromdate).startOf("day").toISOString());
        const toDate = new Date(moment(req.body.todate).endOf("day").toISOString())
        const isinvoice = true;

    const [arData] =
      await Promise.all([
        CoreAPI.getPatientBillByDateWithOption(fromDate, toDate, isinvoice)
    ]);
        const result = mapping_data_patientBill(arData, 'INVOICE', res)
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error });
    }
}

function mapping_data_patientBill(data, doctype, res){
    try {
        let return_data = [];
        for (let i = 0; i < data.length; i++) {
            let temp = {};
            temp.BU_CODE = data[i].tenant.code
            temp.BillNo = data[i].sequenceNumber;
            temp.BillDate = moment(data[i].billDate).format("YYYY-MM-DD HH:mm");
            if(data?.isCancelled){
                temp.BillType = "CANCEL";
                temp.REFERANCE_BILL = data[i].cancelFrom?.sequenceNumber ?? '';
            }
            else{
                temp.BillType = doctype;
                temp.REFERANCE_BILL = '';
            }
            
            temp.VN = data[i].patientRecord.visitId;
            temp.HN = data[i].patient.hn;
            temp.PatientName = buildPatientFullName(bill_data[i]?.patient);
            temp.PatientCase = data[i].patientRecord.patientCase;
            temp.NationalityCode = data[i].patient?.nationlity?.value ?? '';
            temp.CustomerCode = data[i].payorOffice?.code ?? '';
            temp.CustomerType = data[i].payorOffice?.type?.value ?? '';
    
            temp.TotalNetAmount = data[i].totalBillAmount ?? 0;
    
            temp.PaymentDetails = [];
            temp.ItemDetails = [];
            // Payment Details
            for (let j = 0; j < data[i].paymentDetails.length; j++) {
                let temp_payment = {}
                temp_payment.PaymentCode = data[i].paymentDetails[j].paymentCode?.code;
                temp_payment.Amount = data[i].paymentDetails[j].amount;
                temp_payment.Currency = data[i].paymentDetails[j].currency?.value ?? '';
                temp_payment.DR_OPD_GL = data[i].paymentDetails[j].paymentCode?.drOPDgl;
                temp_payment.DR_IPD_GL = data[i].paymentDetails[j].paymentCode?.drIPDgl;
                temp_payment.CR_OPD_GL = data[i].paymentDetails[j].paymentCode?.crOPDgl;
                temp_payment.CR_IPD_GL = data[i].paymentDetails[j].paymentCode?.crIPDgl;
    
                temp.PaymentDetails.push(temp_payment);
            }
            // Item Details
            for (let k = 0; k < data[i].patientBilledItems.length; k++) {
                let temp_item = {};
    
                temp_item.LineNo = k + 1;
                temp_item.LineItem = data[i].patientBilledItems[k].billingSubGroup?.name ?? '';
                temp_item.ItemCode = data[i].patientBilledItems[k].orderItem?.code ?? '';
                temp_item.ItemName = data[i].patientBilledItems[k].orderItem?.name ?? '';
                temp_item.PackageCode = data[i].patientBilledItems[k].patientPackage?.packageMaster?.code ?? '';  // กรณีเป็น package
                temp_item.Amount = data[i].patientBilledItems[k].netAmount ?? 0;
                temp_item.DiscountAmount = data[i].patientBilledItems[k].payorDiscount ?? 0;
                temp_item.NetAmount = data[i].patientBilledItems[k].totalNetAmount ?? 0;
                // df
                if(data[i].patientBilledItems[k]?.patientOrder?.orderGroupType == 'DOCTORFEE'){
                    if(data[i].patientRecord.patientCase == 'OPD'){
                        temp_item.DoctorShare = data[i].patientBilledItems[k].tariff?.opd?.doctorShare
                    }
                    else if(data[i].patientRecord.patientCase == 'IPD'){
                        temp_item.DoctorShare = data[i].patientBilledItems[k].tariff?.ipd?.doctorShare
                    }
                }
                else{
                    temp_item.DoctorShare = 0;
                }
                
                temp_item.DoctorCode = data[i].patientBilledItems[k].patientOrder?.doctor?.code ?? '';

                if(data[i].patientBilledItems[k].patientOrder?.doctor?.firstName){
                    temp_item.DoctorName = data[i].patientBilledItems[k].patientOrder?.doctor?.firstName + ' ' + data[i].patientBilledItems[k].patientOrder?.doctor?.lastName;
                }
                else{
                    temp_item.DoctorName = '';
                }
                
                temp_item.OrderTime = moment(data[i].patientBilledItems[k].patientOrder?.orderDate).format("YYYY-MM-DD HH:mm");

                temp.ItemDetails.push(temp_item);
            }
            return_data.push(temp);
        }

        return return_data;
    } catch (error) {
        console.log(error);
        return;
    }
    
}

exports.deposit = async (req, res) => {
    try {
        const fromDate = new Date(moment(req.body.fromdate).startOf("day").toISOString());
        const toDate = new Date(moment(req.body.todate).endOf("day").toISOString())

        // isUsed = [] เป็น array เก็บการใช้ deposit

    const [patientDepositData, depositData] =
      await Promise.all([
        CoreAPI.getPatientDepositByDateWithOption(fromDate, toDate, false),
        CoreAPI.getDepositByDate(fromDate, toDate),
    ]);

    const [data1, data2] = await Promise.all([
        mapping_data_patientdeposit(patientDepositData),
        mapping_data_deposit(depositData),
    ]);
    const result = [...data1, ...data2];

        res.status(200).json(result);
        // res.status(200).json(depositData);
    } catch (error) {
        res.status(500).json({ error: error });
    }
}

function mapping_data_patientdeposit(data){
    try {
        let return_data = [];
        for (let i = 0; i < data.length; i++) {
            let temp = {};
            temp.BU_CODE = data[i].tenant.code
            temp.DepositNo = data[i].sequenceNumber;
            temp.DepositDate = moment(data[i].depositDate).format("YYYY-MM-DD HH:mm");
            temp.BillType = "DEPOSIT";
            temp.DepositType = data[i].depositType?.value ?? "";
            temp.REFERANCE_BILL = "";
            
            temp.VN = data[i].patientRecord?.visitId ?? "";
            temp.HN = data[i].patient.hn;
            temp.PatientName = buildPatientFullName(bill_data[i]?.patient);
            temp.PatientCase = data[i].patientCase;
            temp.NationalityCode = data[i].patient?.nationlity?.value ?? '';
            temp.Currency = data[i].currency?.value ?? '';
            temp.PaymentCode = data[i].paymentCode?.code;
            temp.TotalNetAmount = data[i].paidAmount ?? 0;
            return_data.push(temp);
            
        }

        return return_data;
    } catch (error) {
        console.log(error);
        return;
    }
}

function mapping_data_deposit(data){
    try {
        let return_data = [];
        for (let i = 0; i < data.length; i++) {
            let temp = {};
            temp.BU_CODE = data[i].tenant.code
            temp.DepositNo = data[i].sequenceNumber;
            temp.DepositDate = moment(data[i].depositDate).format("YYYY-MM-DD HH:mm");
            if(data[i].isRefund){
                temp.BillType = "REFUND";
                temp.REFERANCE_BILL = '';
            }
            else if(data[i].isUsed){
                temp.BillType = "USEDEPOSIT";
                temp.REFERANCE_BILL = data[i].patientBill?.sequenceNumber ?? '';
            }
            else{
                temp.BillType = "";
                temp.REFERANCE_BILL = '';
            }
            
            temp.DepositType = data[i].depositType?.value ?? "";
            
            temp.VN = data[i].patientRecord?.visitId ?? "";
            temp.HN = data[i].patient?.hn ?? "";
            temp.PatientName = buildPatientFullName(bill_data[i]?.patient);
            temp.PatientCase = data[i].patientCase;
            temp.NationalityCode = data[i].patient?.nationlity?.value ?? '';
            temp.Currency = data[i].currency?.value ?? '';
            temp.PaymentCode = data[i].paymentCode?.code;
            temp.TotalNetAmount = data[i].paidAmount ?? 0;
            return_data.push(temp);
            
        }
        return return_data;
    } catch (error) {
        console.log(error);
        return;
    }
}

exports.doctorfree = async (req, res) => {

    try {
        const fromDate = new Date(moment(req.body.fromdate).startOf("day").toISOString());
        const toDate = new Date(moment(req.body.todate).endOf("day").toISOString())
    
        const [receipt, invoice] =
          await Promise.all([
            CoreAPI.getPatientBillByDateWithOption(fromDate, toDate, true),
            CoreAPI.getPatientBillByDateWithOption(fromDate, toDate, false)
        ]);
    
        const bill_data = unwindArray([...receipt, ...invoice].filter(e => e.isCancelled != true), 'patientBilledItems');

        const result = mapping_data_doctorfree(bill_data)
        res.status(200).json(result);


        // OrderNumber;
        // OrderDate;
        // HN;
        // VN;
        // PatientCase;
        // PatientName;
        // OrderCode;
        // OrderName;
        // OrderType;
        // PackageCode;
        // DoctorCode;
        // DoctorName;
        // BillDate;
        // BillNumber;
        // BillAmount;
        // ItemPrice;
        // Rigths;
        // LineItem;
        // Clinic;
        // OrderByCode;
        // OrderByName;
    } catch (error) {
        res.status(500).json({ error: error });
    }




}

function mapping_data_doctorfree(bill_data){
    let df_data = [];
    for (let i = 0; i < bill_data.length; i++) {
        let temp = {};
        if(bill_data[i]?.patientBilledItems?.chargeCodeType == 'PATIENTPACKAGE'){
            let doctorshare_package = bill_data[i]?.patientBilledItems?.patientPackage?.packageUsage?.find(doc => {
                if (doc._id.toString() == bill_data[i]?.patientBilledItems?.patientPackageUsage?.toString()) {
                    itemdetail = (doc.items || []).find((item) => {
                        if (item._id.toString() == bill_data[i]?.patientBilledItems?.patientPackageUsageItem && item.doctorItemShare > 0) {
                            doctorItemShare = item.doctorItemShare;
                            return true;
                        }
                        return false;
                    });
                    return !!itemdetail; 
                }
                return false;
            });

            if(doctorshare_package){
                temp.OrderNumber = bill_data[i]?.patientBilledItems?.patientOrder?.orderNumber;
                temp.OrderDate = moment(bill_data[i].patientBilledItems?.patientOrder?.orderDate).format("YYYY-MM-DD HH:mm");
                temp.HN = bill_data[i]?.patient?.hn;
                temp.VN = bill_data[i]?.patientRecord.visitId;
                temp.PatientCase = bill_data[i]?.patientRecord.patientCase;
                temp.PatientName = buildPatientFullName(bill_data[i]?.patient);
                temp.OrderCode = bill_data[i].patientBilledItems?.orderItem?.code;
                temp.OrderName = bill_data[i].patientBilledItems?.orderItem?.name;
                temp.OrderType = bill_data[i].patientBilledItems?.orderItem?.orderGroupType;
                temp.PackageCode = bill_data[i].patientBilledItems?.patientPackage?.packageMaster?.code ?? '';
                temp.DoctorCode = bill_data[i].patientBilledItems?.patientOrder?.doctor?.code;
                temp.DoctorLicense = bill_data[i].patientBilledItems?.patientOrder?.doctor?.license;
                temp.DoctorName = buildPatientFullName(bill_data[i].patientBilledItems?.patientOrder?.doctor);
                temp.BillDate = moment(bill_data[i].billDate).format("YYYY-MM-DD HH:mm");
                temp.BillNumber = bill_data[i].sequenceNumber;
                temp.BillAmount = bill_data[i].billAmount;
                temp.DoctorSharePrice = doctorshare_package ?? 0;
                temp.Rigths = bill_data[i].rights?.name;
                temp.LineItem = bill_data[i].patientBilledItems?.billingSubGroup?.name ?? '';;
                temp.Clinic = bill_data[i].patientBilledItems?.patientOrder?.orderRouteFrom ?? '';
                temp.OrderByCode = bill_data[i].patientBilledItems?.patientOrder?.createBy?.doctor?.code ?? '';
                temp.OrderByName = buildPatientFullName(bill_data[i].patientBilledItems?.patientOrder?.createBy);

                df_data.push(temp);
            }
        }
        else{
            let has_doctorshare = bill_data.filter( e => {
                return e?.patientBilledItems?.tariff?.opd?.doctorShare > 0 || e?.patientBilledItems?.tariff?.ipd?.doctorShare > 0 || 
                e?.patientBilledItems?.tariff?.emergency?.doctorShare > 0 || e?.patientBilledItems?.homemed?.opd?.doctorShare > 0 
            })

            if(has_doctorshare){
                temp.OrderNumber = bill_data[i]?.patientBilledItems?.patientOrder?.orderNumber;
                temp.OrderDate = moment(bill_data[i].patientBilledItems?.patientOrder?.orderDate).format("YYYY-MM-DD HH:mm");
                temp.HN = bill_data[i]?.patient?.hn;
                temp.VN = bill_data[i]?.patientRecord.visitId;
                temp.PatientCase = bill_data[i]?.patientRecord.patientCase;
                temp.PatientName = buildPatientFullName(bill_data[i]?.patient);
                temp.OrderCode = bill_data[i].patientBilledItems?.orderItem?.code;
                temp.OrderName = bill_data[i].patientBilledItems?.orderItem?.name;
                temp.OrderType = bill_data[i].patientBilledItems?.orderItem?.orderGroupType;
                temp.PackageCode = bill_data[i].patientBilledItems?.patientPackage?.packageMaster?.code ?? '';
                temp.DoctorCode = bill_data[i].patientBilledItems?.patientOrder?.doctor?.code;
                temp.DoctorLicense = bill_data[i].patientBilledItems?.patientOrder?.doctor?.license;
                temp.DoctorName = buildPatientFullName(bill_data[i].patientBilledItems?.patientOrder?.doctor);
                temp.BillDate = moment(bill_data[i].billDate).format("YYYY-MM-DD HH:mm");
                temp.BillNumber = bill_data[i].sequenceNumber;
                temp.BillAmount = bill_data[i].billAmount;

                if(data[i].patientRecord.patientCase == 'OPD'){
                    temp.DoctorSharePrice = data[i].patientBilledItems?.tariff?.opd?.doctorShare
                }
                else if(data[i].patientRecord.patientCase == 'IPD'){
                    temp.DoctorSharePrice = data[i].patientBilledItems?.tariff?.ipd?.doctorShare
                }
                else{
                    temp.DoctorSharePrice = 0
                }
                
                temp.Rigths = bill_data[i].rights?.name;
                temp.LineItem = bill_data[i].patientBilledItems?.billingSubGroup?.name ?? '';;
                temp.Clinic = bill_data[i].patientBilledItems?.patientOrder?.orderRouteFrom ?? '';
                temp.OrderByCode = bill_data[i].patientBilledItems?.patientOrder?.createBy?.code ?? '';
                temp.OrderByName = buildPatientFullName(bill_data[i].patientBilledItems?.patientOrder?.createBy);

                df_data.push(temp);
            }
        }
        
    }
}


function unwindArray(dataArray, property) {
    const unwoundArray = [];
    dataArray.forEach(data => {
        data[property].forEach(item => {
            const newData = {...data};
            newData[property] = item;
            unwoundArray.push(newData);
        });
    });
    return unwoundArray;
}

function buildPatientFullName(patient) {
    try {
        if (patient && typeof patient == "object") {
            let fullName = "";
            if (patient.title) {
                fullName += patient.title.descriptionTH;
            }
            if (patient.firstName) {
                fullName += " " + patient.firstName;
            }
            if (patient.middleName) {
                fullName += " " + patient.middleName;
            }
            if (patient.lastName) {
                fullName += " " + patient.lastName;
            }
            return fullName;
        }
    } catch (error) {
        console.log(error);
        return "";
    }
};