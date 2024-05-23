const mongoose = require("mongoose");
const moment = require("moment");
const ARIA_SIU = require("../models/ARIA_SIU");
const CoreAPI = require("../coreapi");
const MobileAPI = require("../mobileapi");

const TENANTCODE = "KARI";

exports.searchSIU = async (req, res) => {
  var query = {
    isActive: true,
  };

  let { patient, querydate } = req.body;

  if (patient) {
    query.patient = new mongoose.Types.ObjectId(patient);
  }

  if (querydate) {
    query["appointmentDetail.startDate"] = {
      $gt: new Date(moment(req.body.querydate).startOf("day").toISOString()),
      // $lt: new Date(moment(req.body.querydate).endOf('day').toISOString())
    };
  }
  try {
    if (!patient) {
      throw new Error("patient id required");
    }

    let result = await mongoose.connection
      .collection("inf_sius")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "trn_patients",
            localField: "patient",
            foreignField: "_id",
            as: "patient",
          },
        },
        { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "clinics",
            localField: "clinic",
            foreignField: "_id",
            as: "clinic",
          },
        },
        { $unwind: { path: "$clinic", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "trn_users",
            localField: "doctor",
            foreignField: "_id",
            as: "doctor",
          },
        },
        { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "trn_users",
            localField: "modifyBy",
            foreignField: "_id",
            as: "modifyBy",
          },
        },
        { $unwind: { path: "$modifyBy", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "keylinks",
            localField: "status",
            foreignField: "_id",
            as: "status",
          },
        },
        { $unwind: { path: "$status", preserveNullAndEmptyArrays: true } },
      ])
      .toArray();

    res.status(200).json({ siudata: result });
  } catch (error) {
    res.status(500).json({ error: "ERRORS.RECORDNOTFOUND" });
  }
};

exports.searchTodaySIU = async (req, res) => {
  var query = {
    isActive: true,
    isComplete: false,
  };

  let { patient, querydate } = req.body;

  if (patient) {
    query.patient = mongoose.Types.ObjectId(patient);
  }

  if (querydate) {
    query["appointmentDetail.startDate"] = {
      $gt: new Date(moment(req.body.querydate).startOf("day").toISOString()),
      $lt: new Date(moment(req.body.querydate).endOf("day").toISOString()),
    };

    // query.createDate = {
    //     $lt: new Date(moment(req.body.querydate).startOf('day').toISOString())
    // }
  }

  try {
    let result = await mongoose.connection
      .collection("inf_sius")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "trn_patients",
            localField: "patient",
            foreignField: "_id",
            as: "patient",
          },
        },
        { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "clinics",
            localField: "clinic",
            foreignField: "_id",
            as: "clinic",
          },
        },
        { $unwind: { path: "$clinic", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "trn_users",
            localField: "doctor",
            foreignField: "_id",
            as: "doctor",
          },
        },
        { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "trn_users",
            localField: "modifyBy",
            foreignField: "_id",
            as: "modifyBy",
          },
        },
        { $unwind: { path: "$modifyBy", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "keylinks",
            localField: "status",
            foreignField: "_id",
            as: "status",
          },
        },
        { $unwind: { path: "$status", preserveNullAndEmptyArrays: true } },
      ])
      .toArray();

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "ERRORS.RECORDNOTFOUND" });
  }
};

exports.createNewSIU = async (req, res) => {
  const jsonQuery = JSON.parse(req.query.report);

  const {
    patient,
    user,
    clinic,
    tenant,
    appointment,
    activity,
    activityCategory,
    comments,
    status,
    siuId,
    message,
    doctor,
  } = jsonQuery;
  let bookingStatus;
  try {
    let existSIU = await ARIA_SIU.findOne({ siuId: siuId, isActive: true });
    bookingStatus = await CoreAPI.getKeyLinkByGroup("BOOKINGSTATUS");

    const [patientData, userData, doctorData, clinicData, tenantData] =
      await Promise.all([
        CoreAPI.getPatientByHN(patient?.hn),
        CoreAPI.getUserByCode(user?.code),
        CoreAPI.getUserByCode(doctor?.code),
        CoreAPI.getClinicByCode(clinic?.code),
        // CoreAPI.getTenantByCode(tenant?.code)
        CoreAPI.getTenantByCode(TENANTCODE),
      ]);

    if (!patientData?.hn) {
      throw new Error("Patient not found");
    }

    if (!clinicData?.code) {
      throw new Error("Clinic not found");
    }

    if (!tenantData?.code) {
      throw new Error("Tenant not found");
    }

    let siu;
    let newData = {
      patient: patientData,
      interface: {
        user,
        doctor,
        tenant,
        clinic,
      },
      clinic: clinicData,
      tenant: tenantData,
      appointmentDetail: appointment,
      activity,
      comments,
      status,
      siuId,
      message,
      activityCategory,
      user: userData,
      doctor: doctorData,
    };
    try {
      let siuObject = existSIU ? new ARIA_SIU(existSIU) : new ARIA_SIU();
      siu = await buildSIU(siuObject, newData);
    } catch (error) {
      throw error;
    }
    let result = await siu.save();
    let doctorName = doctorData
      ? `${doctorData.firstName} ${doctorData.lastName}`
      : "";

    try {
      insertMobileAppointment(siu, patientData.pid, clinicData.name, doctorName);
    } catch (error) {
      console.log(error)
    }

    console.log(
      `${moment().format("DD/MM/YYYY HH:mm:ssZ")} SIU (${result?.siuId}) : ${
        result?.message
      }`
    );
    return res.status(200).json({ result });
  } catch (error) {
    let errMsg = error.message ?? error;
    console.log(errMsg);
    return res.status(500).json({ error: errMsg });
  }

  async function buildSIU(
    SIUObject,
    {
      _id,
      patient,
      interface,
      clinic,
      tenant,
      appointmentDetail,
      activity,
      activityCategory,
      comments,
      status,
      siuId,
      isComplete,
      isReject,
      createDate,
      createBy,
      user,
      doctor,
      message,
    }
  ) {
    try {
      if (_id) {
        SIUObject._id = _id;
      }
      let { auditlogs, ...backup } = SIUObject.toObject();
      SIUObject.auditlogs.push(backup);
      SIUObject.siuId = siuId;
      SIUObject.patient = patient;
      SIUObject.interface = interface;
      SIUObject.clinic = clinic;
      SIUObject.appointmentDetail = {
        startDate: moment(
          appointmentDetail.startDate + "+0700",
          "YYYYMMDDHHmmssZZ"
        ).toDate(),
        endDate: moment(
          appointmentDetail.endDate + "+0700",
          "YYYYMMDDHHmmssZZ"
        ).toDate(),
        duration: appointmentDetail.duration,
      };
      let statusObj = getStatusId(status);
      SIUObject.status = statusObj;
      SIUObject.comments = comments;
      SIUObject.activity = activity;
      SIUObject.activityCategory = activityCategory;
      SIUObject.doctor = doctor;
      SIUObject.message = message;

      SIUObject.isComplete = statusObj?.value == "BOOKINGSTATUS04"; //TODO TBD
      SIUObject.isReject = ["BOOKINGSTATUS05", "BOOKINGSTATUS03"].includes(
        statusObj?.value ?? ""
      ); //TODO TBD

      SIUObject.tenant = tenant;
      SIUObject.isActive = true;
      SIUObject.createDate = SIUObject?.createDate ?? createDate ?? new Date();
      SIUObject.createBy =
        SIUObject?.createBy ??
        createBy ??
        user?._id ??
        user ??
        req.session.useruid;
      SIUObject.modifyDate = new Date();
      SIUObject.modifyBy = user?._id ?? user ?? req.session.useruid;

      if (SIUObject?.errors) {
        throw new Error(SIUObject.errors);
      }
      return SIUObject;
    } catch (error) {
      console.log(error);
    }
  }

  async function insertMobileAppointment(siu, pid, clinic, doctorName) {
    try {
      let payload = {
        bu: TENANTCODE,
        patientid: pid,
        apptdate: siu.appointmentDetail.startDate,
        clinic: clinic,
        apptsubject: `${siu.activityCategory} - ${siu.activity}`,
        apptcomment: siu.comments,
        appttype: siu.activityCategory,
        apptinstruction: siu.activity,
        careprovider: doctorName,
        isrequest: "S",
      };

      MobileAPI.insert_mobile_booking(payload);
    } catch (error) {
      console.log(error);
    }
  }

  function getStatusId(status) {
    let booking = bookingStatus.find((item) => {
      if (mongoose.Types.ObjectId.isValid(status)) {
        return item._id.toString() === status;
      }
      return (item.extra ?? "").includes(status);
    });

    if (booking?._id) {
      return booking;
    } else {
      return bookingStatus[0];
    }
  }
};
