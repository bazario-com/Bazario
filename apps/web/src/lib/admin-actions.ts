export interface ActionInfo {
  label: string;
  icon: string;
}

export const ACTION_LABELS: Record<string, ActionInfo> = {
  APPROVE_VENDOR: { label: 'Approved a vendor', icon: '\u2705' },
  REJECT_VENDOR: { label: 'Rejected a vendor', icon: '\u274c' },
  APPROVE_PRODUCT: { label: 'Approved a product', icon: '\u2705' },
  REJECT_PRODUCT: { label: 'Rejected a product', icon: '\u274c' },
  RESET_USER_PASSWORD: { label: 'Reset a user password', icon: '\ud83d\udd11' },
  REACTIVATE_USER: { label: 'Reactivated a user', icon: '\ud83d\udfe2' },
  DEACTIVATE_USER: { label: 'Deactivated a user', icon: '\ud83d\udd34' },
  CREATE_MANAGEMENT_USER: { label: 'Created a management account', icon: '\ud83e\uddd1\u200d\ud83d\udcbc' },
  REASSIGN_ROLE: { label: 'Reassigned a role', icon: '\ud83d\udd04' },
  SET_PERMISSION_OVERRIDE: { label: 'Updated a permission override', icon: '\ud83d\udd10' },
  REACTIVATE_MANAGEMENT_USER: { label: 'Reactivated a management account', icon: '\ud83d\udfe2' },
  SUSPEND_MANAGEMENT_USER: { label: 'Suspended a management account', icon: '\u23f8\ufe0f' },
};

export function describeAction(action: string): ActionInfo {
  return (
    ACTION_LABELS[action] ?? {
      label: action.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()),
      icon: '\ud83d\udd39',
    }
  );
}

export function actionSubtitle(details?: Record<string, unknown> | null): string | null {
  const d = details ?? {};
  const name = (d.businessName ?? d.title ?? d.email ?? d.roleName) as string | undefined;
  return name ?? null;
}
