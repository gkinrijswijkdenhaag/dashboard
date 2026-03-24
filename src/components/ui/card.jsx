import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const Card = forwardRef(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border border-gray-200 bg-white text-card-foreground shadow-sm transition-all duration-200",
      {
        "border-gray-300 hover:border-gray-400 hover:shadow-md":
          variant === "default",
        "border-blue-300 bg-blue-50 hover:border-blue-400 hover:shadow-md":
          variant === "primary",
        "border-green-300 bg-green-50 hover:border-green-400 hover:shadow-md":
          variant === "success",
        "border-red-300 bg-red-50 hover:border-red-400 hover:shadow-md":
          variant === "error",
        "border-yellow-300 bg-yellow-50 hover:border-yellow-400 hover:shadow-md":
          variant === "warning",
        "border-purple-300 bg-purple-50 hover:border-purple-400 hover:shadow-md":
          variant === "secondary",
        "border-gray-300 bg-gray-50 hover:border-gray-400 hover:shadow-md":
          variant === "subtle",
      },
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-5 border-b border-gray-100",
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-gray-900",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500 mt-1", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-5", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-5 pt-0 mt-2 border-t border-gray-100",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
