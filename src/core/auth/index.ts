/**
 * Auth — public API.
 *
 * `./dal` and `./session-store` are NOT re-exported: both are `server-only`. Server code
 * imports them by path, which keeps the import itself a visible, reviewable decision rather
 * than something that arrives through a barrel.
 */

export {
 isSessionExpired,
 toPublicSession,
 type AuthProvider,
 type Credentials,
 type PublicSession,
 type Session,
 type SessionStore,
 type SignUpInput,
 type UserRole,
} from './types';

export {
 PERMISSIONS,
 checkPermission,
 hasPermission,
 permissionsOf,
 planWouldAllow,
 type Permission,
 type PermissionCheck,
} from './policy';

export {
 DEMO_USERS,
 createInMemoryAuthProvider,
 type FakeUser,
 type InMemoryAuthOptions,
} from './in-memory-provider';

export {
 createSupabaseAuthProvider,
 type SupabaseAuthOptions,
} from './supabase-provider';
