/**
 * WhatsApp Devices Page
 * 
 * This page provides the main interface for managing WhatsApp devices.
 * It includes the device dashboard with real-time status updates,
 * device creation, pairing, and management capabilities.
 */

import { Metadata } from 'next'
import { DeviceDashboard } from '@/components/whatsapp/device-dashboard'

export const metadata: Metadata = {
  title: 'WhatsApp Devices | Watsy-Chatbot',
  description: 'Manage your WhatsApp device connections and monitor their status in real-time.',
}

export default function DevicesPage() {
  return (
    <div className="container mx-auto py-6">
      <DeviceDashboard />
    </div>
  )
}
