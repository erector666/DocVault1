import { auditLogger } from './auditLogger';
import { errorHandler } from './errorHandler';

interface SecurityPolicy {
  maxFileSize: number;
  allowedFileTypes: string[];
  maxFilesPerUser: number;
  maxFilesPerDay: number;
  requireTwoFactor: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

interface SecurityViolation {
  type: 'file_size' | 'file_type' | 'rate_limit' | 'suspicious_activity' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  userId?: string;
  timestamp: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

class SecurityEnforcer {
  private policy: SecurityPolicy;
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private loginAttempts: Map<string, { count: number; lockoutUntil?: number }> = new Map();
  private suspiciousIPs: Set<string> = new Set();
  private violations: SecurityViolation[] = [];

  constructor() {
    this.policy = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],
      maxFilesPerUser: 1000,
      maxFilesPerDay: 100,
      requireTwoFactor: false,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000 // 15 minutes
    };

    this.startCleanupTimer();
  }

  // File Security Validation
  public validateFile(file: File, userId: string): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check file size
    if (file.size > this.policy.maxFileSize) {
      violations.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${this.policy.maxFileSize / 1024 / 1024}MB`);
      this.recordViolation({
        type: 'file_size',
        severity: 'medium',
        details: { fileName: file.name, size: file.size, limit: this.policy.maxFileSize },
        userId,
        timestamp: Date.now()
      });
    }

    // Check file type
    if (!this.policy.allowedFileTypes.includes(file.type)) {
      violations.push(`File type ${file.type} is not allowed`);
      this.recordViolation({
        type: 'file_type',
        severity: 'high',
        details: { fileName: file.name, type: file.type, allowedTypes: this.policy.allowedFileTypes },
        userId,
        timestamp: Date.now()
      });
    }

    // Check for suspicious file names
    if (this.isSuspiciousFileName(file.name)) {
      violations.push('File name contains suspicious characters or patterns');
      this.recordViolation({
        type: 'suspicious_activity',
        severity: 'high',
        details: { fileName: file.name, reason: 'suspicious_filename' },
        userId,
        timestamp: Date.now()
      });
    }

    return { valid: violations.length === 0, violations };
  }

  private isSuspiciousFileName(fileName: string): boolean {
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com|dll)$/i,
      /\.(js|vbs|jar|app)$/i,
      /<script/i,
      /javascript:/i,
      /\.\./,
      /[<>:"|?*]/,
      /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(fileName));
  }

  // Rate Limiting
  public checkRateLimit(userId: string, action: string): { allowed: boolean; resetTime?: number } {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const entry = this.rateLimits.get(key);

    if (!entry) {
      this.rateLimits.set(key, {
        count: 1,
        resetTime: now + 60000, // 1 minute window
        blocked: false
      });
      return { allowed: true };
    }

    if (now > entry.resetTime) {
      // Reset the counter
      entry.count = 1;
      entry.resetTime = now + 60000;
      entry.blocked = false;
      return { allowed: true };
    }

    entry.count++;

    // Different limits for different actions
    const limits = {
      upload: 10,
      delete: 20,
      search: 100,
      login: 5
    };

    const limit = limits[action as keyof typeof limits] || 50;

    if (entry.count > limit) {
      entry.blocked = true;
      this.recordViolation({
        type: 'rate_limit',
        severity: 'medium',
        details: { action, count: entry.count, limit },
        userId,
        timestamp: now
      });
      return { allowed: false, resetTime: entry.resetTime };
    }

    return { allowed: true };
  }

  // Login Security
  public recordLoginAttempt(identifier: string, success: boolean, ip?: string): { allowed: boolean; lockoutUntil?: number } {
    const now = Date.now();
    const attempts = this.loginAttempts.get(identifier) || { count: 0 };

    if (attempts.lockoutUntil && now < attempts.lockoutUntil) {
      return { allowed: false, lockoutUntil: attempts.lockoutUntil };
    }

    if (success) {
      // Reset on successful login
      this.loginAttempts.delete(identifier);
      return { allowed: true };
    }

    attempts.count++;
    
    if (attempts.count >= this.policy.maxLoginAttempts) {
      attempts.lockoutUntil = now + this.policy.lockoutDuration;
      this.recordViolation({
        type: 'suspicious_activity',
        severity: 'high',
        details: { 
          reason: 'multiple_failed_logins',
          attempts: attempts.count,
          ip,
          lockoutUntil: attempts.lockoutUntil
        },
        timestamp: now
      });

      if (ip) {
        this.suspiciousIPs.add(ip);
      }
    }

    this.loginAttempts.set(identifier, attempts);
    return { allowed: attempts.lockoutUntil ? false : true, lockoutUntil: attempts.lockoutUntil };
  }

  // Content Security Policy
  public generateCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  // Session Security
  public validateSession(sessionData: any): { valid: boolean; reason?: string } {
    if (!sessionData || !sessionData.user || !sessionData.expires_at) {
      return { valid: false, reason: 'Invalid session data' };
    }

    const now = Date.now();
    const expiresAt = new Date(sessionData.expires_at).getTime();

    if (now > expiresAt) {
      return { valid: false, reason: 'Session expired' };
    }

    // Check for session hijacking indicators
    if (sessionData.user_agent && sessionData.user_agent !== navigator.userAgent) {
      this.recordViolation({
        type: 'suspicious_activity',
        severity: 'critical',
        details: {
          reason: 'session_hijacking_attempt',
          expectedUserAgent: sessionData.user_agent,
          actualUserAgent: navigator.userAgent
        },
        userId: sessionData.user.id,
        timestamp: now
      });
      return { valid: false, reason: 'Session security violation' };
    }

    return { valid: true };
  }

  // Input Sanitization
  public sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/\0/g, '') // Remove null bytes
      .trim();
  }

  // XSS Protection
  public escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // SQL Injection Protection (for client-side validation)
  public validateSearchQuery(query: string): { valid: boolean; sanitized: string } {
    const suspiciousPatterns = [
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi,
      /[';--]/,
      /\/\*.*\*\//,
      /@\w+/
    ];

    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(query));
    
    if (hasSuspiciousContent) {
      this.recordViolation({
        type: 'suspicious_activity',
        severity: 'high',
        details: { reason: 'sql_injection_attempt', query },
        timestamp: Date.now()
      });
    }

    const sanitized = query
      .replace(/[';--]/g, '')
      .replace(/\/\*.*\*\//g, '')
      .replace(/@\w+/g, '')
      .trim();

    return { valid: !hasSuspiciousContent, sanitized };
  }

  // Audit and Monitoring
  private recordViolation(violation: SecurityViolation): void {
    this.violations.push(violation);
    
    // Log to audit system
    auditLogger.logSecurityEvent(
      violation.userId || 'anonymous',
      violation.type,
      violation.severity === 'critical' ? 'critical' : violation.severity === 'high' ? 'error' : 'warning',
      violation.details
    );

    // Log to error handler for high/critical violations
    if (violation.severity === 'high' || violation.severity === 'critical') {
      errorHandler.logError(
        new Error(`Security violation: ${violation.type}`),
        undefined,
        violation.details
      );
    }

    // Keep only recent violations (last 1000)
    if (this.violations.length > 1000) {
      this.violations = this.violations.slice(-1000);
    }
  }

  public getViolations(userId?: string, hours: number = 24): SecurityViolation[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.violations.filter(v => 
      v.timestamp > cutoff && 
      (!userId || v.userId === userId)
    );
  }

  public getSecurityMetrics(): {
    totalViolations: number;
    violationsByType: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    suspiciousIPs: number;
    blockedUsers: number;
  } {
    const recent = this.getViolations();
    
    const violationsByType = recent.reduce((acc, v) => {
      acc[v.type] = (acc[v.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const violationsBySeverity = recent.reduce((acc, v) => {
      acc[v.severity] = (acc[v.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const blockedUsers = Array.from(this.loginAttempts.values())
      .filter(attempt => attempt.lockoutUntil && attempt.lockoutUntil > Date.now())
      .length;

    return {
      totalViolations: recent.length,
      violationsByType,
      violationsBySeverity,
      suspiciousIPs: this.suspiciousIPs.size,
      blockedUsers
    };
  }

  // Cleanup expired entries
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      
      // Clean up rate limits
      for (const [key, entry] of this.rateLimits.entries()) {
        if (now > entry.resetTime) {
          this.rateLimits.delete(key);
        }
      }

      // Clean up login attempts
      for (const [key, attempt] of this.loginAttempts.entries()) {
        if (attempt.lockoutUntil && now > attempt.lockoutUntil) {
          this.loginAttempts.delete(key);
        }
      }

      // Clean up old violations (keep only last 7 days)
      const cutoff = now - (7 * 24 * 60 * 60 * 1000);
      this.violations = this.violations.filter(v => v.timestamp > cutoff);
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Policy Management
  public updatePolicy(updates: Partial<SecurityPolicy>): void {
    this.policy = { ...this.policy, ...updates };
    
    auditLogger.logSecurityEvent(
      'system',
      'security_policy_updated',
      'info',
      { updates, newPolicy: this.policy }
    );
  }

  public getPolicy(): SecurityPolicy {
    return { ...this.policy };
  }
}

export const securityEnforcer = new SecurityEnforcer();

// React Hook for Security
export const useSecurity = () => {
  return {
    validateFile: securityEnforcer.validateFile.bind(securityEnforcer),
    checkRateLimit: securityEnforcer.checkRateLimit.bind(securityEnforcer),
    sanitizeInput: securityEnforcer.sanitizeInput.bind(securityEnforcer),
    escapeHtml: securityEnforcer.escapeHtml.bind(securityEnforcer),
    validateSearchQuery: securityEnforcer.validateSearchQuery.bind(securityEnforcer),
    getViolations: securityEnforcer.getViolations.bind(securityEnforcer),
    getSecurityMetrics: securityEnforcer.getSecurityMetrics.bind(securityEnforcer)
  };
};
