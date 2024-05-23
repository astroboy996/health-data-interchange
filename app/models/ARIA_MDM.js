var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MDMSchema = new Schema({
    patient: { type: Schema.ObjectId, ref: 'trn_Patient' },
    clinic: { type: Schema.ObjectId, ref: 'Clinic' },
    doctor: { type: Schema.ObjectId, ref: 'trn_User' },
    patientDocument: { type: Schema.ObjectId, ref: 'trn_PatientDocument' },
    filePath: String,
    interface: { type: Object },

    isActive: { type: Boolean, default: true, required: true },
    createDate: { type: Date, default: Date.now, required: true },
    createBy: { type: Schema.ObjectId, ref: "trn_User", required: true },
    modifyDate: { type: Date, default: Date.now, required: true },
    modifyBy: { type: Schema.ObjectId, ref: "trn_User", required: true },
    tenant: { type: Schema.ObjectId, ref: "Tenant", required: true },

});

module.exports = mongoose.model('inf_MDM', MDMSchema);

