/**
 * Loading Button Component
 * 
 * A button component that shows loading state with spinner and disabled state.
 * Extends the base Button component with loading functionality.
 */

"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { type VariantProps } from "class-variance-authority"

export interface LoadingButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
  asChild?: boolean
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, children, loading = false, loadingText, disabled, variant, size, asChild, ...props }, ref) => {
    return (
      <Button
        className={cn(className)}
        disabled={disabled || loading}
        variant={variant}
        size={size}
        asChild={asChild}
        ref={ref}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {loading ? (loadingText || children) : children}
      </Button>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

export { LoadingButton }
