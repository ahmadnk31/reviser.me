import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "../actions";
import { SubmitButton } from "@/components/submit-button";
import { FormMessage, Message } from "@/components/form-message";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import Link from "next/link";

export default async function ForgotPassword(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex items-center bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 justify-center min-h-screen  px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email address"
                required
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <SubmitButton
              formAction={forgotPasswordAction}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Send Reset Link
            </SubmitButton>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <FormMessage message={searchParams} />
          <Link
            href="/login"
            className="flex items-center justify-center text-sm dark:text-muted-foreground hover:dark:text-primary text-gray-600 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

