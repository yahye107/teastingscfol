const MonthlyPayment = require("../models/MonthlyPayment");
const Student = require("../models/student");

const createPayment = async (req, res) => {
  try {
    const {
      student,
      month,
      year,
      academicYear,
      amount,
      dueDate,
      date,
      note,
      method,
      sentBy,
    } = req.body;

    const studentDoc = await Student.findById(student);
    if (!studentDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const expectedFee = studentDoc.monthlyPayment || 0;

    const existing = await MonthlyPayment.findOne({
      student,
      month,
      year,
      academicYear,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Payment for this month already exists",
      });
    }

    const dept = Math.max(0, expectedFee - amount);

    let status = "Unpaid";
    if (amount >= expectedFee) status = "Paid";
    else if (amount > 0) status = "Partial";

    const payment = new MonthlyPayment({
      student,
      month,
      year,
      academicYear,
      amount,
      status,
      dept,
      dueDate,
      date: date || new Date(),
      note,
      method,
      sentBy,
    });

    await payment.save();
    await Student.findByIdAndUpdate(student, {
      $push: { feeRecordes: payment._id },
    });
    return res.status(201).json({ success: true, data: payment });
  } catch (error) {
    console.error("Create payment error:", error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
const getAllStudentPayments = async (req, res) => {
  try {
    const records = await MonthlyPayment.find()
      .populate("student")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error("Get all student payments error:", error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getStudentPaymentsById = async (req, res) => {
  try {
    const studentId = req.params.id;

    const records = await MonthlyPayment.find({ student: studentId })
      .populate("student")
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error("Get student payment by ID error:", error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getPaymentsByClassId = async (req, res) => {
  try {
    const classId = req.params.classId;

    const students = await Student.find({ classId });
    const studentIds = students.map((s) => s._id);

    const records = await MonthlyPayment.find({ student: { $in: studentIds } })
      .populate("student")
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error("Get payments by class error:", error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
const updatePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;
    const {
      amount,
      dueDate,
      date,
      note,
      method,
      sentBy,
      month,
      year,
      academicYear,
    } = req.body;

    const payment =
      await MonthlyPayment.findById(paymentId).populate("student");
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment record not found" });
    }

    const expectedFee = payment.student?.monthlyPayment || 0;
    const updatedAmount = amount ?? payment.amount;
    const dept = Math.max(0, expectedFee - updatedAmount);

    let status = "Unpaid";
    if (updatedAmount >= expectedFee) status = "Paid";
    else if (updatedAmount > 0) status = "Partial";

    payment.amount = updatedAmount;
    payment.status = status;
    payment.dept = dept;
    payment.dueDate = dueDate ?? payment.dueDate;
    payment.date = date ?? payment.date;
    payment.note = note ?? payment.note;
    payment.method = method ?? payment.method;
    payment.sentBy = sentBy ?? payment.sentBy;

    // ✅ new fields:
    payment.month = month ?? payment.month;
    payment.year = year ?? payment.year;
    payment.academicYear = academicYear ?? payment.academicYear;

    await payment.save();

    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    console.error("Update payment error:", error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};
const deletePayment = async (req, res) => {
  try {
    const paymentId = req.params.id;

    const payment = await MonthlyPayment.findById(paymentId);
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    await MonthlyPayment.findByIdAndDelete(paymentId);

    return res
      .status(200)
      .json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Delete payment error:", error.message);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  createPayment,
  getAllStudentPayments,
  getStudentPaymentsById,
  deletePayment,
  updatePayment,
  getPaymentsByClassId,
};
