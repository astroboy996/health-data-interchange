const moment = require('moment');
var winston = require('winston');

const CoreAPI = require('../coreapi');



exports.getTempSaleToPatient = async (req, res) => {
  try {
    const fromDate = new Date(moment(req.body.fromdate).startOf("day").toISOString());
    const toDate = new Date(moment(req.body.todate).endOf("day").toISOString())


    const [dispenseData, returnData] =
      await Promise.all([
        CoreAPI.getPharmacyDispenseByDate(fromDate, toDate),
        CoreAPI.getPharmacyDispenseReturnByDate(fromDate, toDate)
    ]);

    const sumData = [...dispenseData, ...returnData];

    let result = [];

    for (let i= 0; i < sumData.length; i++) {
      let temp = {};
      temp.BU_CODE = sumData[i].tenant.code;
      temp.TRANSACTION_DATE = moment(sumData[i].createDate).format("YYYY-MM-DD HH:mm");
      temp.HN = sumData[i].patient?.hn;
      temp.PATIENTCASE = sumData[i].patientRecord?.patientCase;
      
      if(sumData[i].dispenseRef){ // dispense return ISSPINT
        temp.TRANSACTION_TYPE = "ISSPINT";
        temp.ORDER_NO = sumData[i].dispenseReturnNumber;
        temp.ITENM_CODE = sumData[i].dispenseRef?.itemMaster ?? '';
        temp.STORE_CODE = "";
        temp.TO_STORE_CODE = sumData[i].inventoryStore?.code ?? sumData[i].dispenseRef?.floorStock?.code ?? '';
        temp.PATIENT_LOCATION_CODE = "";
        temp.RECEIVING_LOCATION_CODE = "";
        temp.EXPIRE_DATE = moment(sumData[i].dispenseRef?.expiryDate).format("YYYY-MM-DD HH:mm") ?? '';
        temp.BATCHID = sumData[i].dispenseRef?.batchId ?? '';
        temp.DOSE_UNIT = sumData[i].patientOrderItem?.doseUnit?.value ?? ''
        temp.QTY = sumData[i].returnQuantity;
        temp.REFERENCE_NO = sumData[i].dispenseRef?.dispenseNumber;
      }
      else{ // dispense RCVRET
        temp.TRANSACTION_TYPE = "RCVRET";
        temp.ORDER_NO = sumData[i].dispenseNumber;
        temp.ITENM_CODE = sumData[i].itemMaster ?? '';
        temp.STORE_CODE = sumData[i].floorStock?.code ?? '';
        temp.TO_STORE_CODE = "";
        temp.PATIENT_LOCATION_CODE = sumData[i].patientOrder?.orderRouteFrom?.code ?? '';
        temp.RECEIVING_LOCATION_CODE = sumData[i].patientOrder?.orderRouteTo?.code ?? '';
        temp.EXPIRE_DATE = moment(sumData[i].expiryDate).format("YYYY-MM-DD HH:mm")?? '';
        temp.BATCHID =  sumData[i].batchId ?? '';
        temp.DOSE_UNIT = sumData[i].patientOrderItem?.doseUnit?.value
        temp.QTY = sumData[i].dispenseQuantity
        temp.REFERENCE_NO = ""
      }

      
      result.push(temp)
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error });
  }
    
}