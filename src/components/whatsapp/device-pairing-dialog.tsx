/**
 * Device Pairing Dialog Component
 * 
 * This component provides a comprehensive interface for pairing WhatsApp devices
 * using QR codes or pairing codes. It includes real-time status updates,
 * timeout handling, and user-friendly error messages.
 */

'use client'

import { useState, useEffect } from 'react'
import { QrCode, Smartphone, RefreshCw, Copy, Check, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  generateDeviceQRCode, 
  generateDevicePairingCode, 
  validateDevicePairingCode,
  getDevicePairingStatus,
  cancelDevicePairing
} from '@/app/actions/whatsapp-devices'

// ============================================================================
// TYPES
// ============================================================================

interface DevicePairingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deviceId: string
  onPairingComplete: () => void
}

interface PairingData {
  qrCode?: string
  pairingCode?: string
  expiresAt?: Date
  isExpired: boolean
}

// ============================================================================
// DEVICE PAIRING DIALOG COMPONENT
// ============================================================================

export function DevicePairingDialog({ 
  open, 
  onOpenChange, 
  deviceId, 
  onPairingComplete 
}: DevicePairingDialogProps) {
  const [activeTab, setActiveTab] = useState('qr')
  const [pairingData, setPairingData] = useState<PairingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [enteredCode, setEnteredCode] = useState('')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  
  const { toast } = useToast()

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (open) {
      generateQRCode()
    } else {
      // Reset state when dialog closes
      setPairingData(null)
      setPhoneNumber('')
      setEnteredCode('')
      setTimeLeft(null)
      setCopied(false)
    }
  }, [open])

  useEffect(() => {
    // Setup countdown timer
    if (pairingData?.expiresAt && !pairingData.isExpired) {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        const expiry = new Date(pairingData.expiresAt!).getTime()
        const remaining = Math.max(0, expiry - now)
        
        setTimeLeft(Math.floor(remaining / 1000))
        
        if (remaining <= 0) {
          setPairingData(prev => prev ? { ...prev, isExpired: true } : null)
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [pairingData])

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const generateQRCode = async () => {
    try {
      setLoading(true)
      const result = await generateDeviceQRCode({ deviceId })
      
      if (result.success && result.data) {
        setPairingData(result.data)
      } else {
        toast.error(result.error || 'Failed to generate QR code')
      }
    } catch (error) {
      toast.error('Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  const generatePairingCodeHandler = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    try {
      setLoading(true)
      const result = await generateDevicePairingCode({
        deviceId,
        phoneNumber: phoneNumber.trim()
      })

      if (result.success && result.data) {
        setPairingData(result.data)
      } else {
        toast.error(result.error || 'Failed to generate pairing code')
      }
    } catch (error) {
      toast.error('Failed to generate pairing code')
    } finally {
      setLoading(false)
    }
  }

  const validatePairingCodeHandler = async () => {
    if (!enteredCode.trim()) {
      toast.error('Please enter the pairing code')
      return
    }

    try {
      setLoading(true)
      const result = await validateDevicePairingCode({
        deviceId,
        pairingCode: enteredCode.trim()
      })

      if (result.success) {
        toast.success('Pairing code validated successfully')
        onPairingComplete()
      } else {
        toast.error(result.error || 'Invalid pairing code')
      }
    } catch (error) {
      toast.error('Failed to validate pairing code')
    } finally {
      setLoading(false)
    }
  }

  const refreshPairing = async () => {
    if (activeTab === 'qr') {
      await generateQRCode()
    } else {
      await generatePairingCodeHandler()
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Pairing code copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleCancel = async () => {
    try {
      await cancelDevicePairing(deviceId)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to cancel pairing:', error)
      onOpenChange(false)
    }
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pair WhatsApp Device</DialogTitle>
          <DialogDescription>
            Choose your preferred method to connect your WhatsApp device
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Pairing Code
            </TabsTrigger>
          </TabsList>

          {/* QR Code Tab */}
          <TabsContent value="qr" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scan QR Code</CardTitle>
                <CardDescription>
                  Open WhatsApp on your phone and scan this QR code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                ) : pairingData?.qrCode ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <img 
                        src={pairingData.qrCode} 
                        alt="QR Code" 
                        className="w-64 h-64 border rounded-lg"
                      />
                    </div>
                    
                    {timeLeft !== null && (
                      <div className="text-center">
                        <Badge variant={timeLeft > 60 ? 'default' : 'destructive'}>
                          Expires in {formatTime(timeLeft)}
                        </Badge>
                      </div>
                    )}
                    
                    {pairingData.isExpired && (
                      <div className="flex items-center justify-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">QR code has expired</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <QrCode className="h-12 w-12 mx-auto mb-2" />
                      <p>Failed to generate QR code</p>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={refreshPairing} 
                    disabled={loading}
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pairing Code Tab */}
          <TabsContent value="code" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pairing Code</CardTitle>
                <CardDescription>
                  Enter your phone number to get a pairing code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={generatePairingCodeHandler} 
                  disabled={loading || !phoneNumber.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Smartphone className="h-4 w-4 mr-2" />
                  )}
                  Generate Pairing Code
                </Button>
                
                {pairingData?.pairingCode && (
                  <div className="space-y-4">
                    <Separator />
                    
                    <div className="space-y-2">
                      <Label>Your Pairing Code</Label>
                      <div className="flex gap-2">
                        <Input
                          value={pairingData.pairingCode}
                          readOnly
                          className="font-mono text-lg text-center"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(pairingData.pairingCode!)}
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {timeLeft !== null && (
                      <div className="text-center">
                        <Badge variant={timeLeft > 60 ? 'default' : 'destructive'}>
                          Expires in {formatTime(timeLeft)}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="entered-code">Enter Code from WhatsApp</Label>
                      <Input
                        id="entered-code"
                        placeholder="Enter the code from WhatsApp"
                        value={enteredCode}
                        onChange={(e) => setEnteredCode(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      onClick={validatePairingCodeHandler} 
                      disabled={loading || !enteredCode.trim()}
                      className="w-full"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Validate Code
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
