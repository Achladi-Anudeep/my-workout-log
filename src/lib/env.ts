/** Which deployment this build is: production, the test environment, or a local/CI build. Set at build time. */
export const APP_ENV: 'prod' | 'test' | 'local' = __APP_ENV__;
/** Short commit id of this build. */
export const APP_VERSION: string = __APP_VERSION__;
