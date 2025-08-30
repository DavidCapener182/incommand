import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Create server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Authentication middleware
export async function authenticateRequest(req: NextRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return { success: false, error: 'No authorization header' };
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return { success: false, error: 'Invalid token format' };
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      logger.warn('Authentication failed', {
        component: 'AuthMiddleware',
        action: 'authenticateRequest',
        error: error?.message
      });
      return { success: false, error: 'Invalid or expired token' };
    }

    // Get user role from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.error('Failed to fetch user profile', profileError, {
        component: 'AuthMiddleware',
        action: 'authenticateRequest',
        userId: user.id
      });
      return { success: false, error: 'Failed to fetch user profile' };
    }

    // Add profile data to user object
    const userWithProfile = {
      ...user,
      role: profile?.role || 'user',
      companyId: profile?.company_id
    };

    logger.debug('Authentication successful', {
      component: 'AuthMiddleware',
      action: 'authenticateRequest',
      userId: user.id,
      role: userWithProfile.role
    });

    return { success: true, user: userWithProfile };
  } catch (error) {
    logger.error('Authentication middleware error', error, {
      component: 'AuthMiddleware',
      action: 'authenticateRequest'
    });
    return { success: false, error: 'Authentication error' };
  }
}

// Role-based authorization middleware
export function requireRole(allowedRoles: string[]) {
  return async (req: NextRequest): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> => {
    const auth = await authenticateRequest(req);
    
    if (!auth.success) {
      return auth;
    }

    const userRole = auth.user?.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Insufficient permissions', {
        component: 'AuthMiddleware',
        action: 'requireRole',
        userId: auth.user?.id,
        userRole,
        allowedRoles
      });
      return { 
        success: false, 
        error: 'Insufficient permissions',
        user: auth.user 
      };
    }

    return auth;
  };
}

// Company-based authorization middleware
export function requireCompanyAccess() {
  return async (req: NextRequest): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> => {
    const auth = await authenticateRequest(req);
    
    if (!auth.success) {
      return auth;
    }

    const userCompanyId = auth.user?.companyId;
    
    if (!userCompanyId) {
      logger.warn('User has no company access', {
        component: 'AuthMiddleware',
        action: 'requireCompanyAccess',
        userId: auth.user?.id
      });
      return { 
        success: false, 
        error: 'No company access',
        user: auth.user 
      };
    }

    return auth;
  };
}

// Helper function to create protected API handler
export function withAuth(
  handler: (req: NextRequest, user: any) => Promise<NextResponse>,
  options: {
    requireRole?: string[];
    requireCompany?: boolean;
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      let authResult;

      // Check role requirements
      if (options.requireRole) {
        authResult = await requireRole(options.requireRole)(req);
      } else if (options.requireCompany) {
        authResult = await requireCompanyAccess()(req);
      } else {
        authResult = await authenticateRequest(req);
      }

      if (!authResult.success) {
        return NextResponse.json(
          { error: authResult.error || 'Authentication required' },
          { status: 401 }
        );
      }

      // Call the handler with authenticated user
      return await handler(req, authResult.user);
    } catch (error) {
      logger.error('Auth middleware error', error, {
        component: 'AuthMiddleware',
        action: 'withAuth'
      });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Export authentication utilities
export { authenticateRequest, requireRole, requireCompanyAccess };
