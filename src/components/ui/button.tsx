import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        variant === "primary" && "bg-white text-black hover:bg-gray-200",
        variant === "secondary" && "bg-gray-800 text-white hover:bg-gray-700",
        variant === "outline" && "border border-gray-700 text-white hover:bg-gray-800",
        variant === "ghost" && "text-gray-400 hover:text-white",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        className
      )}
      {...props}
    />
  )
}
