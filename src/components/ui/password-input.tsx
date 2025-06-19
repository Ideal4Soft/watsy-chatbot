/**
 * Password Input Component with Show/Hide Toggle
 * 
 * A specialized input component for password fields that includes:
 * - Toggle visibility functionality
 * - Password strength indicator
 * - Proper accessibility attributes
 */

"use client"

import * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showStrengthIndicator?: boolean
  strengthScore?: number
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showStrengthIndicator = false, strengthScore = 0, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
    }

    const getStrengthColor = (score: number) => {
      if (score < 25) return "bg-red-500"
      if (score < 50) return "bg-orange-500"
      if (score < 75) return "bg-yellow-500"
      return "bg-green-500"
    }

    const getStrengthText = (score: number) => {
      if (score < 25) return "Weak"
      if (score < 50) return "Fair"
      if (score < 75) return "Good"
      return "Strong"
    }

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={togglePasswordVisibility}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-500" />
          ) : (
            <Eye className="h-4 w-4 text-gray-500" />
          )}
        </Button>
        
        {showStrengthIndicator && props.value && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Password strength:</span>
              <span className={cn(
                "font-medium",
                strengthScore < 25 ? "text-red-600" :
                strengthScore < 50 ? "text-orange-600" :
                strengthScore < 75 ? "text-yellow-600" :
                "text-green-600"
              )}>
                {getStrengthText(strengthScore)}
              </span>
            </div>
            <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300 ease-out",
                  getStrengthColor(strengthScore)
                )}
                style={{ width: `${strengthScore}%` }}
              />
            </div>
          </div>
        )}
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
