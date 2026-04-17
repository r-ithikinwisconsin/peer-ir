import { config } from "dotenv";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../lib/types/database";
import { TEMPLATE_SEEDS, type TemplateSeed } from "./seed-templates";

config({ path: ".env.local" });

const SYNTHETIC_EMAIL_DOMAIN = "seed.local";
const NUM_USERS = 200;
const NUM_CASES = 30;
const VOTES_PER_CASE_MIN = 8;
const VOTES_PER_CASE_MAX = 16;

type Role = "attending" | "fellow" | "resident" | "medical_student" | "other";
type Setting = "academic" | "community" | "hybrid" | "private_practice" | "other";
type Gender = "male" | "female" | "other";

interface SyntheticProfile {
  id: string;
  email: string;
  role: Role;
  years: number | null;
  setting: Setting;
  displayName: string;
  institution: string;
}

const ACADEMIC_INSTITUTIONS = [
  "Johns Hopkins Hospital",
  "Massachusetts General Hospital",
  "Cleveland Clinic",
  "UCSF Medical Center",
  "Mayo Clinic",
  "NYU Langone",
  "Mount Sinai Hospital",
  "Stanford Health Care",
  "Duke University Hospital",
  "Penn Medicine",
  "UCLA Medical Center",
  "Northwestern Memorial Hospital",
  "University of Michigan Hospital",
  "Brigham and Women's Hospital",
  "Yale New Haven Hospital",
];
const COMMUNITY_INSTITUTIONS = [
  "Providence Regional Medical Center",
  "Baptist Health",
  "Mercy Medical Center",
  "Sutter Health",
  "Kaiser Permanente",
  "Memorial Hermann",
  "Intermountain Medical Center",
  "Advocate Lutheran General",
  "HCA Florida Hospital",
  "Scripps Memorial",
];
const PRIVATE_INSTITUTIONS = [
  "Radiology Associates",
  "Vascular & Interventional Partners",
  "Midwest Interventional Group",
  "Peninsula Vascular Associates",
  "Southwest IR Specialists",
];

const FIRST_NAMES = [
  "Aarav", "Aisha", "Alejandro", "Amara", "Amir", "Ana", "Anika", "Anton",
  "Ari", "Arjun", "Aster", "Audrey", "Bao", "Benjamin", "Bianca", "Caleb",
  "Camila", "Cara", "Chinwe", "Clara", "Dalia", "Damian", "Daniela", "David",
  "Devika", "Diana", "Dmitri", "Eli", "Elena", "Emeka", "Emi", "Emma",
  "Esi", "Ethan", "Fatima", "Felix", "Gabriel", "Giulia", "Grace", "Hana",
  "Hannah", "Haruki", "Henry", "Ibrahim", "Ines", "Irene", "Isaac", "Isabella",
  "Jae", "James", "Jasmine", "Javier", "Jin", "Jonas", "Julia", "Julian",
  "Kai", "Kamala", "Karim", "Katya", "Kenji", "Khalid", "Kiran", "Kofi",
  "Lara", "Laila", "Leo", "Lior", "Lila", "Liam", "Lucia", "Luca",
  "Mae", "Malia", "Marcelo", "Maria", "Mateo", "Maya", "Mei", "Mia",
  "Miko", "Mira", "Nadia", "Nikhil", "Nina", "Noa", "Nora", "Olamide",
  "Olga", "Omar", "Oscar", "Pavel", "Petra", "Priya", "Quentin", "Rafael",
  "Raisa", "Raj", "Rania", "Rasmus", "Reza", "Rhea", "Ria", "Rohan",
  "Rosa", "Ruth", "Ryo", "Sadia", "Salim", "Samira", "Sanjay", "Sara",
  "Sebastian", "Shani", "Simon", "Siri", "Sofia", "Soren", "Tara", "Theo",
  "Thomas", "Timo", "Uma", "Valentina", "Vera", "Vikram", "Viv", "Wei",
  "Wen", "Xiomara", "Yara", "Yasmin", "Yohan", "Yuki", "Yusuf", "Zainab",
  "Zane", "Zara", "Zelda", "Zoe",
];

const LAST_NAMES = [
  "Abrahams", "Adeyemi", "Ahmad", "Alvarez", "Andersen", "Arslan", "Asante",
  "Azuma", "Bakshi", "Banerjee", "Barros", "Behrens", "Berger", "Bhatt",
  "Bianchi", "Brennan", "Cabrera", "Calder", "Cardoso", "Castillo", "Chaudhry",
  "Chen", "Cho", "Choi", "Colombo", "Cortez", "Cruz", "Dalal", "Dasgupta",
  "Davidescu", "De Leon", "Diallo", "Dimov", "Dubois", "Duong", "Eberhardt",
  "El-Sayed", "Engström", "Esposito", "Farooqi", "Fernandes", "Fischer",
  "Fujimoto", "Galván", "Garcia", "Ghosh", "Goldberg", "Goncalves", "Govender",
  "Grewal", "Gupta", "Haddad", "Hakim", "Halvorsen", "Hamdi", "Hansen",
  "Hashimoto", "Hassan", "Hayashi", "Herrera", "Hidalgo", "Hossain", "Hussein",
  "Iqbal", "Ito", "Jacobs", "Jansen", "Jimenez", "Johansson", "Joshi", "Kahn",
  "Kang", "Kapoor", "Karimov", "Katz", "Kaur", "Khan", "Khoury", "Kim",
  "Kiselyov", "Kobayashi", "Kolawole", "Kowalski", "Krasniqi", "Krishnan",
  "Kumar", "Lam", "Lang", "Larsson", "Laurent", "Lee", "Levi", "Li",
  "Lima", "Lin", "Lindgren", "Lopez", "Madani", "Maeda", "Magalhaes", "Malhotra",
  "Marino", "Martin", "Masih", "Matsumoto", "Mbeki", "Mehta", "Mensah",
  "Minh", "Mirza", "Mishra", "Moreau", "Moreno", "Mori", "Müller", "Nair",
  "Nakamura", "Nakashima", "Nasser", "Navarro", "Ndlovu", "Nguyen", "Nikolaev",
  "Novak", "Obi", "Odair", "Okafor", "Okonkwo", "Olsen", "Omari", "Ortega",
  "Osei", "Ozaki", "Paik", "Pak", "Park", "Pereira", "Petrova", "Pham",
  "Phan", "Popescu", "Prasad", "Qureshi", "Ramirez", "Rao", "Rashid", "Ravani",
  "Reyes", "Rivera", "Rizzo", "Romano", "Romero", "Rossi", "Rouse", "Sabir",
  "Saito", "Salim", "Sanchez", "Santana", "Santos", "Sarkar", "Sato", "Schmidt",
  "Schneider", "Sharma", "Shen", "Silva", "Silva", "Singh", "Sokolov", "Song",
  "Soriano", "Sousa", "Srinivasan", "Suzuki", "Tadesse", "Tahir", "Tan",
  "Tanaka", "Tashkent", "Thakur", "Torres", "Tran", "Tsao", "Uchida", "Umar",
  "Vargas", "Vasquez", "Vega", "Verma", "Vidal", "Vu", "Wang", "Watanabe",
  "Weiss", "Wu", "Xu", "Yamada", "Yamamoto", "Yang", "Yoon", "Yusupov",
  "Zelaya", "Zhang", "Zhao", "Zhou", "Zia",
];

function pickName(rand: () => number, index: number): string {
  const f = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
  const l = LAST_NAMES[(index + Math.floor(rand() * LAST_NAMES.length)) % LAST_NAMES.length];
  return `Dr. ${f} ${l}`;
}

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in environment`);
  return v;
}

function assertLocalOrAllowed(url: string) {
  const isLocal = /localhost|127\.0\.0\.1|:54321|kong/.test(url);
  if (!isLocal && process.env.SEED_ALLOW_REMOTE !== "1") {
    throw new Error(
      `Refusing to seed against non-local URL ${url}. ` +
        "Set SEED_ALLOW_REMOTE=1 to override.",
    );
  }
}

// Deterministic PRNG (mulberry32).
function prng(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function choice<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function weighted<T>(rand: () => number, items: Array<[T, number]>): T {
  const total = items.reduce((a, [, w]) => a + w, 0);
  let r = rand() * total;
  for (const [v, w] of items) {
    r -= w;
    if (r <= 0) return v;
  }
  return items[items.length - 1][0];
}

function normal(rand: () => number, mean: number, sd: number) {
  const u1 = Math.max(rand(), 1e-9);
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + sd * z;
}

function generateProfile(rand: () => number, index: number) {
  const role = rand() < 0.6
    ? "attending"
    : weighted<Role>(rand, [
        ["fellow", 0.35],
        ["resident", 0.5],
        ["medical_student", 0.1],
        ["other", 0.05],
      ]);
  const years =
    role === "attending"
      ? Math.max(0, Math.min(40, Math.round(normal(rand, 12, 7))))
      : null;
  const setting = weighted<Setting>(rand, [
    ["academic", 0.45],
    ["community", 0.4],
    ["private_practice", 0.1],
    ["hybrid", 0.03],
    ["other", 0.02],
  ]);
  const displayName = pickName(rand, index);
  const institution = pickInstitution(rand, setting);
  return {
    role,
    years,
    setting,
    displayName,
    institution,
    email: `seed-${index}@${SYNTHETIC_EMAIL_DOMAIN}`,
  };
}

function pickInstitution(rand: () => number, setting: Setting): string {
  if (setting === "academic") return choice(rand, ACADEMIC_INSTITUTIONS);
  if (setting === "community") return choice(rand, COMMUNITY_INSTITUTIONS);
  if (setting === "private_practice") return choice(rand, PRIVATE_INSTITUTIONS);
  if (setting === "hybrid")
    return choice(rand, [...ACADEMIC_INSTITUTIONS, ...COMMUNITY_INSTITUTIONS]);
  return choice(rand, [
    ...ACADEMIC_INSTITUTIONS,
    ...COMMUNITY_INSTITUTIONS,
    ...PRIVATE_INSTITUTIONS,
  ]);
}

function pickCaseVariables(
  rand: () => number,
  template: TemplateSeed,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const fields = template.clinical_vignette_structured as Array<{
    type: string;
    id: string;
    required?: boolean;
    options?: Array<{ id: string }>;
  }>;
  for (const f of fields) {
    if (f.type === "select" && f.options) {
      out[f.id] = choice(rand, f.options).id;
    } else if (f.type === "multi_select" && f.options) {
      const k = 1 + Math.floor(rand() * Math.min(3, f.options.length));
      const picked = new Set<string>();
      while (picked.size < k) picked.add(choice(rand, f.options).id);
      out[f.id] = Array.from(picked);
    }
  }
  return out;
}

// Bias the "right" decision based on the case's own variables so seed data has
// signal instead of noise. Academic attendings lean newer techniques; community
// attendings lean conservative; trainees add entropy.
function pickDecision(
  rand: () => number,
  template: TemplateSeed,
  variables: Record<string, unknown>,
  profile: SyntheticProfile,
): string {
  const decisions = (template.decision_options as Array<{ id: string }>).map(
    (d) => d.id,
  );

  const hemodynamics = variables.hemodynamics as string;
  const rv = variables.rv_strain as string;
  const clot = variables.clot_location as string;
  const contra = variables.lytic_contraindication as string;

  // Base weights driven by the case severity.
  const base: Record<string, number> = {
    anticoag_only: 1,
    cdt: 1,
    mechanical_thrombectomy: 1,
    systemic_lytic: 1,
  };

  if (hemodynamics === "stable" && rv === "no" && clot === "segmental") {
    base.anticoag_only += 3;
  }
  if (rv === "yes") {
    base.cdt += 1.5;
    base.mechanical_thrombectomy += 1.5;
  }
  if (hemodynamics === "hypotensive") {
    base.mechanical_thrombectomy += 2;
    base.systemic_lytic += 2;
    base.anticoag_only -= 0.7;
  }
  if (clot === "saddle" || clot === "central") {
    base.mechanical_thrombectomy += 1;
    base.cdt += 0.5;
  }
  if (contra === "absolute") {
    base.cdt -= 2;
    base.systemic_lytic -= 3;
    base.mechanical_thrombectomy += 1;
  }

  const isAcademicAttending =
    profile.role === "attending" && profile.setting === "academic";
  const isCommunity =
    profile.role === "attending" && profile.setting !== "academic";
  const isTrainee =
    profile.role === "resident" ||
    profile.role === "fellow" ||
    profile.role === "medical_student";

  if (isAcademicAttending) {
    base.mechanical_thrombectomy += 1;
    base.cdt += 0.5;
    base.systemic_lytic -= 0.5;
  } else if (isCommunity) {
    base.systemic_lytic += 0.8;
    base.anticoag_only += 0.5;
  }

  const items: Array<[string, number]> = decisions.map((d) => {
    const w = Math.max(0.05, base[d] ?? 1);
    return [d, isTrainee ? w * 0.5 + 0.8 : w];
  });
  return weighted(rand, items);
}

function pickReasons(
  rand: () => number,
  template: TemplateSeed,
  decisionId: string,
): string[] {
  const reasons = template.reason_options as Array<{
    id: string;
    scopedToDecisionIds?: string[];
  }>;
  const eligible = reasons.filter(
    (r) => !r.scopedToDecisionIds || r.scopedToDecisionIds.includes(decisionId),
  );
  if (eligible.length === 0) return [];
  const k = Math.floor(rand() * 3);
  const picked: string[] = [];
  const pool = [...eligible];
  for (let i = 0; i < k && pool.length > 0; i++) {
    const idx = Math.floor(rand() * pool.length);
    picked.push(pool[idx].id);
    pool.splice(idx, 1);
  }
  return picked;
}

async function main() {
  const url =
    process.env.SUPABASE_INTERNAL_URL ?? env("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY");
  assertLocalOrAllowed(url);

  const admin = createSupabaseClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rand = prng(0xc0ffee);
  console.log(`Seeding against ${url}`);

  // --- Step 1: wipe existing data ---------------------------------------
  console.log("Removing prior synthetic data...");
  const { data: existingCases } = await admin.from("cases").select("id");
  const existingCaseIds = (existingCases ?? []).map((c) => c.id);
  if (existingCaseIds.length > 0) {
    // case_votes cascade-delete via FK, but we need to remove manually since
    // we're wiping via the service role (no triggers rely on it).
    await admin.from("case_votes").delete().in("case_id", existingCaseIds);
    await admin.from("cases").delete().in("id", existingCaseIds);
  }
  await admin.from("case_templates").delete().neq("slug", "__sentinel__");

  // Delete synthetic users by email suffix.
  let page = 1;
  const perPage = 200;
  const syntheticUserIds: string[] = [];
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    if (!data.users.length) break;
    for (const u of data.users) {
      if (u.email?.endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`)) {
        syntheticUserIds.push(u.id);
      }
    }
    if (data.users.length < perPage) break;
    page += 1;
  }
  for (const id of syntheticUserIds) {
    await admin.auth.admin.deleteUser(id);
  }
  console.log(`  Removed ${syntheticUserIds.length} synthetic users`);

  // --- Step 2: template -------------------------------------------------
  console.log("Inserting case template...");
  const templateRows = TEMPLATE_SEEDS.map((t) => ({
    slug: t.slug,
    title: t.title,
    category: t.category,
    clinical_vignette_structured: t.clinical_vignette_structured,
    decision_options: t.decision_options,
    reason_options: t.reason_options,
    is_active: true,
  }));
  const { data: templates, error: tErr } = await admin
    .from("case_templates")
    .insert(templateRows)
    .select("id, slug");
  if (tErr) throw tErr;
  const templateIdBySlug = new Map(
    (templates ?? []).map((t) => [t.slug, t.id]),
  );
  console.log(`  Inserted ${templates?.length ?? 0} template`);

  // --- Step 3: synthetic users -----------------------------------------
  console.log(`Creating ${NUM_USERS} synthetic users...`);
  const profiles: SyntheticProfile[] = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const spec = generateProfile(rand, i);
    const { data: created, error } = await admin.auth.admin.createUser({
      email: spec.email,
      password: `seed-${i}-pw-${Math.floor(rand() * 1e9)}`,
      email_confirm: true,
    });
    if (error || !created?.user) {
      throw new Error(
        `Failed to create user ${spec.email}: ${error?.message ?? "no user"}`,
      );
    }
    profiles.push({
      id: created.user.id,
      email: spec.email,
      role: spec.role,
      years: spec.years,
      setting: spec.setting,
      displayName: spec.displayName,
      institution: spec.institution,
    });

    await admin
      .from("profiles")
      .update({
        role: spec.role,
        years_out_of_training: spec.years,
        practice_setting: spec.setting,
        display_name: spec.displayName,
        institution: spec.institution,
        disclaimer_acked_at: new Date().toISOString(),
      })
      .eq("id", created.user.id);

    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${NUM_USERS}`);
  }

  // --- Step 4: cases + votes -------------------------------------------
  console.log(`Creating ${NUM_CASES} synthetic cases...`);
  const peTemplate = TEMPLATE_SEEDS[0];
  const peTemplateId = templateIdBySlug.get(peTemplate.slug);
  if (!peTemplateId) throw new Error("PE template not seeded");

  let voteCount = 0;
  for (let i = 0; i < NUM_CASES; i++) {
    const submitter = choice(rand, profiles);
    const variables = pickCaseVariables(rand, peTemplate);
    const submitterDecision = pickDecision(rand, peTemplate, variables, submitter);
    const submitterReasons = pickReasons(rand, peTemplate, submitterDecision);
    const age = Math.max(18, Math.min(92, Math.round(normal(rand, 62, 14))));
    const gender: Gender = weighted(rand, [
      ["male", 0.5],
      ["female", 0.48],
      ["other", 0.02],
    ]);

    const { data: inserted, error: cErr } = await admin
      .from("cases")
      .insert({
        submitter_id: submitter.id,
        case_template_id: peTemplateId,
        patient_age: age,
        patient_gender: gender,
        case_variables: variables as Json,
        submitter_decision_id: submitterDecision,
        submitter_reason_ids: submitterReasons,
      })
      .select("id, case_number")
      .single();
    if (cErr || !inserted) throw cErr ?? new Error("case insert failed");

    // Submitter's own vote.
    const votes: Array<{
      case_id: string;
      voter_id: string;
      decision_id: string;
      other_text: string | null;
    }> = [
      {
        case_id: inserted.id,
        voter_id: submitter.id,
        decision_id: submitterDecision,
        other_text: null,
      },
    ];

    // Other voters (without replacement).
    const numPeerVotes =
      VOTES_PER_CASE_MIN +
      Math.floor(rand() * (VOTES_PER_CASE_MAX - VOTES_PER_CASE_MIN + 1));
    const pool = profiles.filter((p) => p.id !== submitter.id);
    const picked = new Set<string>();
    for (let k = 0; k < numPeerVotes && picked.size < pool.length; k++) {
      let voter = pool[Math.floor(rand() * pool.length)];
      while (picked.has(voter.id)) voter = pool[Math.floor(rand() * pool.length)];
      picked.add(voter.id);
      const decision = pickDecision(rand, peTemplate, variables, voter);
      votes.push({
        case_id: inserted.id,
        voter_id: voter.id,
        decision_id: decision,
        other_text: null,
      });
    }

    const { error: vErr } = await admin.from("case_votes").insert(votes);
    if (vErr) throw vErr;
    voteCount += votes.length;

    if ((i + 1) % 5 === 0) console.log(`  ${i + 1}/${NUM_CASES} cases`);
  }

  console.log("\nSeed summary:");
  console.log(`  templates: ${TEMPLATE_SEEDS.length}`);
  console.log(`  users:     ${profiles.length}`);
  console.log(`  cases:     ${NUM_CASES}`);
  console.log(`  votes:     ${voteCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
