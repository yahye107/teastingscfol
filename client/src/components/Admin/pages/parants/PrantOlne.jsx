import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  callGetParentByIdApi,
  callUpdateParentApi,
  callDeleteParentApi,
} from "@/service/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Phone,
  Mail,
  MapPin,
  User,
  Baby,
  Briefcase,
  ArrowLeft,
  Edit,
  Save,
  X,
  GraduationCap,
  Calendar,
  School,
  PhoneCall,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import GlobalLoader from "@/components/common/GlobalLoader";
import ButtonLoader from "@/components/common/ButtonLoadi";

const ParentOne = () => {
  const { id } = useParams();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    contact: "",
    fullName: "",
    email: "",
    occupation: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchParent = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const response = await callGetParentByIdApi(id);
      if (response.parent) {
        setParent(response.parent);
        setFormData({
          fullName: response.parent?.user?.fullName || "",
          email: response.parent?.user?.email || "",
          contact: response.parent.contact || "",
          occupation: response.parent.occupation || "",
          address: response.parent.address || "",
        });
      } else {
        toast.error("Failed to fetch parent data ❌");
      }
    } catch (err) {
      console.error("Error fetching parent", err);
      toast.error("Something went wrong ❌");
    } finally {
      const elapsed = Date.now() - start;
      const minTime = 1000; // 2s minimum
      const remaining = minTime - elapsed;

      if (remaining > 0) {
        setTimeout(() => setLoading(false), remaining);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchParent();
  }, [id]);

  // Change detection logic
  const hasChanges = () => {
    if (!parent) return false;

    const originalData = {
      fullName: parent.user?.fullName || "",
      email: parent.user?.email || "",
      contact: parent.contact || "",
      occupation: parent.occupation || "",
      address: parent.address || "",
    };

    return Object.keys(formData).some(
      (key) => formData[key] !== originalData[key]
    );
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data when canceling
      setFormData({
        fullName: parent.user?.fullName || "",
        email: parent.user?.email || "",
        contact: parent.contact || "",
        occupation: parent.occupation || "",
        address: parent.address || "",
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.contact.trim()) {
      toast.error("Contact information is required");
      return;
    }

    // Check if there are actual changes
    if (!hasChanges()) {
      toast.info("No changes to save");
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      const response = await callUpdateParentApi(id, formData);
      if (response.parent) {
        setParent(response.parent);
        setIsEditing(false);
        toast.success("Parent information updated successfully ✅");
      } else {
        toast.error("Failed to update parent information ❌");
      }
    } catch (err) {
      console.error("Error updating parent", err);
      toast.error("Something went wrong ❌");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Use the same pattern as AllParents - no response.success check
      await callDeleteParentApi(id);
      toast.success("Parent deleted successfully ✅");
      navigate("/admin/dashboard/parantinfo");
    } catch (err) {
      console.error("Error deleting parent", err);
      toast.error("Failed to delete parent ❌");
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  if (loading) return <GlobalLoader />;

  if (!parent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center mx-auto mb-6">
              <User className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Parent Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The Parent profile you're looking for doesn't exist.
            </p>
            <Link to="/admin/dashboard/parantinfo">
              <Button className="gap-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800">
                <ArrowLeft className="w-4 h-4" />
                Back to Parents
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header - Parent Profile Page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        {/* Mobile Top Row: Back + All Parents */}
        <div className="hidden justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 w-[80px] justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <Link to="/admin/dashboard/parantinfo">
            <Button
              variant="outline"
              className="w-[120px] justify-center border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            >
              All Parents
            </Button>
          </Link>
        </div>

        {/* Left Section: Back + Title + Subtitle (sm and up) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 sm:w-auto w-[80px] justify-center sm:justify-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Parent Profile
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Complete information and children details
            </p>
          </div>
        </div>

        {/* Right Section: All Parents, Delete, Edit/Save */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-2 sm:mt-0">
          <Link to="/admin/dashboard/parantinfo" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            >
              All Parents
            </Button>
          </Link>

          <Button
            variant="destructive"
            onClick={openDeleteDialog}
            className="gap-2 w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>

          {isEditing ? (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleEditToggle}
                className="gap-2 w-full sm:w-auto"
                disabled={saving}
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="gap-2 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                disabled={saving || !hasChanges()}
              >
                <Save className="w-4 h-4" />
                {saving ? <ButtonLoader /> : "Save Changes"}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleEditToggle}
              className="gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              <Edit className="w-4 h-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Change Indicator */}
      {/* {isEditing && hasChanges() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-blue-700">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              You have unsaved changes
            </span>
          </div>
        </div>
      )} */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parent Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Parent Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-2xl mx-auto mb-4">
                  {parent.user?.fullName?.charAt(0)?.toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? (
                    <Input
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      placeholder="Enter full name"
                      className="w-full"
                    />
                  ) : (
                    <p className="font-medium">
                      {parent?.user?.fullName || "Not provided"}
                    </p>
                  )}
                </h2>
                <p className="text-gray-500">Parent</p>
                <Badge
                  variant="outline"
                  className={`mt-2 border ${
                    parent.children?.some(
                      (child) => child.user?.status === "active"
                    )
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {parent.children?.some(
                    (child) => child.user?.status === "active"
                  )
                    ? "Active"
                    : "Non-Active"}
                </Badge>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>

                    {isEditing ? (
                      <Input
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="Enter the email"
                        className="w-full"
                      />
                    ) : (
                      <p className="font-medium">{parent.user?.email}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact</p>
                    {isEditing ? (
                      <Input
                        value={formData.contact}
                        onChange={(e) =>
                          handleInputChange("contact", e.target.value)
                        }
                        placeholder="Enter contact number"
                        className="w-full"
                      />
                    ) : (
                      <p className="font-medium">
                        {parent.contact || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Occupation</p>
                    {isEditing ? (
                      <Input
                        value={formData.occupation}
                        onChange={(e) =>
                          handleInputChange("occupation", e.target.value)
                        }
                        placeholder="Enter occupation"
                        className="w-full"
                      />
                    ) : (
                      <p className="font-medium">
                        {parent.occupation || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Address</p>
                    {isEditing ? (
                      <Input
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        placeholder="Enter address"
                        className="w-full"
                      />
                    ) : (
                      <p className="font-medium">
                        {parent.address || "Not provided"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Baby className="w-5 h-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Children</span>
                <Badge variant="secondary">
                  {parent.children?.length || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Students</span>
                <Badge variant="default">
                  {parent.children?.filter(
                    (child) => child.user?.status === "active"
                  ).length || 0}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Non-Active Students</span>
                <Badge variant="destructive">
                  {parent.children?.filter(
                    (child) => child.user?.status !== "active"
                  ).length || 0}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Member Since</span>
                <span className="text-sm text-gray-500">
                  {new Date().getFullYear()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Children Information */}
        <div className="lg:col-span-2 overflow-x-auto w-full border rounded-lg h-[500px] shadow-sm">
          <Table className="min-w-full">
            <TableHeader className="bg-gray-50/80 backdrop-blur-sm">
              <TableRow className="border-b hover:bg-transparent">
                <TableHead className="font-semibold text-gray-700 py-4">
                  Student
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Gender
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Admission
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Class
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  DOB
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Contact
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Address
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Previous School
                </TableHead>
                <TableHead className="font-semibold text-gray-700 text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parent.children.map((child) => (
                <TableRow
                  key={child._id}
                  className="border-b hover:bg-blue-50/30 transition-colors duration-150 group cursor-pointer"
                  onClick={() =>
                    navigate(`/admin/dashboard/StudentInfobyid/${child._id}`)
                  }
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-semibold border border-blue-200 shadow-sm">
                        {child.user?.fullName?.charAt(0)?.toUpperCase() || "S"}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                          {child.user?.fullName}
                        </div>
                        {child.email && (
                          <div className="text-xs text-gray-500 truncate max-w-[120px]">
                            {child.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        child.gender?.toLowerCase() === "male"
                          ? "default"
                          : "secondary"
                      }
                      className={`px-2 py-1 text-xs font-medium ${
                        child.gender?.toLowerCase() === "male"
                          ? "bg-blue-100 text-blue-800 border-blue-200"
                          : "bg-pink-100 text-pink-800 border-pink-200"
                      }`}
                    >
                      {child.gender || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        child?.user?.status === "active"
                          ? "default"
                          : "destructive"
                      }
                      className="capitalize px-2 py-1 text-xs font-medium"
                    >
                      {child?.user?.status || "N/A"}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-mono text-sm text-gray-600">
                    {child.admissionNumber || "N/A"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        child.classId?.name
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {child.classId?.name || "Not assigned"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {child.dob
                      ? new Date(child.dob).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {child.contact ? (
                      <a
                        href={`tel:${child.contact}`}
                        className="hover:text-blue-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {child.contact}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <div
                      className="text-sm text-gray-600 truncate"
                      title={child.address}
                    >
                      {child.address || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[120px]">
                    <div
                      className="text-sm text-gray-600 truncate"
                      title={child.previousSchool}
                    >
                      {child.previousSchool || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          `/admin/dashboard/StudentInfobyid/${child._id}`
                        );
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1 group/btn mx-auto"
                    >
                      <svg
                        className="w-4 h-4 group-hover/btn:scale-110 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Empty state */}
          {parent.children.length === 0 && (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No students found
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                There are no children registered under this parent account.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Parent Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              parent account and remove all associated data from our servers.
              Any children linked to this parent will need to be reassigned to
              another parent.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-2"
            >
              {deleting ? <ButtonLoader /> : <Trash2 className="h-4 w-4" />}
              Delete Parent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParentOne;
