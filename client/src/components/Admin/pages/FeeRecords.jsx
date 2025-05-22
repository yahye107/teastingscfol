import React, { useEffect, useState } from "react";
import { callGetAllStudentsApi } from "@/service/service";
import {
  format,
  parseISO,
  addMonths,
  isBefore,
  differenceInCalendarDays,
  startOfMonth,
} from "date-fns";

const FeeRecords = () => {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    senderNumber: "",
    method: "Cash",
  });
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: format(new Date(), "MMM"),
  });
  const [financialSummary, setFinancialSummary] = useState({
    totalPaid: 0,
    outstanding: 0,
    overdue: 0,
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      updateFinancialSummary();
    }
  }, [selectedStudent]);

  const fetchStudents = async () => {
    try {
      const response = await callGetAllStudentsApi();
      const studentsWithDefaults = response.students.map((s) => ({
        ...s,
        paymentHistory: s.paymentHistory || [],
        monthlyBalances: s.monthlyBalances || [],
      }));
      setStudents(studentsWithDefaults);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleSearch = (e) => setSearchQuery(e.target.value);

  const filteredStudents = students.filter((student) => {
    const searchString = `${student.user?.fullName || ""} ${
      student.admissionNumber
    }`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  const calculateDebt = (student) => {
    if (!student) return 0;
    const currentDate = new Date();
    const currentMonthStart = startOfMonth(currentDate);

    return student.monthlyBalances.reduce((total, balance) => {
      const dueDate = new Date(
        balance.year,
        new Date(`${balance.month} 1, ${balance.year}`).getMonth(),
        5
      );
      if (isBefore(dueDate, currentMonthStart)) {
        const remaining = balance.dueAmount - balance.paidAmount;
        return total + Math.max(0, remaining);
      }
      return total;
    }, 0);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedStudent || !paymentData.amount) return;

    try {
      const paymentDateObj = new Date(paymentData.date);
      const payment = {
        ...paymentData,
        amount: Number(paymentData.amount),
        date: paymentDateObj,
        monthYear: format(paymentDateObj, "MMM yyyy"),
      };

      // Update monthly balances
      const updatedBalances = updateBalances(
        [...selectedStudent.monthlyBalances],
        payment
      );

      // Update payment history
      const updatedHistory = [...selectedStudent.paymentHistory, payment];

      // Calculate carry-over
      const finalBalances = handleOverpayment(updatedBalances, payment);

      const updatedStudent = {
        ...selectedStudent,
        monthlyBalances: finalBalances,
        paymentHistory: updatedHistory,
      };

      setSelectedStudent(updatedStudent);
      await savePaymentRecord(updatedStudent);
      resetForm();
      fetchStudents(); // Refresh student list
    } catch (error) {
      console.error("Payment failed:", error);
    }
  };

  const updateBalances = (balances, payment) => {
    const paymentMonth = format(payment.date, "MMM");
    const paymentYear = payment.date.getFullYear();

    let balance = balances.find(
      (b) => b.month === paymentMonth && b.year === paymentYear
    );

    if (!balance) {
      balance = {
        month: paymentMonth,
        year: paymentYear,
        dueAmount: selectedStudent.monthlyPayment,
        paidAmount: 0,
        dueDate: new Date(paymentYear, payment.date.getMonth(), 5),
      };
      balances.push(balance);
    }

    balance.paidAmount += payment.amount;
    return balances;
  };

  const handleOverpayment = (balances, payment) => {
    const currentBalance = balances.find(
      (b) =>
        b.month === format(payment.date, "MMM") &&
        b.year === payment.date.getFullYear()
    );

    const overpayment = currentBalance.paidAmount - currentBalance.dueAmount;
    if (overpayment > 0) {
      const nextMonth = addMonths(payment.date, 1);
      const nextMonthStr = format(nextMonth, "MMM");
      const nextYear = nextMonth.getFullYear();

      let nextBalance = balances.find(
        (b) => b.month === nextMonthStr && b.year === nextYear
      );

      if (!nextBalance) {
        nextBalance = {
          month: nextMonthStr,
          year: nextYear,
          dueAmount: selectedStudent.monthlyPayment,
          paidAmount: 0,
          dueDate: new Date(nextYear, nextMonth.getMonth(), 5),
        };
        balances.push(nextBalance);
      }

      nextBalance.paidAmount += overpayment;
      currentBalance.paidAmount = currentBalance.dueAmount;
    }

    return balances;
  };

  const updateFinancialSummary = () => {
    const totalPaid = selectedStudent.paymentHistory.reduce(
      (sum, p) => sum + p.amount,
      0
    );
    const outstanding = calculateDebt(selectedStudent);
    const overdue = selectedStudent.monthlyBalances.reduce((sum, b) => {
      const dueDate = new Date(
        b.year,
        new Date(`${b.month} 1, ${b.year}`).getMonth(),
        5
      );
      return isBefore(dueDate, new Date())
        ? sum + Math.max(0, b.dueAmount - b.paidAmount)
        : sum;
    }, 0);

    setFinancialSummary({ totalPaid, outstanding, overdue });
  };

  const filteredPayments =
    selectedStudent?.paymentHistory.filter((p) => {
      const paymentDate = new Date(p.date);
      return (
        paymentDate.getFullYear() === filters.year &&
        format(paymentDate, "MMM") === filters.month
      );
    }) || [];

  const resetForm = () => {
    setPaymentData({
      amount: "",
      date: format(new Date(), "yyyy-MM-dd"),
      senderNumber: "",
      method: "Cash",
    });
  };

  return (
    <div className="container mx-auto p-6">
      {/* Student Search Section */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <input
            type="text"
            placeholder="🔍 Search by name or admission number"
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={handleSearch}
          />

          <div className="space-y-3">
            {filteredStudents.map((student) => (
              <div
                key={student._id}
                className="p-4 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => setSelectedStudent(student)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {student.user?.fullName || "Unknown Student"}
                      <span className="text-sm text-gray-600 ml-2">
                        ({student.admissionNumber})
                      </span>
                    </h3>
                    <p className="text-gray-600">
                      Monthly Fee: ${student.monthlyPayment}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`px-3 py-1 rounded-full ${
                        calculateDebt(student) > 0
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {calculateDebt(student) > 0
                        ? `Owes $${calculateDebt(student)}`
                        : "Up to date"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Interface */}
      {selectedStudent && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            Payment Management for {selectedStudent.user?.fullName}
          </h2>

          {/* Financial Summary */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800">
                Total Paid
              </h3>
              <p className="text-2xl font-bold text-green-600">
                ${financialSummary.totalPaid}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800">
                Outstanding
              </h3>
              <p className="text-2xl font-bold text-blue-600">
                ${financialSummary.outstanding}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-red-800">Overdue</h3>
              <p className="text-2xl font-bold text-red-600">
                ${financialSummary.overdue}
              </p>
            </div>
          </div>

          {/* Payment Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <input
              type="number"
              placeholder="Amount"
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={paymentData.amount}
              onChange={(e) =>
                setPaymentData({ ...paymentData, amount: e.target.value })
              }
            />
            <input
              type="date"
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={paymentData.date}
              onChange={(e) =>
                setPaymentData({ ...paymentData, date: e.target.value })
              }
            />
            <input
              placeholder="Sender/Transaction Number"
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={paymentData.senderNumber}
              onChange={(e) =>
                setPaymentData({ ...paymentData, senderNumber: e.target.value })
              }
            />
            <select
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={paymentData.method}
              onChange={(e) =>
                setPaymentData({ ...paymentData, method: e.target.value })
              }
            >
              <option>Cash</option>
              <option>Bank Transfer</option>
              <option>Mobile Money</option>
              <option>Check</option>
              <option>Scholarship</option>
            </select>
          </div>

          <button
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={handlePaymentSubmit}
          >
            Record Payment
          </button>
        </div>
      )}

      {/* Payment History */}
      {selectedStudent && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              className="p-2 border rounded-lg"
              value={filters.year}
              onChange={(e) =>
                setFilters({ ...filters, year: Number(e.target.value) })
              }
            >
              {Array.from(
                { length: 5 },
                (_, i) => new Date().getFullYear() - i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              className="p-2 border rounded-lg"
              value={filters.month}
              onChange={(e) =>
                setFilters({ ...filters, month: e.target.value })
              }
            >
              {[
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ].map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Method
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Reference
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Month Applied
                  </th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
                  <tr key={index} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      {format(new Date(payment.date), "dd/MM/yyyy")}
                    </td>
                    <td className="p-3 font-medium">${payment.amount}</td>
                    <td className="p-3">{payment.method}</td>
                    <td className="p-3 text-gray-600">
                      {payment.senderNumber}
                    </td>
                    <td className="p-3">{payment.monthYear}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          payment.amount >= selectedStudent.monthlyPayment
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payment.amount >= selectedStudent.monthlyPayment
                          ? "Full"
                          : "Partial"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeRecords;
