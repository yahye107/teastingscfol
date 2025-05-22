import {
  callGetAllParentsApi,
  callGetParentChildrenApi,
} from "@/service/service";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GlobalLoader from "@/components/common/GlobalLoader";

const ParantsInfo = () => {
  const [allParents, setAllParents] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParent, setSelectedParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchParents = async () => {
      try {
        const data = await callGetAllParentsApi();
        // Get last 5 registered parents (assuming they're ordered by registration date)
        const recentParents = data.parents.slice(-5);
        setAllParents(recentParents);
        setFilteredParents(recentParents);
      } catch (error) {
        console.error("Error fetching parents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchParents();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    const results = allParents.filter((parent) =>
      parent.user?.fullName?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredParents(results);
  };

  const handleSelect = async (parent) => {
    try {
      setLoading(true);
      setSelectedParent(parent);
      const res = await callGetParentChildrenApi(parent._id);
      setChildren(Array.isArray(res.children) ? res.children : []);
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) return <GlobalLoader />;
  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="space-y-2 text-black">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Recent Parents</h1>
        <div className="relative">
          <Input
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search recent parents..."
            className="pl-10"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Parents List */}
        <Card className="lg:col-span-1">
          <CardContent className="p-2 space-y-2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))
            ) : filteredParents.length > 0 ? (
              filteredParents.map((parent) => (
                <Button
                  key={parent._id}
                  variant={
                    selectedParent?._id === parent._id ? "secondary" : "ghost"
                  }
                  onClick={() => handleSelect(parent)}
                  className="w-full justify-start h-12 text-left px-3"
                >
                  <div className="truncate">
                    <p className="font-medium">{parent.user?.fullName}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {parent.user?.email}
                    </p>
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No parents found
              </p>
            )}
          </CardContent>
        </Card>

        {/* Parent & Children Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedParent ? (
            <>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <DetailItem
                      label="Name"
                      value={selectedParent.user?.fullName}
                    />
                    <DetailItem
                      label="Email"
                      value={selectedParent.user?.email}
                    />
                    <DetailItem
                      label="Contact"
                      value={selectedParent.contact}
                    />
                    <DetailItem
                      label="Address"
                      value={selectedParent.address}
                    />
                    <DetailItem
                      label="Password"
                      value={selectedParent.user?.rawPassword}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Children</h2>
                    <Badge variant="outline">{children.length}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table className="min-w-[600px] lg:min-w-0">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Date of Birth</TableHead>
                        <TableHead>Class</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {children.map((child) => (
                        <TableRow key={child._id}>
                          <TableCell className="font-medium">
                            {child.user?.fullName}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {child.user?.email}
                          </TableCell>
                          <TableCell>
                            {child.dob
                              ? new Date(child.dob).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {child.classId
                              ? `${child.classId.name} - ${child.classId.section}`
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {children.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No children found
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="h-48 flex items-center justify-center">
                <p className="text-muted-foreground">
                  Select a parent to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="font-medium truncate">{value || "N/A"}</p>
  </div>
);

export default ParantsInfo;
