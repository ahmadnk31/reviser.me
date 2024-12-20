import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from 'lucide-react';

export default async function ResetPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 min-h-screen px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your new password to reset your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                New Password
              </Label>
              <Input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your new password"
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                Confirm New Password
              </Label>
              <Input
                type="password"
                id="confirm-password"
                name="confirm-password"
                placeholder="Confirm your new password"
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <SubmitButton
              formAction={resetPasswordAction}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Reset Password
            </SubmitButton>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <FormMessage message={searchParams} />
          <Link
            href="/login"
            className="flex items-center justify-center text-sm text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

