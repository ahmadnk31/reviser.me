import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SubscriptionMessage() {
  return (
    <div className="flex justify-center items-center h-[70vh]">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="bg-accent text-card-foreground p-4 rounded-t-lg">
          <CardTitle className="text-2xl font-bold">Subscription Required</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-muted-foreground mb-4">
            To access this feature, please subscribe to one of our plans. Enjoy unlimited access to premium content and features.
          </p>
          <Link href="/pricing">
          <Button 
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            View Plans
          </Button>
            </Link>
        </CardContent>
      </Card>
    </div>
  );
}