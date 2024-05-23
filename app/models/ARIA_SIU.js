var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SIUSchema = new Schema({
    siuId: String,
    patient: { type: Schema.ObjectId, ref: 'trn_Patient', required: true },
    clinic: { type: Schema.ObjectId, ref: 'Clinic', required: true },
    interface: {
        user: {
            name: String,
            code: String
        },
        doctor: {
            name: String,
            code: String
        },
        tenant: {
            name: String,
            code: String
        },
        clinic: {
            name: String,
            code: String
        }
    },
    appointmentDetail: {
        startDate: Date,
        endDate: Date,
        duration: Number
    },
    isComplete: { type: Boolean },
    isReject: { type: Boolean },
    status: { type: Schema.ObjectId, ref: 'Keylink' },
    message: String,
    comments: String,
    activity: String,
    activityCategory: String,
    auditlogs: [{}],
    doctor: { type: Schema.ObjectId, ref: "trn_User" },

    isActive: { type: Boolean, default: true, required: true },
    createDate: { type: Date, default: Date.now, required: true },
    createBy: { type: Schema.ObjectId, ref: "trn_User", required: true },
    modifyDate: { type: Date, default: Date.now, required: true },
    modifyBy: { type: Schema.ObjectId, ref: "trn_User", required: true },
    tenant: { type: Schema.ObjectId, ref: "Tenant", required: true },

});

module.exports = mongoose.model('inf_SIU', SIUSchema);

