/**
 * Script to fix Prisma imports across the codebase
 */

const fs = require('fs')
const path = require('path')

// Files that need import fixes
const filesToFix = [
  'src/components/auth/protected-route.tsx',
  'src/lib/auth.ts',
  'src/lib/whatsapp/pairing.ts',
  'src/lib/whatsapp/security.ts',
  'src/lib/whatsapp/service.ts',
  'src/lib/whatsapp/session-manager.ts',
  'src/lib/whatsapp/types.ts',
  'src/lib/whatsapp/websocket-server.ts',
  'src/middleware.ts',
  'src/schemas/index.ts',
  'src/stores/auth.ts',
  'src/components/whatsapp/device-status-indicator.tsx'
]

// Import replacements
const importReplacements = [
  {
    from: "import { UserRole } from '@prisma/client'",
    to: "import { UserRole } from '@/generated/prisma'"
  },
  {
    from: "import { WhatsAppDeviceStatus } from '@prisma/client'",
    to: "import { WhatsAppDeviceStatus } from '@/generated/prisma'"
  }
]

function fixImportsInFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`)
      return
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false

    importReplacements.forEach(replacement => {
      if (content.includes(replacement.from)) {
        content = content.replace(replacement.from, replacement.to)
        modified = true
        console.log(`Fixed import in ${filePath}: ${replacement.from} -> ${replacement.to}`)
      }
    })

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`Updated ${filePath}`)
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message)
  }
}

console.log('Fixing Prisma imports...')

filesToFix.forEach(fixImportsInFile)

console.log('Import fixes completed!')
