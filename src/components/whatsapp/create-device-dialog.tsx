/**
 * Create Device Dialog Component
 * 
 * This component provides a form for creating new WhatsApp devices.
 * It includes validation, error handling, and user feedback.
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, RefreshCw } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createWhatsAppDevice } from '@/app/actions/whatsapp-devices'

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const createDeviceSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(50, 'Device name too long'),
  description: z.string().optional()
})

type CreateDeviceForm = z.infer<typeof createDeviceSchema>

// ============================================================================
// TYPES
// ============================================================================

interface CreateDeviceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeviceCreated: () => void
}

// ============================================================================
// CREATE DEVICE DIALOG COMPONENT
// ============================================================================

export function CreateDeviceDialog({ 
  open, 
  onOpenChange, 
  onDeviceCreated 
}: CreateDeviceDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<CreateDeviceForm>({
    resolver: zodResolver(createDeviceSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  })

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const onSubmit = async (data: CreateDeviceForm) => {
    try {
      setLoading(true)
      
      const result = await createWhatsAppDevice(data)
      
      if (result.success) {
        toast.success(result.message || 'Device created successfully')

        form.reset()
        onDeviceCreated()
      } else {
        toast.error(result.error || 'Failed to create device')
      }
    } catch (error) {
      toast.error('Failed to create device')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    form.reset()
    onOpenChange(false)
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add WhatsApp Device</DialogTitle>
          <DialogDescription>
            Create a new WhatsApp device connection for your account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Device Name *</Label>
            <Input
              id="name"
              placeholder="e.g., My Business Phone"
              {...form.register('name')}
              disabled={loading}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this device..."
              rows={3}
              {...form.register('description')}
              disabled={loading}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Device
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
