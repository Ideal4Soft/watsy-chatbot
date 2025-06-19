/**
 * Form Field Component
 * 
 * A comprehensive form field component that includes:
 * - Label with optional required indicator
 * - Input field with error states
 * - Error message display
 * - Help text support
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"

export interface FormFieldProps {
  label: string
  name: string
  type?: string
  placeholder?: string
  value?: string
  error?: string
  helpText?: string
  required?: boolean
  disabled?: boolean
  className?: string
  inputClassName?: string
  showPasswordStrength?: boolean
  passwordStrength?: number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({
    label,
    name,
    type = "text",
    placeholder,
    value,
    error,
    helpText,
    required = false,
    disabled = false,
    className,
    inputClassName,
    showPasswordStrength = false,
    passwordStrength = 0,
    onChange,
    onBlur,
    ...props
  }, ref) => {
    const inputId = `field-${name}`
    const errorId = `${inputId}-error`
    const helpId = `${inputId}-help`

    return (
      <div className={cn("space-y-2", className)}>
        <Label 
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            error && "text-destructive"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        
        {type === "password" ? (
          <PasswordInput
            id={inputId}
            name={name}
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            className={cn(
              error && "border-destructive focus-visible:ring-destructive",
              inputClassName
            )}
            showStrengthIndicator={showPasswordStrength}
            strengthScore={passwordStrength}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={cn(
              error && errorId,
              helpText && helpId
            )}
            ref={ref}
            {...props}
          />
        ) : (
          <Input
            id={inputId}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            className={cn(
              error && "border-destructive focus-visible:ring-destructive",
              inputClassName
            )}
            onChange={onChange}
            onBlur={onBlur}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={cn(
              error && errorId,
              helpText && helpId
            )}
            ref={ref}
            {...props}
          />
        )}
        
        {helpText && !error && (
          <p id={helpId} className="text-sm text-muted-foreground">
            {helpText}
          </p>
        )}
        
        {error && (
          <p id={errorId} className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }
)
FormField.displayName = "FormField"

export { FormField }
