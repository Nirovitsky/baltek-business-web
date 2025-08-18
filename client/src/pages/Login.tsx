import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Redirect } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { loginSchema, type LoginRequest } from "@shared/schema";
import { Building2 } from "lucide-react";

export default function Login() {
  const { toast } = useToast();
  const { login, isAuthenticated, isLoading, hasOrganizations } = useAuth();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  // Redirect authenticated users based on organization status
  if (isAuthenticated) {
    // If still loading organization data, don't redirect yet
    if (isLoading) {
      return (
        <div className="auth-page min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Checking your account...</p>
          </div>
        </div>
      );
    }
    
    // Redirect based on organization status
    return <Redirect to={hasOrganizations ? "/" : "/create-organization"} />;
  }

  const onSubmit = async (data: LoginRequest) => {
    try {
      // Use phone number as provided - API expects exactly 8 digits
      await login(data);
      toast({
        title: "Login successful",
        description: "Welcome to baltek business dashboard",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="auth-page min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">baltek business</CardTitle>
          <CardDescription>Sign in to your dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative flex">
                        <div className="flex items-center px-3 bg-background border border-r-0 border rounded-l-md">
                          <span className="text-muted-foreground text-sm font-medium">+993</span>
                        </div>
                        <Input
                          type="tel"
                          placeholder="Enter your phone number"
                          maxLength={8}
                          {...field}
                          disabled={isLoading}
                          className="rounded-l-none"
                          onChange={(e) => {
                            // Only allow digits and limit to 8 characters
                            const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                            field.onChange(value);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
