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
import { cn } from "@/lib/utils";

  export default function CreateNew({active}:{active:boolean}) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild disabled={active}>
          <Card className={cn("p-4 flex items-center justify-center cursor-pointer", active && "pointer-events-none opacity-50")}>
           <UploadCloud className="size-8 text-muted-foreground" />
            </Card>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New</AlertDialogTitle>
          </AlertDialogHeader>
          <FileUploader active={active} />
          <AlertDialogFooter>
          <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }