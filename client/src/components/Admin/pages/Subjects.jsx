import CommonForm from "@/components/common/CommonForm";
import { SubjectFormControls } from "@/config";
import {
  callCreateSubjectApi,
  callGetSubjectByIdApi,
  callUpdateSubjectApi,
  callDeleteSubjectApi,
  callGetAllsubjectssApi,
} from "@/service/service";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { Search, Plus, Trash2, Edit, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import GlobalLoader from "@/components/common/GlobalLoader";

const subjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().min(2, "Description must be at least 2 characters"),
});

const Subjects = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  const fetchSubjects = async () => {
    try {
      const response = await callGetAllsubjectssApi();
      setSubjects(response?.subjects || []);
      setFilteredSubjects(response?.subjects || []);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      toast.error("Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    const results = subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSubjects(results);
  }, [searchTerm, subjects]);

  const handleNewSubject = () => {
    form.reset({
      name: "",
      code: "",
      description: "",
    });
    setSelectedSubject(null);
  };

  const handleSubmit = async (data) => {
    if (isSubmitting) return; // Prevent multiple submissions
    setIsSubmitting(true);
    try {
      if (selectedSubject) {
        await callUpdateSubjectApi(selectedSubject._id, data);
        toast.success("Subject updated successfully!");
      } else {
        await callCreateSubjectApi(data);
        toast.success("Subject created successfully!");
      }
      form.reset({
        name: "",
        code: "",
        description: "",
      });
      setSelectedSubject(null);
      await fetchSubjects();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await callDeleteSubjectApi(id);
      toast.success("Subject deleted successfully!");
      await fetchSubjects();
      if (selectedSubject?._id === id) handleNewSubject();
    } catch (error) {
      toast.error(error.message || "Delete failed");
    }
  };
  if (loading) return <GlobalLoader />;
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <Button
        variant="outline"
        className="text-black"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subjects..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
        <Button onClick={handleNewSubject} className="gap-2">
          <Plus className="h-4 w-4" />
          New Subject
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Subject List */}
        <Card className="lg:col-span-1 max-h-[500px] overflow-auto">
          <CardHeader>
            <CardTitle>Subject List</CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))
            ) : filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => (
                <Button
                  key={subject._id}
                  variant={
                    selectedSubject?._id === subject._id ? "secondary" : "ghost"
                  }
                  onClick={() => {
                    setSelectedSubject(subject);
                    form.reset(subject);
                  }}
                  className="w-full justify-start h-12 text-left px-3"
                >
                  <div className="truncate">
                    <p className="font-medium">{subject.name}</p>
                    {/* <p className="text-sm text-muted-foreground">
                      Code: {subject.code}
                    </p> */}
                    {/* <p className="text-xs text-muted-foreground truncate">
                      {subject.description}
                    </p> */}
                  </div>
                </Button>
              ))
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No subjects found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="min-h-[600px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {selectedSubject ? "Edit Subject" : "Create New Subject"}
              </CardTitle>
              {selectedSubject && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Subject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this subject? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(selectedSubject._id)}
                      >
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardHeader>
            <CardContent>
              <CommonForm
                formControls={SubjectFormControls}
                form={form}
                handleSubmit={form.handleSubmit(handleSubmit)}
                btnText={
                  isSubmitting
                    ? selectedSubject
                      ? "Saving..."
                      : "Creating..."
                    : selectedSubject
                    ? "Save Changes"
                    : "Create Subject"
                }
                btnDisabled={isSubmitting}
                customLayout={{
                  grid: [["name", "code"], ["description"]],
                  gridClassName: "grid grid-cols-1 gap-4 md:grid-cols-2",
                  fullWidthFields: ["description"],
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Subjects;
