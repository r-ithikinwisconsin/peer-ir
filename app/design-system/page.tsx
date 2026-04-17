"use client";

import { useState } from "react";
import { Filter, Inbox, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CategoryPill } from "@/components/ui/category-pill";
import { Chip } from "@/components/ui/chip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
} from "@/components/ui/bottom-sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSection } from "@/components/ui/filter-section";
import { HorizontalBarChart } from "@/components/ui/bar-chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberRangeInput } from "@/components/ui/number-range-input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { RadioGroup, RadioItem } from "@/components/ui/radio";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeading } from "@/components/ui/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/ui/stat-tile";
import { Avatar } from "@/components/ui/avatar";
import { CaseCard } from "@/components/case/case-card";
import { DecisionCard } from "@/components/case/decision-card";
import { AppHeader } from "@/components/ui/app-header";

export default function DesignSystemPage() {
  const [chipState, setChipState] = useState<string[]>(["TACE"]);
  const [decision, setDecision] = useState<string>("y90");
  const [range, setRange] = useState<{ min?: number; max?: number }>({
    min: 5,
    max: 15,
  });
  const [check, setCheck] = useState(true);
  const [radio, setRadio] = useState("attending");
  return (
    <main className="mx-auto max-w-[720px] px-5 py-10">
      <header className="mb-8 flex flex-col gap-1">
        <p className="label">DESIGN SYSTEM</p>
        <h1 className="text-3xl font-bold tracking-tight">
          DecIQ components
        </h1>
        <p className="text-text-muted">
          Visual contract for every primitive and composite. If it&apos;s not
          rendered on this page, it shouldn&apos;t be shipped.
        </p>
      </header>

      <Block title="Colors">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Swatch name="bg" value="#F5F6F8" className="bg-bg" />
          <Swatch name="surface" value="#FFFFFF" className="bg-surface" />
          <Swatch name="primary" value="#3B82F6" className="bg-primary" light />
          <Swatch
            name="primary-soft"
            value="#DBEAFE"
            className="bg-primary-soft"
          />
          <Swatch name="text" value="#0F172A" className="bg-text" light />
          <Swatch
            name="text-muted"
            value="#64748B"
            className="bg-text-muted"
            light
          />
          <Swatch name="success" value="#10B981" className="bg-success" light />
          <Swatch name="border" value="#E2E8F0" className="bg-border" />
        </div>
      </Block>

      <Block title="Typography">
        <div className="rounded-lg bg-surface p-5 shadow-card">
          <p className="label mb-2">LABEL — UPPERCASE</p>
          <h1 className="mb-1 text-3xl font-bold tracking-tight">
            Heading 1 — Bold 30
          </h1>
          <h2 className="mb-1 text-2xl font-bold tracking-tight">
            Heading 2 — Bold 24
          </h2>
          <h3 className="mb-1 text-lg font-semibold">Heading 3 — Semibold 18</h3>
          <p className="mb-1 text-[15px]">Body — Regular 15 / line-height 1.5</p>
          <p className="text-sm text-text-muted">
            Muted — 14 in text-muted #64748B
          </p>
        </div>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-col gap-3 rounded-lg bg-surface p-5 shadow-card">
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Add">
              <Plus size={16} />
            </Button>
          </div>
          <Button block>Block — full width on mobile</Button>
        </div>
      </Block>

      <Block title="Chips">
        <div className="flex flex-wrap gap-2 rounded-lg bg-surface p-5 shadow-card">
          {["TACE", "Y90", "Ablation", "Resection"].map((name) => {
            const selected = chipState.includes(name);
            return (
              <Chip
                key={name}
                selected={selected}
                onClick={() =>
                  setChipState((prev) =>
                    selected
                      ? prev.filter((n) => n !== name)
                      : [...prev, name],
                  )
                }
                onRemove={() =>
                  setChipState((prev) => prev.filter((n) => n !== name))
                }
              >
                {name}
              </Chip>
            );
          })}
        </div>
      </Block>

      <Block title="Stat tiles">
        <div className="grid grid-cols-3 gap-3">
          <StatTile value="12" label="POSTED" />
          <StatTile value="58" label="VOTES" />
          <StatTile value="7" label="DAYS ACTIVE" />
        </div>
      </Block>

      <Block title="Inputs">
        <div className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card">
          <div>
            <Label>Display name</Label>
            <Input placeholder="Dr. Mira Malavia" />
          </div>
          <div>
            <Label>Lesion size (cm)</Label>
            <NumberRangeInput value={range} onChange={setRange} unit="cm" />
          </div>
          <div>
            <Label>Practice setting</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose a setting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="academic">Academic</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="private_practice">
                  Private practice
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              checked={check}
              onCheckedChange={(c) => setCheck(c === true)}
              id="ds-check"
            />
            <label htmlFor="ds-check" className="text-[15px]">
              Peripheral disease on imaging
            </label>
          </div>
          <div>
            <Label>Role</Label>
            <RadioGroup value={radio} onValueChange={setRadio}>
              {[
                ["attending", "Attending"],
                ["fellow", "Fellow"],
                ["resident", "Resident"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-chip-bg/60"
                >
                  <RadioItem value={value} id={`ds-role-${value}`} />
                  <span className="text-[15px]">{label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      </Block>

      <Block title="Progress bar">
        <div className="rounded-lg bg-surface p-5 shadow-card">
          <ProgressBar step={2} total={4} />
        </div>
      </Block>

      <Block title="Case card">
        <div className="flex flex-col gap-3">
          <CaseCard
            caseNumber={1207}
            age={62}
            gender="male"
            category="VASCULAR"
            teaser="Intermediate-risk · RV strain · Saddle"
          />
          <CaseCard
            caseNumber={1208}
            age={48}
            gender="female"
            category="VASCULAR"
            teaser="High-risk · Hemodynamically unstable"
            hasVoted
          />
          <CaseCard
            caseNumber={1209}
            age={71}
            gender="male"
            category="VASCULAR"
            teaser="Low-risk · Subsegmental"
            isOwn
          />
        </div>
      </Block>

      <Block title="Decision cards">
        <div className="flex flex-col gap-2">
          {[
            ["tace", "Conventional TACE", "Lipiodol + chemo + embolic"],
            ["deb-tace", "DEB-TACE", "Drug-eluting beads"],
            [
              "y90",
              "Y90 radioembolization",
              "Mapping + delivery. Segmentectomy considered.",
            ],
            ["ablation", "Percutaneous ablation", "Microwave or RFA"],
          ].map(([id, label, desc]) => (
            <DecisionCard
              key={id}
              label={label}
              description={desc}
              selected={decision === id}
              onClick={() => setDecision(id)}
            />
          ))}
        </div>
      </Block>

      <Block title="Bar chart — results">
        <Card>
          <HorizontalBarChart
            rows={[
              {
                id: "y90",
                label: "Y90 radioembolization",
                pct: 42.9,
                count: 18,
                highlighted: true,
              },
              {
                id: "deb-tace",
                label: "DEB-TACE",
                pct: 28.6,
                count: 12,
              },
              { id: "tace", label: "Conventional TACE", pct: 16.7, count: 7 },
              { id: "ablation", label: "Percutaneous ablation", pct: 11.9, count: 5 },
            ]}
          />
        </Card>
      </Block>

      <Block title="Filter sections">
        <Card className="p-0">
          <div className="px-5">
            <FilterSection title="Role" activeCount={2}>
              <div className="flex flex-wrap gap-2">
                <Chip selected>Attending</Chip>
                <Chip selected>Fellow</Chip>
                <Chip>Resident</Chip>
                <Chip>Medical student</Chip>
              </div>
            </FilterSection>
            <FilterSection title="Years out of training">
              <NumberRangeInput
                value={{ min: 5, max: 15 }}
                onChange={() => {}}
                unit="yrs"
              />
            </FilterSection>
            <FilterSection title="Practice setting" defaultOpen={false}>
              <div className="flex flex-wrap gap-2">
                <Chip>Academic</Chip>
                <Chip>Community</Chip>
                <Chip>Hybrid</Chip>
                <Chip>Private practice</Chip>
              </div>
            </FilterSection>
          </div>
        </Card>
      </Block>

      <Block title="Empty state">
        <EmptyState
          icon={Inbox}
          title="No cases yet"
          description="Your answered cases will appear here."
          action={<Button variant="soft">Browse the feed</Button>}
        />
      </Block>

      <Block title="Skeletons">
        <div className="flex flex-col gap-2 rounded-lg bg-surface p-5 shadow-card">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Block>

      <Block title="Dialog + bottom sheet">
        <div className="flex flex-wrap gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Before you continue</DialogTitle>
                <DialogDescription>
                  For educational purposes only. Not clinical advice. Do not
                  enter protected health information.
                </DialogDescription>
              </DialogHeader>
              <Button block>I understand</Button>
            </DialogContent>
          </Dialog>

          <BottomSheet>
            <BottomSheetTrigger asChild>
              <Button variant="secondary">
                <Filter size={16} className="mr-2" />
                Open bottom sheet
              </Button>
            </BottomSheetTrigger>
            <BottomSheetContent>
              <BottomSheetTitle className="mb-3 text-lg font-semibold tracking-tight">
                Filter
              </BottomSheetTitle>
              <div className="flex flex-wrap gap-2">
                <Chip selected>Attending</Chip>
                <Chip>Fellow</Chip>
                <Chip>Resident</Chip>
              </div>
              <Button block className="mt-4">
                Apply
              </Button>
            </BottomSheetContent>
          </BottomSheet>
        </div>
      </Block>

      <Block title="App header">
        <AppHeader
          title="Results"
          backHref="/feed"
          action={
            <button
              aria-label="Edit"
              className="grid h-10 w-10 place-items-center rounded-full text-primary transition hover:bg-primary-soft/60"
            >
              <Pencil size={18} />
            </button>
          }
        />
      </Block>

      <Block title="Section heading + Card">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CategoryPill>ONCOLOGY</CategoryPill>
            </div>
            <CardTitle>Solitary 4cm HCC, Child-Pugh A</CardTitle>
            <CardDescription>
              55M, solitary 4.2cm, segment 6, no vascular invasion
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button>Open case</Button>
            <Button variant="ghost">Skip</Button>
          </CardFooter>
        </Card>
      </Block>

      <Block title="Profile header preview">
        <Card>
          <div className="flex items-center gap-4">
            <Avatar name="Mira Malavia" size={64} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">Mira Malavia</h3>
              <p className="text-sm text-text-muted">
                Attending · Academic
              </p>
            </div>
            <button
              aria-label="Edit profile"
              className="grid h-10 w-10 place-items-center rounded-full text-primary hover:bg-primary-soft/60"
            >
              <Pencil size={18} />
            </button>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3">
            <StatTile value="12" label="POSTED" />
            <StatTile value="58" label="VOTES" />
            <StatTile value="7" label="DAYS ACTIVE" />
          </div>
        </Card>
      </Block>

      <footer className="mt-10 rounded-lg bg-surface p-5 text-sm text-text-muted shadow-card">
        <p className="label mb-2">MOTION</p>
        <p>
          All transitions are 150–200ms ease-out on opacity, color, and small
          transforms. Bars animate width from 0 on mount. No spring physics.
        </p>
      </footer>
    </main>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <SectionHeading title={title} size="sm" />
      {children}
    </section>
  );
}

function Swatch({
  name,
  value,
  className,
}: {
  name: string;
  value: string;
  className?: string;
  light?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div className={`h-12 ${className ?? ""}`} />
      <div className="bg-surface px-3 py-2 text-xs">
        <div className="font-semibold">{name}</div>
        <div className="tabular-nums text-text-muted">{value}</div>
      </div>
    </div>
  );
}
