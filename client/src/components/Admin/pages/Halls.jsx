import React, { useEffect, useState } from "react";
import CommonForm from "@/components/common/CommonForm";
import { HallFormControls } from "@/config";
import {
  callCreateHallApi,
  callGetHallByNumberApi,
  callGetHallExamClassesApi,
  callGetAllHallsApi,
  callUpdateHallApi,
  callDeleteHallApi,
} from "@/service/service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Trash2, Edit, Plus, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GlobalLoader from "@/components/common/GlobalLoader";

const hallSchema = z.object({
  hallNumber: z.string().min(1, "Hall number is required"),
  capacity: z.coerce.number().positive("Capacity must be a positive number"),
  type: z.string().min(6, "Type must be at least 6 characters"),
});

const Halls = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [halls, setHalls] = useState([]);
  const [filteredHalls, setFilteredHalls] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedHall, setSelectedHall] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [examClasses, setExamClasses] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(hallSchema),
    defaultValues: {
      hallNumber: "",
      capacity: "",
      type: "",
    },
  });

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const response = await callGetAllHallsApi();
      setHalls(response.halls || []);
      setFilteredHalls(response.halls || []);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch halls");
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const results = halls.filter((hall) => {
      return (
        hall.hallNumber.toLowerCase().includes(value.toLowerCase()) ||
        hall.type.toLowerCase().includes(value.toLowerCase())
      );
    });
    setFilteredHalls(results);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch(e);
  };

  const handleNewHall = () => {
    form.reset({
      hallNumber: "",
      capacity: "",
      type: "",
    });
    setSelectedHall(null);
    setClassrooms([]);
    setExamClasses([]);
  };

  const handleSubmit = async (formData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (selectedHall) {
        await callUpdateHallApi(selectedHall._id, formData);
        toast.success("Hall updated successfully!");
      } else {
        await callCreateHallApi(formData);
        toast.success("Hall created successfully!");
      }
      form.reset();
      setSelectedHall(null);
      setClassrooms([]);
      setExamClasses([]);
      await fetchHalls();
    } catch (error) {
      toast.error(
        error.message || (selectedHall ? "Update failed" : "Creation failed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (hallId) => {
    setDeleteLoading(true);
    try {
      await callDeleteHallApi(hallId);
      toast.success("Hall deleted successfully");
      if (selectedHall?._id === hallId) {
        handleNewHall();
      }
      await fetchHalls();
    } catch (error) {
      toast.error(error.message || "Failed to delete hall");
    } finally {
      setDeleteLoading(false);
    }
  };
  if (loading) return <GlobalLoader />;
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Input
            value={searchTerm}
            onChange={handleSearch}
            onKeyDown={handleKeyPress}
            placeholder="Search by hall number or type..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
        <Button onClick={handleNewHall} className="gap-2">
          <Plus className="h-4 w-4" />
          New Hall
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hall List */}
        <Card className="lg:col-span-1 max-h-[500px] overflow-auto">
          <CardHeader>
            <CardTitle>Hall List</CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))
            ) : filteredHalls.length > 0 ? (
              filteredHalls.map((hall) => (
                <Button
                  key={hall._id}
                  variant={
                    selectedHall?._id === hall._id ? "secondary" : "ghost"
                  }
                  onClick={async () => {
                    const examInfo = await callGetHallExamClassesApi(hall._id);
                    setSelectedHall(hall);
                    setClassrooms(hall.classrooms || []);
                    setExamClasses(examInfo.currentExams || []);
                    form.reset(hall);
                  }}
                  className="w-full justify-start h-12 text-left px-3"
                >
                  <div className="truncate">
                    <p className="font-medium">Hall {hall.hallNumber}</p>
                    <p className="text-sm text-muted-foreground">
                      {hall.type} • Capacity: {hall.capacity}
                    </p>
                    {/* {hall.classrooms?.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Classes:{" "}
                        {hall.classrooms
                          .map((cls) => `Grade ${cls.grade} - ${cls.section}`)
                          .join(", ")}
                      </div>
                    )} */}
                  </div>
                </Button>
              ))
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No halls found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hall Form and Details */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="min-h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {selectedHall
                  ? `Hall ${selectedHall.hallNumber}`
                  : "Create New Hall"}
              </CardTitle>
              {selectedHall && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Hall
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this hall? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(selectedHall._id)}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? "Deleting..." : "Confirm"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <CommonForm
                formControls={HallFormControls}
                form={form}
                handleSubmit={form.handleSubmit(handleSubmit)}
                btnText={
                  isSubmitting
                    ? selectedHall
                      ? "Updating..."
                      : "Creating..."
                    : selectedHall
                    ? "Update Hall"
                    : "Create Hall"
                }
                inputClassName="w-full p-2 border rounded-md"
                labelClassName="block text-sm font-medium mb-1"
                errorClassName="text-red-500 text-xs mt-1"
              />

              {selectedHall && (
                <div className="space-y-6">
                  {/* Classrooms Section */}
                  <div>
                    <h3 className="font-medium mb-2">Assigned Classrooms</h3>
                    {classrooms.length > 0 ? (
                      <div className="space-y-2">
                        {classrooms.map((cls, idx) => (
                          <div
                            key={idx}
                            className="p-3 border rounded-lg bg-muted"
                          >
                            <p className="font-medium">
                              Grade {cls.name} - {cls.section}
                            </p>
                            <div className="text-sm text-muted-foreground">
                              <p>Students: {cls.studentCount}</p>
                              <p>Academic Year: {cls.academicYear}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No classrooms assigned to this hall
                      </p>
                    )}
                  </div>

                  {/* Exams Section */}
                  <div>
                    <h3 className="font-medium mb-2">Scheduled Exams</h3>
                    {examClasses.length > 0 ? (
                      <div className="space-y-2">
                        {examClasses.map((exam, idx) => (
                          <div
                            key={idx}
                            className="p-3 border rounded-lg bg-blue-50"
                          >
                            <p className="font-medium">{exam.className}</p>
                            <div className="text-sm text-muted-foreground">
                              <p>
                                Grade: {exam.grade} - Section: {exam.section}
                              </p>
                              <p>Students: {exam.students}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No exams scheduled in this hall
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Halls;
