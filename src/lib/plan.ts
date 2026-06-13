// ----------------------------------------------------------------------------
// Subscription / trial gating. The schema has `plan`, `trialEndsAt` and
// `isActive`, but nothing enforced them — every trial clinic was effectively a
// permanent free user. These helpers are the single source of truth for whether
// a clinic is allowed to use the paid product (the AI receptionist & sends).
// ----------------------------------------------------------------------------

export type ClinicPlanFields = {
  isActive: boolean;
  plan: "TRIAL" | "STARTER" | "PRO";
  trialEndsAt: Date | null;
};

/** True if the clinic may use the AI receptionist / automations right now. */
export function clinicCanUseAI(clinic: ClinicPlanFields, now = new Date()): boolean {
  if (!clinic.isActive) return false;
  if (clinic.plan === "TRIAL") {
    return clinic.trialEndsAt !== null && clinic.trialEndsAt.getTime() > now.getTime();
  }
  // Paid plans (STARTER/PRO) are active until explicitly deactivated.
  return true;
}

/** Days left in trial (0 if expired or not on trial). */
export function trialDaysLeft(clinic: ClinicPlanFields, now = new Date()): number {
  if (clinic.plan !== "TRIAL" || !clinic.trialEndsAt) return 0;
  return Math.max(0, Math.ceil((clinic.trialEndsAt.getTime() - now.getTime()) / 86_400_000));
}
