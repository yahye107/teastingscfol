import React, { useEffect, useState } from "react";
import {
  callDeleteUserApi,
  callGetUsersApi,
  callUpdateUserStatusApi,
} from "@/service/service";
import { useUser } from "@/useContaxt/UseContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BarLoader } from "react-spinners";
import GlobalLoader from "@/components/common/GlobalLoader";

const Userinfo = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const { setUser } = useUser();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await callGetUsersApi();
        setUsers(data);
      } catch (err) {
        setError("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleStatusChange = async (userId, newStatus) => {
    if (!window.confirm(`Change user's status to ${newStatus}?`)) return;
    setUpdatingStatus(userId);
    try {
      await callUpdateUserStatusApi(userId, newStatus);
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, status: newStatus } : user
        )
      );
    } catch (err) {
      setError("Failed to update user status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDelete = async (userId) => {
    try {
      await callDeleteUserApi(userId);
      setUsers(users.filter((user) => user._id !== userId));
    } catch (err) {
      setError("Failed to delete user");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <GlobalLoader />;

  if (error)
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-lg mx-4 mt-4 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 space-y-6 max-w-7xl mx-auto">
        <div className="relative w-full text-black">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-12 pr-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-4 top-3.5 h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 hidden md:table-header-group">
                <tr>
                  {[
                    "Name",
                    "Email",
                    "Status",
                    "Role",
                    "Password",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 transition-colors group md:table-row flex flex-col p-4 md:p-0 mb-4 bg-white rounded-lg shadow md:shadow-none md:mb-0 md:bg-transparent"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 md:table-cell flex flex-col w-full">
                        <span className="md:hidden text-xs text-gray-500 mb-1">
                          Name
                        </span>
                        {user.fullName}
                      </td>
                      <td className="px-4 py-3 text-gray-600 md:table-cell flex flex-col w-full">
                        <span className="md:hidden text-xs text-gray-500 mb-1">
                          Email
                        </span>
                        {user.email}
                      </td>
                      <td className="px-4 py-3 md:table-cell flex flex-col w-full">
                        <span className="md:hidden text-xs text-gray-500 mb-1">
                          Status
                        </span>
                        <div className="flex flex-col gap-1">
                          <select
                            value={user.status}
                            onChange={(e) =>
                              handleStatusChange(user._id, e.target.value)
                            }
                            className={`w-full px-3 py-2 text-sm rounded-lg font-medium ${
                              user.status === "blocked"
                                ? "bg-red-50 text-red-700"
                                : user.status === "pending"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-green-50 text-green-700"
                            } ${
                              updatingStatus === user._id
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={updatingStatus === user._id}
                          >
                            <option value="active">Active</option>
                            <option value="blocked">Blocked</option>
                            <option value="pending">Pending</option>
                          </select>
                          {updatingStatus === user._id && (
                            <span className="text-xs text-gray-500">
                              Updating...
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 md:table-cell flex flex-col w-full">
                        <span className="md:hidden text-xs text-gray-500 mb-1">
                          Role
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 md:table-cell flex flex-col w-full">
                        <span className="md:hidden text-xs text-gray-500 mb-1">
                          Password
                        </span>
                        <span className="break-all">{user.rawPassword}</span>
                      </td>
                      <td className="px-4 py-3 md:table-cell flex flex-col w-full">
                        <span className="md:hidden text-xs text-gray-500 mb-1">
                          Actions
                        </span>
                        <div className="w-full">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="w-full inline-flex items-center justify-center text-red-600 hover:text-red-800 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                                <svg
                                  className="w-5 h-5 mr-1.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Delete
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Confirm Deletion
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. Are you sure you
                                  want to permanently delete this user?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(user._id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Userinfo;
