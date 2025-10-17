import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { callGetAllParentsApi, callDeleteParentApi } from "@/service/service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Trash,
  Plus,
  Users,
  Phone,
  Mail,
  MapPin,
  User,
  // Child,
  ChevronLeft,
  ChevronRight,
  Baby,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GlobalLoader from "@/components/common/GlobalLoader";
import ButtonLoader from "@/components/common/ButtonLoadi";

const AllParents = () => {
  const [parents, setParents] = useState([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [childrenFilter, setChildrenFilter] = useState("all");
  const navigate = useNavigate();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const fetchParents = async () => {
    setPageLoading(true);
    const start = Date.now();
    try {
      const { parents } = await callGetAllParentsApi();
      if (parents) {
        setParents(parents || []);
      } else {
        toast.error("Failed to fetch parents ❌");
        setPageLoading(false);
      }
    } catch (err) {
      console.error("Error fetching parents", err);
      toast.error("Something went wrong ❌");
    } finally {
      const elapsed = Date.now() - start;
      const minTime = 1000;
      const remaining = minTime - elapsed;
      if (remaining > 0) {
        setTimeout(() => setPageLoading(false), remaining);
      } else {
        setPageLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, childrenFilter]);

  const handleDelete = async (id) => {
    if (!id) return;
    setLoading(true);
    try {
      await callDeleteParentApi(id);
      toast.success("Parent deleted successfully ✅");
      setParents((prev) => prev.filter((parent) => parent._id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error("Error deleting parent", err);
      toast.error("Failed to delete parent ❌");
    } finally {
      setLoading(false);
      setIsDialogOpen(false);
    }
  };

  const getChildrenCount = (parent) => {
    return parent.children?.length || 0;
  };

  const filteredParents = parents
    .filter((parent) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        parent.user?.fullName?.toLowerCase().includes(searchLower) ||
        parent.email?.toLowerCase().includes(searchLower) ||
        parent.contact?.toLowerCase().includes(searchLower)
      );
    })
    .filter((parent) => {
      if (childrenFilter === "all") return true;
      const childrenCount = getChildrenCount(parent);
      switch (childrenFilter) {
        case "none":
          return childrenCount === 0;
        case "single":
          return childrenCount === 1;
        case "multiple":
          return childrenCount > 1;
        default:
          return true;
      }
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredParents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentParents = filteredParents.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Calculate stats
  const totalParents = parents.length;
  const parentsWithChildren = parents.filter(
    (parent) => getChildrenCount(parent) > 0
  ).length;
  const totalChildren = parents.reduce(
    (total, parent) => total + getChildrenCount(parent),
    0
  );

  if (pageLoading) return <GlobalLoader />;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header - All Parents Page */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-3 sm:p-4">
        {/* Top Row for Mobile: Back + Add */}
        <div className="flex w-full justify-between sm:justify-start sm:w-auto">
          {/* Back Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 justify-center sm:justify-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {/* Add Button (mobile only) */}
          <Link to="/admin/dashboard/Parantsregister" className="sm:hidden">
            <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </Link>
        </div>

        {/* Title Section */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Parent Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage all parent accounts and their information
            </p>
          </div>
        </div>

        {/* Add Button for larger screens */}
        <Link to="/admin/dashboard/Parantsregister" className="hidden sm:block">
          <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg">
            <Plus className="w-4 h-4" />
            Add Parent
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Total Parents
                </p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {totalParents}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  Active Parents
                </p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {parentsWithChildren}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/20">
                <User className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  Total Children
                </p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {totalChildren}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/20">
                <Baby className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Box */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search parents by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center justify-end w-full md:w-auto">
              <Select value={childrenFilter} onValueChange={setChildrenFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by children" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parents</SelectItem>
                  <SelectItem value="none">No Children</SelectItem>
                  <SelectItem value="single">Single Child</SelectItem>
                  <SelectItem value="multiple">Multiple Children</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Show per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">9 per page</SelectItem>
                  <SelectItem value="12">12 per page</SelectItem>
                  <SelectItem value="18">18 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parents Grid */}
      {currentParents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No parents found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {searchTerm || childrenFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by adding your first parent"}
            </p>
            {!searchTerm && childrenFilter === "all" && (
              <Link to="/admin/dashboard/parentRegister">
                <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="w-4 h-4" />
                  Add Parent
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentParents.map((parent) => {
              const childrenCount = getChildrenCount(parent);
              return (
                <Card
                  key={parent._id}
                  className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                >
                  <CardContent className="p-6">
                    {/* Header with avatar and actions */}
                    <div className="flex items-start justify-between mb-4">
                      <Link
                        className=""
                        to={`/admin/dashboard/parant/${parent._id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                            {parent.user?.fullName?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold hover:text-blue-600 text-gray-900 dark:text-white">
                              {parent.user?.fullName}
                            </h3>
                            <p className="text-sm hover:text-blue-600 text-gray-500 flex gap-2 items-center">
                              <Mail className="w-4 h-4  text-blue-600 dark:text-blue-400" />
                              {parent?.user?.email}
                            </p>
                          </div>
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteId(parent._id);
                          setIsDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {parent.contact || "Not provided"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300 truncate">
                          {parent?.user?.email}
                        </span>
                      </div>
                      {parent.address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="text-gray-600 dark:text-gray-300 line-clamp-2">
                            {parent.address}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer with children count */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                      <Badge
                        variant={
                          childrenCount === 0
                            ? "outline"
                            : childrenCount === 1
                              ? "secondary"
                              : "default"
                        }
                        className={
                          childrenCount === 0
                            ? "text-gray-500 bg-gray-100"
                            : childrenCount === 1
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-100"
                              : "bg-purple-100 text-purple-700 hover:bg-purple-100"
                        }
                      >
                        {/* <Child className="w-3 h-3 mr-1" /> */}
                        {childrenCount === 0
                          ? "No children"
                          : `${childrenCount} child${childrenCount > 1 ? "ren" : ""}`}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {parent.children?.[0]
                          ? `${parent.children.length} students`
                          : "No students"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredParents.length)} of{" "}
              {filteredParents.length} parents
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="h-9 w-9 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="h-9 w-9 p-0"
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-9 w-9 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5 text-red-600" />
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDelete(deleteId)}
              disabled={loading}
              className="gap-2"
            >
              {loading ? <ButtonLoader /> : <Trash className="h-4 w-4" />}
              Delete Parent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllParents;
