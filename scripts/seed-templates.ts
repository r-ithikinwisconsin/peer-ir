import type { Json } from "../lib/types/database";

export interface TemplateSeed {
  slug: string;
  title: string;
  category: "oncology" | "vascular" | "gi_bleed" | "venous" | "biliary" | "other";
  clinical_vignette_structured: Json;
  decision_options: Json;
  reason_options: Json;
}

// Single-template POC: acute pulmonary embolism.
// Vignette fields, decisions, and reasons track templates/pulmonary_embolism.md.
export const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    slug: "pulmonary-embolism",
    title: "Acute pulmonary embolism",
    category: "vascular",
    clinical_vignette_structured: [
      {
        type: "select",
        id: "hemodynamics",
        label: "Hemodynamics",
        required: true,
        options: [
          { id: "stable", label: "Stable" },
          { id: "tachycardic", label: "Tachycardic only" },
          { id: "hypotensive", label: "Hypotensive" },
        ],
      },
      {
        type: "select",
        id: "oxygen_requirement",
        label: "Oxygen requirement",
        required: true,
        options: [
          { id: "room_air", label: "Room air" },
          { id: "low_o2", label: "Low oxygen" },
          { id: "high_o2", label: "High oxygen / ventilatory support" },
        ],
      },
      {
        type: "select",
        id: "rv_strain",
        label: "RV strain",
        required: true,
        options: [
          { id: "yes", label: "Yes" },
          { id: "no", label: "No" },
        ],
      },
      {
        type: "select",
        id: "biomarkers",
        label: "Biomarkers",
        required: true,
        options: [
          { id: "elevated", label: "Elevated" },
          { id: "normal", label: "Normal" },
          { id: "unknown", label: "Unknown" },
        ],
      },
      {
        type: "select",
        id: "clot_location",
        label: "Clot burden",
        required: true,
        options: [
          { id: "segmental", label: "Segmental" },
          { id: "lobar", label: "Lobar" },
          { id: "central", label: "Central" },
          { id: "saddle", label: "Saddle" },
        ],
      },
      {
        type: "select",
        id: "lytic_contraindication",
        label: "Contraindication to lytics",
        required: true,
        options: [
          { id: "none", label: "None" },
          { id: "relative", label: "Relative" },
          { id: "absolute", label: "Absolute" },
        ],
      },
      {
        type: "select",
        id: "special_context",
        label: "Special context",
        required: false,
        options: [
          { id: "none", label: "None" },
          { id: "recent_surgery", label: "Recent surgery" },
          { id: "elderly_frail", label: "Elderly / frail" },
          { id: "active_cancer", label: "Active cancer" },
        ],
      },
    ],
    decision_options: [
      { id: "anticoag_only", label: "Anticoagulation only" },
      {
        id: "cdt",
        label: "Catheter-directed thrombolysis",
      },
      {
        id: "mechanical_thrombectomy",
        label: "Mechanical thrombectomy",
        description: "Large-bore catheter thrombectomy",
      },
      {
        id: "systemic_lytic",
        label: "Systemic thrombolysis",
      },
    ],
    reason_options: [
      {
        id: "absolute_contraindication",
        label: "Absolute contraindication to lytics",
        scopedToDecisionIds: ["anticoag_only", "mechanical_thrombectomy"],
      },
      {
        id: "rv_dysfunction",
        label: "RV strain present",
        scopedToDecisionIds: ["cdt", "mechanical_thrombectomy", "systemic_lytic"],
      },
      {
        id: "hemodynamic_instability",
        label: "Hemodynamic instability",
        scopedToDecisionIds: ["mechanical_thrombectomy", "systemic_lytic"],
      },
      {
        id: "stable_segmental",
        label: "Stable with segmental clot",
        scopedToDecisionIds: ["anticoag_only"],
      },
      {
        id: "no_local_mt",
        label: "No mechanical thrombectomy available locally",
        scopedToDecisionIds: ["cdt", "systemic_lytic"],
      },
    ],
  },
];
