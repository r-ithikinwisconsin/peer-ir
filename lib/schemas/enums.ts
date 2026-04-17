import { z } from "zod";

export const userRoleSchema = z.enum([
  "attending",
  "fellow",
  "resident",
  "medical_student",
  "other",
]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const practiceSettingSchema = z.enum([
  "academic",
  "community",
  "hybrid",
  "private_practice",
  "other",
]);
export type PracticeSetting = z.infer<typeof practiceSettingSchema>;

export const caseCategorySchema = z.enum([
  "oncology",
  "vascular",
  "gi_bleed",
  "venous",
  "biliary",
  "other",
]);
export type CaseCategory = z.infer<typeof caseCategorySchema>;

export const patientGenderSchema = z.enum(["male", "female", "other"]);
export type PatientGender = z.infer<typeof patientGenderSchema>;

export const ROLE_LABELS: Record<UserRole, string> = {
  attending: "Attending",
  fellow: "Fellow",
  resident: "Resident",
  medical_student: "Medical student",
  other: "Other",
};

export const PRACTICE_SETTING_LABELS: Record<PracticeSetting, string> = {
  academic: "Academic",
  community: "Community",
  hybrid: "Hybrid",
  private_practice: "Private practice",
  other: "Other",
};

export const CATEGORY_LABELS: Record<CaseCategory, string> = {
  oncology: "Oncology",
  vascular: "Vascular",
  gi_bleed: "GI Bleed",
  venous: "Venous",
  biliary: "Biliary",
  other: "Other",
};

export const GENDER_LABELS: Record<PatientGender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export const GENDER_SHORT: Record<PatientGender, string> = {
  male: "M",
  female: "F",
  other: "X",
};
