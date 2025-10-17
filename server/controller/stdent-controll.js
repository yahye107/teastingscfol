const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Student = require("../models/student");
const Classroom = require("../models/classroom");
const Parent = require("../models/parents");
const { generateEasyPassword } = require("../utils/passwordgenetar");

// Helper function to calculate age from DOB
const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

// Helper function to check if birthday is today
const isBirthdayToday = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  return (
    birthDate.getMonth() === today.getMonth() &&
    birthDate.getDate() === today.getDate()
  );
};

// Auto-update age for active students (to be called daily via cron job or on student access)
const updateStudentAgeIfActive = async (student) => {
  try {
    const user = await User.findById(student.user);

    // Only update age if student status is active
    if (user && user.status === "active" && student.dob) {
      const newAge = calculateAge(student.dob);

      // Update age if it's different from current age
      if (student.age !== newAge) {
        student.age = newAge;
        await student.save();
        console.log(`Updated age for student ${student._id} to ${newAge}`);
      }

      // Special case: if it's their birthday today, we can trigger additional logic
      if (isBirthdayToday(student.dob)) {
        console.log(`Today is birthday for student ${student._id}`);
        // You can add birthday-specific logic here if needed
      }
    }
  } catch (error) {
    console.error(`Error updating age for student ${student._id}:`, error);
  }
};

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
      nationalId,
      notes,
      monthlyPayment,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Student email already exists." });
    const existingUserNationalid = await Student.findOne({ nationalId });
    if (existingUserNationalid)
      return res
        .status(400)
        .json({ message: "Student nationalId already exists." });

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
      status: "active", // Default to active when creating
    });

    // Calculate age from DOB
    const calculatedAge = dob ? calculateAge(dob) : age;
    const lastStudent = await Student.findOne().sort({ admissionCounter: -1 });
    let newCounter = 1;
    if (lastStudent && lastStudent.admissionCounter) {
      newCounter = lastStudent.admissionCounter + 1;
    }

    const student = await Student.create({
      user: user._id,
      admissionCounter: newCounter,
      admissionNumber: "ADM" + newCounter.toString().padStart(6, "0"),
      dob,
      age: calculatedAge,
      gender,
      contact,
      address,
      nationalId,
      notes,
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

    res.status(201).json({ message: "Student created successfully", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      fullName,
      email,
      dob,
      gender,
      contact,
      status,
      address,
      previousSchool,
      emergencyContact,
      nationalId,
      notes,
      monthlyPayment,
      classId,
      parentId,
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const oldClassId = student.classId?.toString();
    const newClassId = classId;
    const oldParentId = student.parent?.toString();
    const newParentId = parentId;

    // ✅ Update linked user details
    const user = await User.findById(student.user);
    if (user) {
      user.fullName = fullName || user.fullName;
      user.email = email || user.email;
      user.status = status || user.status;
      await user.save();
    }

    // ✅ Update DOB & auto-calculate age only if student is active
    if (dob) {
      student.dob = dob;

      // Only update age if student status is active
      if (user && user.status === "active") {
        const calculatedAge = calculateAge(dob);
        student.age = calculatedAge;
      }
      // If student is not active, keep the current age as is
    }

    student.gender = gender || student.gender;
    student.contact = contact || student.contact;
    student.nationalId = nationalId || student.nationalId;
    student.notes = notes || student.notes;
    student.address = address || student.address;
    student.previousSchool = previousSchool || student.previousSchool;
    student.emergencyContact = emergencyContact || student.emergencyContact;
    student.monthlyPayment =
      monthlyPayment !== undefined ? monthlyPayment : student.monthlyPayment;

    // ✅ Handle parent change
    if (newParentId && newParentId !== oldParentId) {
      // Remove student from old parent's children list
      if (oldParentId) {
        await Parent.findByIdAndUpdate(oldParentId, {
          $pull: { children: student._id },
        });
      }

      // Add student to new parent's children list
      await Parent.findByIdAndUpdate(newParentId, {
        $addToSet: { children: student._id },
      });

      student.parent = newParentId;
    }

    // ✅ Handle class change
    if (newClassId && newClassId !== oldClassId) {
      if (oldClassId) {
        await Classroom.findByIdAndUpdate(oldClassId, {
          $pull: { students: student._id },
        });
      }
      await Classroom.findByIdAndUpdate(newClassId, {
        $addToSet: { students: student._id },
      });
      student.classId = newClassId;
    }

    await student.save();

    res.status(200).json({
      message: "Student updated successfully",
      student,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all students with age auto-update for active students
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate({
        path: "user",
        select: "fullName email role status rawPassword createdAt",
      })
      .populate({
        path: "classId",
        select: "name section timetables",
      })
      .populate({
        path: "parent",
        populate: {
          path: "user",
          select: "fullName email role",
        },
        select: "fullName contact email",
      })
      .select(
        "dob age gender contact address previousSchool monthlyPayment admissionNumber emergencyContact"
      );

    // Auto-update ages for active students when fetching all students
    const updatePromises = students.map((student) => {
      if (student.user && student.user.status === "active" && student.dob) {
        return updateStudentAgeIfActive(student);
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);

    res
      .status(200)
      .json({ message: "All students fetched successfully", students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single student by ID with age auto-update if active
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findById(id)
      .populate({
        path: "user",
        select: "fullName status email role rawPassword createdAt",
      })
      .populate({
        path: "classId",
        select: "name section status timetables grade",
      })
      .populate({
        path: "results",
        populate: {
          path: "subject",
          select: "name",
        },
        select:
          "subject academicYear attendanceRate firstExam midExam thirdExam finalExam activities total createdBy lastUpdatedBy createdAt updatedAt",
      })
      .populate({
        path: "parent",
        populate: {
          path: "user",
          select: "fullName status email role",
        },
        select: "fullName contact email",
      })
      .select(
        "dob age gender contact address nationalId notes previousSchool monthlyPayment admissionNumber emergencyContact"
      );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Auto-update age if student is active
    if (student.user && student.user.status === "active" && student.dob) {
      await updateStudentAgeIfActive(student);
      // Refresh the student data after update
      const updatedStudent = await Student.findById(id)
        .populate({
          path: "user",
          select: "fullName status email role rawPassword createdAt",
        })
        .populate({
          path: "classId",
          select: "name section status timetables grade",
        })
        .populate({
          path: "results",
          populate: {
            path: "subject",
            select: "name",
          },
          select:
            "subject academicYear attendanceRate firstExam midExam thirdExam finalExam activities total createdBy lastUpdatedBy createdAt updatedAt",
        })
        .populate({
          path: "parent",
          populate: {
            path: "user",
            select: "fullName status email role",
          },
          select: "fullName contact email",
        })
        .select(
          "dob age gender contact address nationalId notes previousSchool monthlyPayment admissionNumber emergencyContact"
        );

      return res.status(200).json({
        message: "Student fetched successfully",
        student: updatedStudent,
      });
    }

    res.status(200).json({ message: "Student fetched successfully", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Daily cron job to update ages for all active students
const updateAllActiveStudentsAges = async () => {
  try {
    console.log("Starting daily age update for active students...");

    // Find all active students
    const activeUsers = await User.find({
      role: "student",
      status: "active",
    }).select("_id");

    const activeStudentIds = activeUsers.map((user) => user._id);

    const students = await Student.find({
      user: { $in: activeStudentIds },
      dob: { $exists: true, $ne: null },
    });

    let updatedCount = 0;

    for (const student of students) {
      const newAge = calculateAge(student.dob);
      if (student.age !== newAge) {
        student.age = newAge;
        await student.save();
        updatedCount++;

        // Log birthday if today
        if (isBirthdayToday(student.dob)) {
          console.log(
            `🎉 Birthday alert: Student ${student._id} turned ${newAge} today!`
          );
        }
      }
    }

    console.log(
      `Daily age update completed. Updated ${updatedCount} students.`
    );
  } catch (error) {
    console.error("Error in daily age update:", error);
  }
};

// Delete student (unchanged)
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

// Make payment (unchanged)
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
  getStudentById,
  makePayment,
  deleteStudent,
  getAllStudents,
  updateStudentAgeIfActive,
  updateAllActiveStudentsAges,
  calculateAge, // Export for testing
};
