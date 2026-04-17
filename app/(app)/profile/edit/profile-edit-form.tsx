"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PRACTICE_SETTING_LABELS,
  ROLE_LABELS,
  type PracticeSetting,
  type UserRole,
} from "@/lib/schemas/enums";
import { createClient } from "@/lib/supabase/browser";
import type { TablesUpdate } from "@/lib/types/database";

type ProfileUpdate = TablesUpdate<"profiles">;

interface Initial {
  display_name: string;
  role: UserRole | null;
  years_out_of_training: number | null;
  practice_setting: PracticeSetting | null;
  institution: string;
}

export function ProfileEditForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.display_name ?? "");
  const [role, setRole] = useState<UserRole | "">(initial.role ?? "");
  const [years, setYears] = useState(
    initial.years_out_of_training?.toString() ?? "",
  );
  const [setting, setSetting] = useState<PracticeSetting | "">(
    initial.practice_setting ?? "",
  );
  const [institution, setInstitution] = useState(initial.institution ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setErr(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setErr("Not signed in");
      setSaving(false);
      return;
    }
    const patch: ProfileUpdate = {
      display_name: displayName.trim() || null,
      role: role || null,
      years_out_of_training: years ? Number(years) : null,
      practice_setting: setting || null,
      institution: institution.trim() || null,
    };
    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.replace("/profile");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card">
        <div>
          <Label htmlFor="display-name">Display name</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Dr. Smith"
          />
        </div>
        <div>
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a role" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {ROLE_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="years">Years out of training</Label>
          <Input
            id="years"
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            placeholder="(attendings only)"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </div>
        <div>
          <Label>Practice setting</Label>
          <Select
            value={setting}
            onValueChange={(v) => setSetting(v as PracticeSetting)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a setting" />
            </SelectTrigger>
            <SelectContent>
              {(
                Object.keys(PRACTICE_SETTING_LABELS) as PracticeSetting[]
              ).map((k) => (
                <SelectItem key={k} value={k}>
                  {PRACTICE_SETTING_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="institution">Institution</Label>
          <Input
            id="institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder="e.g. Johns Hopkins Hospital"
            maxLength={120}
          />
        </div>
      </div>
      {err && <p className="text-sm text-[#b91c1c]">{err}</p>}
      <Button block size="lg" disabled={saving} onClick={save}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
