"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LandmarkIcon } from "lucide-react";

import { ApiError } from "@/lib/api";
import { useMe, useLogin } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const me = useMe();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("admin@ugnay.local");
  const [password, setPassword] = useState("");

  // Already signed in → go to the dashboard.
  useEffect(() => {
    if (me.data) router.replace("/");
  }, [me.data, router]);

  const errorMessage =
    loginMutation.error instanceof ApiError
      ? loginMutation.error.message
      : loginMutation.error
        ? "Something went wrong. Please try again."
        : null;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LandmarkIcon className="size-4" />
        </div>
        UGNAY
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Access the Local Government platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              loginMutation.mutate(
                { email, password },
                { onSuccess: () => router.replace("/") },
              );
            }}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {errorMessage && (
              <p role="alert" className="text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <Button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted-foreground">
            Dev seed account:{" "}
            <span className="font-mono">admin@ugnay.local</span> /{" "}
            <span className="font-mono">Admin123!</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
