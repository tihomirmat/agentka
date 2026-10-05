/** Shells are applied in src/routes.tsx. Pages import only the helpers below. */
export { AppShell, APP_NAV } from './AppShell';
export { AdminShell, ADMIN_NAV } from './AdminShell';
export { PublicShell, HOW_IT_WORKS_ID } from './PublicShell';
export { WizardShell, WizardStep, useWizardStep, type WizardStepNumber, type WizardStepProps } from './WizardShell';
export { TopBarActions } from './slots';
export { Placeholder } from './Placeholder';
