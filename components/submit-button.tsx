'use client'
import { useFormStatus } from "react-dom";
import { Button } from "./ui/button";
import { ComponentProps } from "react";
type Props=ComponentProps<typeof Button> & {
    pendingText?:string;
}
export function SubmitButton({ children,pendingText='submitting',...props }: Props) {
    const { pending } = useFormStatus();
  return (
    <Button
    disabled={pending}
    aria-disabled={pending}
    {...props}
      type="submit"
    >
      {
        pending ?pendingText : children
      }
    </Button>
  );
}