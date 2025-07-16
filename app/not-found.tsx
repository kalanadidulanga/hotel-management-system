"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      {/* Error Icon */}
      <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
        <AlertTriangle className="w-10 h-10 text-primary" />
      </div>

      {/* Error Code & Message */}
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-bold text-primary">404</h1>
        <h2 className="text-xl font-semibold text-foreground">
          Page Not Found
        </h2>
        <p className="text-muted-foreground max-w-md">
          Oops! The page you're looking for doesn't exist in our hotel
          management system.
        </p>
      </div>

      {/* Suggested Actions */}
      <div className="bg-accent/30 border border-accent-foreground/20 rounded-lg p-4 text-center">
        <span className="text-sm font-medium text-accent-foreground">
          What you can do:
        </span>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
          <li>• Check the URL for any typos</li>
          <li>• Use the navigation menu to find what you need</li>
          <li>• Go back to the previous page</li>
          <li>• Return to the dashboard</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={() => window.history.back()}
          variant="outline"
          className="border-border hover:bg-accent hover:text-accent-foreground"
        >
          Go Back
        </Button>

        <Link href="/">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
