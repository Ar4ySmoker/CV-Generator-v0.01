import { randomBytes } from "crypto"

import { NotificationSettings } from "./models/notification-settings"
import { PushSubscription } from "./models/push-subscription"
import { Team, type TeamDoc } from "./models/team"
import { TeamMembership, type TeamRole } from "./models/team-membership"
import { TeamActivity, type TeamActivityType } from "./models/team-activity"
import { sendPush } from "./web-push"

export type { TeamRole }

export function normalizeCompany(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ")
}

export function generateInviteCode(): string {
  return randomBytes(6).toString("base64url")
}

export function serializeTeam(t: TeamDoc) {
  return {
    id: t._id.toString(),
    name: t.name,
    description: t.description ?? null,
    tags: t.tags ?? [],
    domain: t.domain ?? null,
    visibility: t.visibility ?? "private",
    joinMode: t.joinMode ?? "request",
    inviteCode: t.inviteCode,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }
}

export async function myRoleIn(
  userId: string,
  teamId: string
): Promise<TeamRole | null> {
  const m = await TeamMembership.findOne({ userId, teamId, status: "active" })
  return m ? m.role : null
}

export async function isTeamOwner(userId: string, teamId: string) {
  return (await myRoleIn(userId, teamId)) === "owner"
}

export async function isTeamMember(userId: string, teamId: string) {
  return (await myRoleIn(userId, teamId)) !== null
}

export async function activeMemberIds(teamId: string): Promise<string[]> {
  const memberships = await TeamMembership.find({ teamId, status: "active" })
  return memberships.map((m) => m.userId)
}

export async function listMyTeams(
  userId: string
): Promise<{ team: ReturnType<typeof serializeTeam>; role: TeamRole }[]> {
  const memberships = await TeamMembership.find({ userId, status: "active" })
  if (memberships.length === 0) return []

  const teamIds = memberships.map((m) => m.teamId)
  const teams = await Team.find({ _id: { $in: teamIds } })
  const map = new Map(teams.map((t) => [t._id.toString(), t]))

  return memberships
    .map((m) => {
      const t = map.get(m.teamId)
      if (!t) return null
      return { team: serializeTeam(t), role: m.role }
    })
    .filter((x): x is { team: ReturnType<typeof serializeTeam>; role: TeamRole } =>
      x !== null
    )
}

export async function addTeamActivity(input: {
  teamId: string
  type: TeamActivityType
  actorId: string
  applicationId?: string
  company?: string
  role?: string
  stageName?: string
  feedbackKind?: string
}): Promise<void> {
  await TeamActivity.create(input)
}

export async function addActivityToUserTeams(
  userId: string,
  input: Omit<Parameters<typeof addTeamActivity>[0], "teamId">
): Promise<void> {
  const memberships = await TeamMembership.find({ userId, status: "active" })
  for (const m of memberships) {
    await addTeamActivity({ ...input, teamId: m.teamId })
  }
}

export async function notifyTeamMembers(
  teamId: string,
  excludeUserId: string,
  payload: { title: string; body: string; url: string }
): Promise<void> {
  const memberIds = await activeMemberIds(teamId)

  for (const uid of memberIds) {
    if (uid === excludeUserId) continue
    const settings = await NotificationSettings.findOne({ userId: uid })
    if (settings && settings.enabled === false) continue
    const subs = await PushSubscription.find({ userId: uid })
    for (const s of subs) {
      const { invalid } = await sendPush(
        { endpoint: s.endpoint, keys: s.keys },
        payload
      )
      if (invalid) {
        await PushSubscription.deleteOne({ _id: s._id })
      }
    }
  }
}
