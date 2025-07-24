const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Student = require("../models/student");
const Classroom = require("../models/classroom");
const Parent = require("../models/parents");
const { generateEasyPassword } = require("../utils/passwordgenetar");
// const { sendCredentialsEmail } = require("../utils/emailService");

// Create a student
const createStudent = async (req, res) => {
  try {
    const {
      fullName,
      email,
      dob,
      age,
      gender,
      classId,
      parentId,
      contact,
      address,
      previousSchool,
      emergencyContact,
      monthlyPayment,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Student already exists." });
    const baseUsername = fullName.split(" ")[0].toLowerCase();
    let username = baseUsername;
    let counter = 1;

    const password = generateEasyPassword(username);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      username,
      role: "student",
      rawPassword: password,
    });

    const student = await Student.create({
      user: user._id,
      admissionNumber: "ADM" + Date.now().toString().slice(-6),
      dob,
      age,
      gender,
      contact,
      address,
      previousSchool,
      emergencyContact,
      monthlyPayment,
      classId,
      parent: parentId,
    });

    // Add student to classroom and parent
    await Classroom.findByIdAndUpdate(classId, {
      $push: { students: student._id },
    });
    if (parentId) {
      await Parent.findByIdAndUpdate(parentId, {
        $push: { children: student._id },
      });
    }
    await User.findByIdAndUpdate(user._id, {
      studentProfile: student._id,
    });
    // await sendCredentialsEmail(email, fullName, password);

    res.status(201).json({ message: "Student created successfully", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update student
// Update student
const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      fullName,
      email,
      dob,
      age,
      gender,
      contact,
      address,
      previousSchool,
      emergencyContact,
      monthlyPayment,
      classId,
      parentId,
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Track old classId before updating
    const oldClassId = student.classId?.toString();
    const newClassId = classId;

    // Update user
    const user = await User.findById(student.user);
    if (user) {
      user.fullName = fullName || user.fullName;
      user.email = email || user.email;
      await user.save();
    }

    // Update student info
    student.dob = dob || student.dob;
    student.age = age || student.age;
    student.gender = gender || student.gender;
    student.contact = contact || student.contact;
    student.address = address || student.address;
    student.previousSchool = previousSchool || student.previousSchool;
    student.emergencyContact = emergencyContact || student.emergencyContact;
    student.monthlyPayment =
      monthlyPayment !== undefined ? monthlyPayment : student.monthlyPayment;
    student.parent = parentId || student.parent;

    // Handle class change
    if (newClassId && newClassId !== oldClassId) {
      // Remove from old class
      if (oldClassId) {
        await Classroom.findByIdAndUpdate(oldClassId, {
          $pull: { students: student._id },
        });
      }

      // Add to new class
      await Classroom.findByIdAndUpdate(newClassId, {
        $addToSet: { students: student._id },
      });

      student.classId = newClassId;
    }

    await student.save();

    res.status(200).json({ message: "Student updated successfully", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Remove student from classroom and parent
    await Classroom.findByIdAndUpdate(student.classId, {
      $pull: { students: studentId },
    });
    if (student.parent) {
      await Parent.findByIdAndUpdate(student.parent, {
        $pull: { children: studentId },
      });
    }

    // Delete user and student records
    await User.findByIdAndDelete(student.user);
    await Student.findByIdAndDelete(studentId);

    res.status(200).json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate({
        path: "user",
        select: "fullName email role rawPassword createdAt", // Include only necessary user fields
      })
      .populate({
        path: "classId",
        select: "name section timetables", // Select only the fields you need from the Classroom model
      })
      .populate({
        path: "parent",
        populate: {
          path: "user", // Populating the 'user' field in the parent
          select: "fullName email role", // Select only necessary user fields from the parent
        },
        select: "fullName contact email", // Select only the fields you need from the Parent model
      })
      .select(
        "dob age gender contact address previousSchool monthlyPayment admissionNumber emergencyContact"
      );

    res
      .status(200)
      .json({ message: "All students fetched successfully", students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const makePayment = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { amount, senderNumber, method } = req.body;

    const student = await Student.findById(studentId);
    if (!student)
      return res.status(404).json({ message: "Student not found." });

    let remainingPayment = amount;
    const currentDate = new Date();

    // Sort balances by due date
    student.monthlyBalances.sort((a, b) => a.dueDate - b.dueDate);

    // Pay past due balances first
    for (const balance of student.monthlyBalances) {
      if (remainingPayment <= 0) break;
      const dueDate = new Date(balance.dueDate);
      if (dueDate > currentDate) continue;

      const debt = balance.dueAmount - balance.paidAmount;
      if (debt <= 0) continue;

      const payment = Math.min(debt, remainingPayment);
      balance.paidAmount += payment;
      remainingPayment -= payment;

      if (payment === debt) {
        balance.paymentDate = currentDate;
        balance.senderNumber = senderNumber;
        balance.method = method;
      }
    }

    // Pay future months
    if (remainingPayment > 0) {
      let nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(5);

      while (remainingPayment > 0) {
        const monthName = nextMonth.toLocaleString("default", {
          month: "long",
        });
        const year = nextMonth.getFullYear();

        let balance = student.monthlyBalances.find(
          (b) => b.month === monthName && b.year === year
        );

        if (!balance) {
          balance = {
            month: monthName,
            year: year,
            dueAmount: student.monthlyPayment,
            paidAmount: 0,
            dueDate: new Date(year, nextMonth.getMonth(), 5),
            paymentDate: null,
            senderNumber: null,
            method: null,
          };
          student.monthlyBalances.push(balance);
        }

        const maxPay = balance.dueAmount - balance.paidAmount;
        const payment = Math.min(maxPay, remainingPayment);
        balance.paidAmount += payment;
        remainingPayment -= payment;

        if (payment === maxPay) {
          balance.paymentDate = currentDate;
          balance.senderNumber = senderNumber;
          balance.method = method;
        }

        nextMonth.setMonth(nextMonth.getMonth() + 1);
      }
    }

    student.paymentHistory.push({
      amount: amount,
      date: currentDate,
      senderNumber,
      method,
    });

    await student.save();
    res.status(200).json({ message: "Payment successful", student });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createStudent,
  updateStudent,
  makePayment,
  deleteStudent,
  getAllStudents,
};
