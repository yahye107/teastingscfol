import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
 // Assuming this hook provides the logged-in user
import {
    callGetAllClassroomsApi,
    callGetAllsubjectssApi,
    callCreateAssignmentApi,
    callGetTeacherAssignmentsApi,
} from "@/service/service"; // Assuming these are your API service calls
import CommonForm from '@/components/common/CommonForm'; // Assuming this is your reusable form component
import { TeacherAssignmentFormControls } from '@/config'; // Assuming this holds the form structure configuration
import { useUser } from '@/useContaxt/UseContext';
import { toast } from 'sonner';


// Validation schema for the assignment creation form
const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  link: z.string().url("A valid URL for the assignment link is required"),
  classroomId: z.string().min(1, "You must select a class"),
  subjectId: z.string().min(1, "You must select a subject"),
});

/**
 * A component for teachers to create and view their assignments.
 */
const Assignments = () => {
    // Get the current user from the context
    const { user } = useUser();

    // State for managing data, loading status, and UI
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // React Hook Form setup
    const form = useForm({
        resolver: zodResolver(assignmentSchema),
        defaultValues: {
            title: "",
            description: "",
            link: "",
            classroomId: "",
            subjectId: "",
        },
    });

    // Effect to fetch initial data for form dropdowns (classes and subjects)
    useEffect(() => {
        const fetchFormData = async () => {
            try {
                // Fetch classrooms and subjects in parallel
                const [classesRes, subjectsRes] = await Promise.all([
                    callGetAllClassroomsApi(),
                    callGetAllsubjectssApi(),
                ]);

                setClasses(classesRes?.classrooms || []);
                setSubjects(subjectsRes?.subjects || []);
            } catch (error) {
                console.error("Failed to load form data:", error);
                toast.error("Couldn't load data for the form. Please refresh.");
            }
        };

        fetchFormData();
    }, []);

    // Effect to fetch assignments created by the current teacher
    useEffect(() => {
        const fetchTeacherAssignments = async () => {
            if (!user?._id) return; // Don't fetch if user is not available

            setIsLoading(true);
            try {
                const response = await callGetTeacherAssignmentsApi(user._id);
                console.log("Fetched assignments:", response);
                setAssignments(response?.data?.assignments || []);
            } catch (error) {
                console.error("Failed to fetch assignments:", error);
                toast.error("Failed to load your assignments.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchTeacherAssignments();
        // This effect depends on the user's ID
    }, [user]);

    // Function to handle the form submission
    const handleCreateAssignment = async (data) => {
        if (!user?._id) {
            toast.error("You must be logged in to create an assignment.");
            return;
        }
        setIsSubmitting(true);
        try {
            // Include the teacher's ID with the form data
            const payload = { ...data, teacherId: user._id };
            await callCreateAssignmentApi(payload);

            toast.success("Assignment created successfully!");
            form.reset(); // Clear the form fields

            // Refetch assignments to show the newly created one
            const response = await callGetTeacherAssignmentsApi(user._id);
            setAssignments(response?.assignments || []);
        } catch (error) {
            console.error("Assignment creation failed:", error);
            toast.error("Could not create the assignment. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Enhance form controls with dynamic options from state
    const enhancedFormControls = TeacherAssignmentFormControls.map((control) => {
        if (control.id === "classroomId") {
            return {
                ...control,
                options: classes.map((cls) => ({
                    label: `Grade ${cls.grade} - ${cls.section}`,
                    value: cls._id,
                })),
            };
        }
        if (control.id === "subjectId") {
            return {
                ...control,
                options: subjects.map((subject) => ({
                    label: subject.name,
                    value: subject._id,
                })),
            };
        }
        return control;
    });

    return (
        <div className="p-4 md:p-6 space-y-8">
            {/* Section to Create a New Assignment */}
            <div>
                <h1 className="text-2xl font-bold mb-4">Create New Assignment</h1>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <CommonForm
                        formControls={enhancedFormControls}
                        form={form}
                        handleSubmit={handleCreateAssignment}
                        btnText={isSubmitting ? "Creating..." : "Create Assignment"}
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>

            {/* Divider */}
            <hr className="border-gray-200" />

            {/* Section to Display Existing Assignments */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Your Assignments</h2>
                {isLoading ? (
                    <p>Loading assignments...</p>
                ) : assignments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {assignments.map((assignment) => (
                            <div key={assignment._id} className="bg-white p-5 rounded-lg shadow-md border-l-4 border-blue-500">
                                <h3 className="text-lg font-semibold text-gray-800">
  {new Date(assignment.createdAt).toLocaleString("en-GB", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })}
</h3>

                                <h3 className="text-lg font-semibold text-gray-800">{assignment.title}</h3>
                                <p className="text-sm text-gray-600 mt-2">{assignment.description}</p>
                                <div className="mt-4 text-xs text-gray-500 space-y-1">
                                     <p><strong>Class:</strong> {assignment.classroom?.grade} {assignment.classroom?.section}</p>
                                     <p><strong>Subject:</strong> {assignment.subject?.name}</p>
                                </div>
                                <a
                                    href={assignment.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-3 inline-block"
                                >
                                    View Assignment Link
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-4 bg-gray-50 rounded-lg">
                       <p className="text-gray-500">You haven't created any assignments yet.</p>
                       <p className="text-sm text-gray-400 mt-1">Use the form above to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Assignments;