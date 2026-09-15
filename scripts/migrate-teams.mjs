import fs from "node:fs"
import path from "node:path"
import mongoose from "mongoose"

function loadEnv() {
  const file = path.join(process.cwd(), ".env.local")
  const env = {}
  if (!fs.existsSync(file)) return env
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m) env[m[1]] = m[2]
  }
  return env
}

const env = loadEnv()
const uri = process.env.MONGODB_URI ?? env.MONGODB_URI
if (!uri) {
  console.error("MONGODB_URI не задан")
  process.exit(1)
}

await mongoose.connect(uri)

const Team = mongoose.model(
  "Team",
  new mongoose.Schema({}, { strict: false, timestamps: true })
)
const Membership = mongoose.model(
  "TeamMembership",
  new mongoose.Schema({}, { strict: false })
)

const teams = await Team.find({})
let created = 0

for (const t of teams) {
  const roles = new Map()
  if (t.ownerId) roles.set(String(t.ownerId), "owner")
  for (const m of t.memberIds ?? []) {
    const id = String(m)
    if (!roles.has(id)) roles.set(id, "member")
  }
  for (const [userId, role] of roles) {
    await Membership.updateOne(
      { userId, teamId: String(t._id) },
      { $set: { role, status: "active" } },
      { upsert: true }
    )
    created++
  }
}

console.log(`Мигрировано команд: ${teams.length}, создано memberships: ${created}`)
await mongoose.disconnect()
