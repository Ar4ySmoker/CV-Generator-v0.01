import { randomBytes } from "crypto"

import { NotificationSettings } from "./models/notification-settings"
import { PushSubscription } from "./models/push-subscription"
import { Team, type TeamDoc } from "./models/team"
import { TeamActivity, type TeamActivityType } from "./models/team-activity"
import { sendPush } from "./web-push"

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
    ownerId: t.ownerId,
    inviteCode: t.inviteCode,
    memberIds: t.memberIds,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }
}

export async function findTeamOfMember(userId: string) {
  return Team.findOne({ memberIds: userId })
}

export async function removeFromAnyTeam(userId: string): Promise<void> {
  const teams = await Team.find({ memberIds: userId })
  for (const t of teams) {
    t.memberIds = t.memberIds.filter((id) => id !== userId)
    if (t.memberIds.length === 0) {
      await t.deleteOne()
    } else {
      if (t.ownerId === userId) {
        t.ownerId = t.memberIds[0]
      }
      await t.save()
    }
  }
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

export async function notifyTeamMembers(
  teamId: string,
  excludeUserId: string,
  payload: { title: string; body: string; url: string }
): Promise<void> {
  const team = await Team.findById(teamId)
  if (!team) return

  for (const uid of team.memberIds) {
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
