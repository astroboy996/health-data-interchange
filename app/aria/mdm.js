const moment = require('moment')
const MDM = require('../models/ARIA_MDM');
const CoreAPI = require('../coreapi');
const FILEAPI = require('../fileapi');

exports.createNewPatientDocument = async function (req, res) {
    const { clinic, patient, doctor, document } = req.body;

    try {
        const [patientData, doctorData, clinicData, patientRecordData, createUser, authoredUser, approveUser] =
            await Promise.all([
                CoreAPI.getPatientByHN(patient?.hn),
                CoreAPI.getUserByCode(doctor?.code),
                CoreAPI.getClinicByCode(clinic?.code),
                CoreAPI.getPatientRecordByVisitIdAndHN(patient?.visitID, patient?.hn),
                CoreAPI.getUserByCode(document?.createdBy?.code),
                CoreAPI.getUserByCode(document?.authoredBy?.code),
                CoreAPI.getUserByCode(document?.approvedBy?.code),
            ]);

        if (!patientData) {
            throw new Error('Patient not found : HN ' + patient?.hn);
        }

        if (!doctorData) {
            throw new Error('Doctor not found : CODE ' + doctor?.code);
        }

        if (document?.createdBy?.code && !createUser) {
            throw new Error('Create user not found : CODE ' + document?.createdBy?.code);
        }

        if (document?.authoredBy?.code && !authoredUser) {
            throw new Error('Authored user not found : CODE ' + document?.authoredBy?.code);
        }

        if (document?.approvedBy?.code && !approveUser) {
            throw new Error('Approve user not found : CODE ' + document?.approvedBy?.code);
        }

        if (document) {
            let { fileContent, ..._doc } = document;
            let newMDM = new MDM({
                tenant: patientData?.tenant,
                createBy: createUser?._id,
                createDate: new Date(),
                modifyBy: createUser?._id,
                modifyDate: new Date(),
                patient: patientData?._id,
                clinic: clinicData?._id,
                doctor: doctorData?._id,
                // patientDocument: newPatientDoc?._id,
                // filePath: filePath,
                interface: { clinic, patient, doctor, document: _doc }
            });

            if ((document?.status ?? '').toLowerCase() == 'approved') {
                let { filePath } = await FILEAPI.uploadMDM(`${document.number}_${document.name}`, document.fileType, document.fileContent);

                let newPatientDoc = await CoreAPI.upsertPatientDocument(
                    patientData,
                    patientRecordData,
                    clinicData,
                    'INTERFACE',
                    document.name,
                    document.fileType,
                    filePath,
                    patientData?.tenant,
                    moment(document.createdAt + "+0700", "YYYYMMDDHHmmssZZ").toDate(),
                    createUser,
                    moment(document.modifiedAt + "+0700", "YYYYMMDDHHmmssZZ").toDate(),
                    approveUser ?? authoredUser ?? createUser
                );

                if (newPatientDoc?._id) {
                    newMDM.patientDocument = newPatientDoc?._id;
                    newMDM.filePath = filePath;
                    await newMDM.save();
                    res.status(200).json({ patientDocument: newPatientDoc?._id });
                }
            } else {
                await newMDM.save();
                res.status(200).json({ newMDM: newMDM?._id ?? 'Create MDM Success' });
            }

        } else {
            throw new Error('No document found');
        }
    } catch (error) {
        res.status(500).json(error?.message || JSON.stringify(error));
    }

}