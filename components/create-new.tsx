import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import { FileUploader } from "./document-quiz-upload";
import { UploadCloud } from "lucide-react";
import { Card } from "./ui/card";

  export default function CreateNew() {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Card className="p-4 flex items-center justify-center cursor-pointer">
           <UploadCloud className="size-8 text-muted-foreground" />
            </Card>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New</AlertDialogTitle>
          </AlertDialogHeader>
          <FileUploader />
          <AlertDialogFooter>
          <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }