/**
 * Virus scanning service for uploaded files
 */

interface ScanResult {
  isClean: boolean;
  threats: string[];
  scanTime: number;
}

/**
 * Scan file for viruses and malware
 */
export const scanFile = async (file: File): Promise<ScanResult> => {
  const startTime = Date.now();
  
  try {
    // Basic file validation checks
    const threats: string[] = [];
    
    // Check file size (files over 100MB are suspicious)
    if (file.size > 100 * 1024 * 1024) {
      threats.push('Suspicious file size');
    }
    
    // Check for suspicious file extensions
    const suspiciousExtensions = [
      '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar',
      '.app', '.deb', '.pkg', '.dmg', '.run', '.msi', '.dll', '.sys'
    ];
    
    const fileName = file.name.toLowerCase();
    const hasSuspiciousExtension = suspiciousExtensions.some(ext => fileName.endsWith(ext));
    
    if (hasSuspiciousExtension) {
      threats.push('Suspicious file extension');
    }
    
    // Check for double extensions (e.g., file.pdf.exe)
    const extensionCount = (fileName.match(/\./g) || []).length;
    if (extensionCount > 1) {
      const parts = fileName.split('.');
      if (parts.length > 2) {
        const secondLastExt = '.' + parts[parts.length - 2];
        if (suspiciousExtensions.includes(secondLastExt)) {
          threats.push('Double extension detected');
        }
      }
    }
    
    // Check file content headers (magic numbers)
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer.slice(0, 16));
    
    // Check for executable signatures
    const executableSignatures = [
      [0x4D, 0x5A], // PE executable (Windows)
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable (Linux)
      [0xCF, 0xFA, 0xED, 0xFE], // Mach-O executable (macOS)
      [0xFE, 0xED, 0xFA, 0xCE], // Mach-O executable (macOS, big-endian)
    ];
    
    for (const signature of executableSignatures) {
      if (signature.every((byte, index) => uint8Array[index] === byte)) {
        threats.push('Executable file detected');
        break;
      }
    }
    
    // Simulate external virus scanner API call
    // In production, this would integrate with ClamAV, VirusTotal, or similar
    await simulateVirusScan(file);
    
    const scanTime = Date.now() - startTime;
    
    return {
      isClean: threats.length === 0,
      threats,
      scanTime
    };
    
  } catch (error) {
    console.error('Virus scan failed:', error);
    return {
      isClean: false,
      threats: ['Scan failed - file rejected for security'],
      scanTime: Date.now() - startTime
    };
  }
};

/**
 * Simulate external virus scanner
 */
const simulateVirusScan = async (file: File): Promise<void> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
  
  // In production, this would make actual API calls to:
  // - ClamAV REST API
  // - VirusTotal API
  // - Windows Defender API
  // - Custom antivirus solutions
};

/**
 * Check if file type is allowed for upload
 */
export const isFileTypeAllowed = (file: File): boolean => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  return allowedTypes.includes(file.type);
};

/**
 * Comprehensive file security check
 */
export const performSecurityCheck = async (file: File): Promise<{
  passed: boolean;
  issues: string[];
  scanResult: ScanResult;
}> => {
  const issues: string[] = [];
  
  // Check file type
  if (!isFileTypeAllowed(file)) {
    issues.push(`File type ${file.type} not allowed`);
  }
  
  // Check file size
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    issues.push(`File size exceeds ${maxSize} bytes`);
  }
  
  // Check filename
  if (file.name.length > 255) {
    issues.push('Filename too long');
  }
  
  // Perform virus scan
  const scanResult = await scanFile(file);
  if (!scanResult.isClean) {
    issues.push(...scanResult.threats);
  }
  
  return {
    passed: issues.length === 0,
    issues,
    scanResult
  };
};
