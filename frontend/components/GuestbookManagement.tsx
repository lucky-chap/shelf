import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Check, X, Download, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CardLoadingSkeleton } from "./LoadingSkeleton";
import LoadingSpinner from "./LoadingSpinner";
import ErrorBoundary from "./ErrorBoundary";
import backend from "~backend/client";

function GuestbookManagementContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const approvedEntriesQuery = useQuery({
    queryKey: ["guestbook", "approved"],
    queryFn: async () => {
      return await backend.guestbook.list({ approved: true });
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const pendingEntriesQuery = useQuery({
    queryKey: ["guestbook", "pending"],
    queryFn: async () => {
      return await backend.guestbook.list({ approved: false });
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: number; isApproved: boolean }) => {
      return await backend.guestbook.moderate({ id, isApproved });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Entry Moderated",
        description: `Entry ${variables.isApproved ? 'approved' : 'rejected'} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["guestbook"] });
    },
    onError: (error: any) => {
      console.error("Failed to moderate entry:", error);
      toast({
        title: "Moderation Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (format: "json" | "csv") => {
      return await backend.guestbook.exportEntries({ format });
    },
    onSuccess: (data) => {
      const blob = new Blob([data.data], { type: data.contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Guestbook exported as ${data.filename}`,
      });
    },
    onError: (error: any) => {
      console.error("Failed to export guestbook:", error);
      toast({
        title: "Export Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExport = (format: "json" | "csv") => {
    exportMutation.mutate(format);
  };

  const handleModerate = (id: number, isApproved: boolean) => {
    moderateMutation.mutate({ id, isApproved });
  };

  const isLoading = approvedEntriesQuery.isLoading || pendingEntriesQuery.isLoading;
  const hasError = approvedEntriesQuery.isError || pendingEntriesQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manage Guestbook</CardTitle>
                <CardDescription>Moderate messages and export data</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button disabled variant="outline" size="sm">
                  <FileText className="h-4 w-4" />
                  Export JSON
                </Button>
                <Button disabled variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardLoadingSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasError) {
    const error = approvedEntriesQuery.error || pendingEntriesQuery.error;
    return (
      <Card className="border-destructive">
        <CardContent className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Failed to load guestbook entries</p>
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const approvedEntries = approvedEntriesQuery.data?.entries || [];
  const pendingEntries = pendingEntriesQuery.data?.entries || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Manage Guestbook</CardTitle>
              <CardDescription>Moderate messages and export data</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("json")}
                disabled={exportMutation.isPending}
                className="flex items-center gap-2"
              >
                {exportMutation.isPending && exportMutation.variables === "json" ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport("csv")}
                disabled={exportMutation.isPending}
                className="flex items-center gap-2"
              >
                {exportMutation.isPending && exportMutation.variables === "csv" ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                Pending
                {pendingEntries.length > 0 && (
                  <Badge variant="secondary">{pendingEntries.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                Approved
                {approvedEntries.length > 0 && (
                  <Badge variant="secondary">{approvedEntries.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingEntries.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending messages</p>
                  <p className="text-sm text-muted-foreground">All messages are up to date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingEntries.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{entry.emoji}</span>
                          <span className="font-medium text-foreground">
                            {entry.nickname || "Anonymous"}
                          </span>
                          <Badge variant="outline">Pending</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-foreground">{entry.message}</p>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex items-center gap-2"
                          onClick={() => handleModerate(entry.id, true)}
                          disabled={moderateMutation.isPending}
                        >
                          {moderateMutation.isPending && moderateMutation.variables?.id === entry.id && moderateMutation.variables?.isApproved ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-2"
                          onClick={() => handleModerate(entry.id, false)}
                          disabled={moderateMutation.isPending}
                        >
                          {moderateMutation.isPending && moderateMutation.variables?.id === entry.id && !moderateMutation.variables?.isApproved ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved">
              {approvedEntries.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No approved messages yet</p>
                  <p className="text-sm text-muted-foreground">Approved messages will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {approvedEntries.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{entry.emoji}</span>
                          <span className="font-medium text-foreground">
                            {entry.nickname || "Anonymous"}
                          </span>
                          <Badge variant="secondary">Approved</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-foreground">{entry.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GuestbookManagement() {
  return (
    <ErrorBoundary>
      <GuestbookManagementContent />
    </ErrorBoundary>
  );
}
