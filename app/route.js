module.exports = function (app) {

    var vitalsign = require('./observation/vitalsign');
    app.post('/interface/vitalsign/create', vitalsign.create);
    app.post('/interface/vitalsign/getpatientinfo', vitalsign.createNewVitalSign);

    var siu = require('./aria/siu');
    app.post('/siu/insert/createsiu', siu.createNewSIU);
    app.post('/siu/search', siu.searchSIU);
    app.post('/siu/todaysearch', siu.searchTodaySIU);

    var dft = require('./aria/dft');
    app.post('/dft/insert/createorder', dft.createNewOrder);

    var mdm = require('./aria/mdm');
    app.post('/mdm/insert/patientdocument', mdm.createNewPatientDocument);

    var shareapi = require('./shareapi/shareapi');
    app.post('/share/user/activate',shareapi.activateUser);
    app.post('/share/user/wellfare',shareapi.getwellfare);
    
    app.post('/share/user/update/password/inbound/kwanp',shareapi.updatePassword_inbound);
    app.post('/share/user/update/password/outbund/his',shareapi.updatePassword_outbound);

    app.post('/share/stock/get/batchno',shareapi.getBatchNo);
    
    var invent = require('./backoffice/inventory');
    app.post('/inventory/outbound/gettempsaletopatient', invent.getTempSaleToPatient);

    var billing = require('./backoffice/revenue');
    app.post('/billing/outbound/revenue', billing.revenue);
    app.post('/billing/outbound/ar', billing.ar);
    app.post('/billing/outbound/deposit', billing.deposit);
    app.post('/billing/outbound/doctorfree', billing.doctorfree);
}