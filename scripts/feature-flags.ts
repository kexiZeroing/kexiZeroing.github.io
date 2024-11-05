export type UserRole = "admin" | "tester" | "user"
export type User = {
  id: string
  role: UserRole
}

export type FeatureFlagName = keyof typeof FEATURE_FLAGS

type FeatureFlagRule = {
  userRoles?: UserRole[]
}
export const FEATURE_FLAGS = {
  TEST_NEW_PRODUCTS_QUERY: true,
  ADVANCED_ANALYTICS: true,
  MULTIPLE_ALLOWANCES: [
    { userRoles: ["admin", "tester"] },
  ],
} as const satisfies Record<string, FeatureFlagRule[] | boolean>

export function canViewFeature(featureName: FeatureFlagName, user: User) {
  const rules = FEATURE_FLAGS[featureName]
  if (typeof rules === "boolean") return rules
  return rules.some(rule => checkRule(rule, user))
}

function checkRule(
  { userRoles }: FeatureFlagRule,
  user: User
) {
  return userHasValidRole(userRoles, user.role)
}

function userHasValidRole(
  allowedRoles: UserRole[] | undefined,
  userRole: UserRole
) {
  return allowedRoles == null || allowedRoles.includes(userRole)
}

// ==========
// How to use
// 
// <FeatureEnabled featureFlag="ADVANCED_ANALYTICS">
//   <Content />
// </FeatureEnabled>
export function FeatureEnabled({
  featureFlag,
  children,
}: {
  featureFlag: FeatureFlagName
  children: ReactNode
}) {
  return canViewFeature(featureFlag, getUser()) ? children : null
}
