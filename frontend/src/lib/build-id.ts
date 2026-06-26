/** Inlined into the client bundle at build time (Vercel commit SHA or deployment id). */
export const CLIENT_BUILD_ID =
  process.env.NEXT_PUBLIC_BUILD_ID ?? 'local-dev';

/** Build id for server routes — matches the deployed frontend bundle. */
export function getServerBuildId(): string {
  return (
    process.env.NEXT_PUBLIC_BUILD_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.VERCEL_DEPLOYMENT_ID ??
    'local-dev'
  );
}
