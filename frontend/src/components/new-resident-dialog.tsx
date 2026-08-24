"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AccessibilityIcon,
  BriefcaseBusinessIcon,
  ClockIcon,
  HeartHandshakeIcon,
  HomeIcon,
  PhoneIcon,
  PlusIcon,
  SaveIcon,
  UserRoundIcon,
  UsersRoundIcon,
} from "lucide-react";

import {
  ApiError,
  createResident,
  getAssistancePrograms,
  getHouseholds,
  getOrganizations,
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SEXES = ["Male", "Female", "Unspecified"];
const CIVIL = ["Single", "Married", "CommonLaw", "Widowed", "Divorced", "Separated", "Annulled", "Other"];
const RELATIONSHIPS = ["Head", "Spouse", "Son", "Daughter", "Parent", "Sibling", "Relative", "Member"];
const DISABILITY_TYPES = [
  "Visual Disability",
  "Deaf or Hearing Disability",
  "Intellectual/Learning/Mental/Psychological Disability",
  "Physical Disability",
  "Speech or Language Impairment",
  "Cancer",
  "Rare Disease",
];
const EMPLOYED_TYPES = [
  "Worked for Private Household",
  "Worked for Private Establishment",
  "Worked for Government/GOCC",
  "Employer in Own Family-Operated Farm or Business",
  "Self-Employed Without Paid Employee",
  "Worked with Pay in Own Family-Operated Farm or Business",
  "Worked Without Pay",
];
const UNEMPLOYED_TYPES = ["Student", "PWD", "Still looking"];

export function NewResidentDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <PlusIcon />
            New resident
          </Button>
        }
      />
      <DialogContent
        className="flex max-h-[92vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
      >
        {/* Remounts each open, so the form always starts clean. */}
        <ResidentForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ResidentForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [sex, setSex] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [voterId, setVoterId] = useState("");

  const [householdMode, setHouseholdMode] = useState<"none" | "existing" | "new">("none");
  const [householdId, setHouseholdId] = useState("");
  const [relationship, setRelationship] = useState("Member");
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [zone, setZone] = useState("");

  const [isSoloParent, setIsSoloParent] = useState(false);
  const [soloParentId, setSoloParentId] = useState("");
  const [isSeniorCitizen, setIsSeniorCitizen] = useState(false);
  const [seniorCitizenId, setSeniorCitizenId] = useState("");
  const [hasDisability, setHasDisability] = useState(false);
  const [disabilityId, setDisabilityId] = useState("");
  const [disabilityType, setDisabilityType] = useState("");

  const [employmentStatus, setEmploymentStatus] = useState("Unspecified");
  const [employedType, setEmployedType] = useState("");
  const [unemployedType, setUnemployedType] = useState("");

  const [programIds, setProgramIds] = useState<string[]>([]);

  const barangays = useQuery({
    queryKey: ["organizations", "flat", "Barangay"],
    queryFn: ({ signal }) => getOrganizations("Barangay", signal),
  });
  const programs = useQuery({
    queryKey: ["assistance-programs"],
    queryFn: ({ signal }) => getAssistancePrograms(signal),
  });

  const isBarangayScoped = barangays.data?.length === 1;
  const effectiveOrgId =
    organizationId || (isBarangayScoped ? barangays.data![0].id : "");

  const households = useQuery({
    queryKey: ["households", effectiveOrgId],
    queryFn: ({ signal }) => getHouseholds(effectiveOrgId, signal),
    enabled: !!effectiveOrgId,
  });

  const mutation = useMutation({
    mutationFn: () =>
      createResident({
        firstName,
        middleName: middleName || null,
        lastName,
        suffix: suffix || null,
        sex: sex || null,
        civilStatus: civilStatus || null,
        birthDate: birthDate || null,
        organizationId: effectiveOrgId,
        contactPhone: contactPhone || null,
        voterId: voterId || null,
        householdId: householdMode === "existing" ? householdId || null : null,
        relationship:
          householdMode === "existing" && householdId ? relationship || null : null,
        createHousehold: householdMode === "new",
        houseNumber: householdMode === "new" ? houseNumber || null : null,
        street: householdMode === "new" ? street || null : null,
        zone: householdMode === "new" ? zone || null : null,
        isSoloParent,
        soloParentId: isSoloParent ? soloParentId || null : null,
        isSeniorCitizen,
        seniorCitizenId: isSeniorCitizen ? seniorCitizenId || null : null,
        hasDisability,
        disabilityId: hasDisability ? disabilityId || null : null,
        disabilityType: hasDisability ? disabilityType || null : null,
        employmentStatus,
        employedType: employmentStatus === "Employed" ? employedType || null : null,
        unemployedType: employmentStatus === "Unemployed" ? unemployedType || null : null,
        assistanceProgramIds: programIds,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["residents"] });
      qc.invalidateQueries({ queryKey: ["households"] });
      onDone();
    },
  });

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? "Could not create resident."
        : null;

  const householdOk =
    householdMode === "none" ||
    (householdMode === "existing" && !!householdId) ||
    (householdMode === "new" && !!street.trim() && !!houseNumber.trim() && !!zone.trim());

  const canSubmit =
    firstName.trim() && lastName.trim() && sex && civilStatus && birthDate && effectiveOrgId && householdOk;

  const toggleProgram = (id: string) =>
    setProgramIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) mutation.mutate();
      }}
    >
      <DialogHeader className="border-b px-6 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <DialogTitle className="text-lg">New resident</DialogTitle>
          <Badge
            variant="outline"
            className="gap-1 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-400"
          >
            <ClockIcon className="size-3" />
            Pending verification
          </Badge>
        </div>
        <DialogDescription className="flex items-center justify-between gap-4">
          <span>Register a new resident record.</span>
          <span className="shrink-0 text-xs">
            <span className="text-destructive">*</span> Required
          </span>
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
        {/* Personal information ---------------------------------------------- */}
        <SectionCard icon={UserRoundIcon} title="Personal information">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="First name" required>
              <Input placeholder="Enter first name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="Middle name">
              <Input placeholder="Enter middle name" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </Field>
            <Field label="Last name" required>
              <Input placeholder="Enter last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
            <Field label="Extension name (Jr, Sr, III)">
              <Input placeholder="Enter extension name" value={suffix} onChange={(e) => setSuffix(e.target.value)} />
            </Field>
            <Field label="Sex" required>
              <PlainSelect value={sex} onChange={setSex} options={SEXES} placeholder="Select sex" />
            </Field>
            <Field label="Date of birth" required>
              <DatePicker value={birthDate} onChange={setBirthDate} placeholder="Select date" />
            </Field>
            <Field label="Civil status" required>
              <PlainSelect value={civilStatus} onChange={setCivilStatus} options={CIVIL} placeholder="Select civil status" />
            </Field>
            {!isBarangayScoped && (
              <Field label="Barangay" required>
                <Select
                  value={organizationId}
                  onValueChange={(v) => { setOrganizationId(v ?? ""); setHouseholdId(""); }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select barangay">
                      {(value) => (value ? (barangays.data?.find((b) => b.id === value)?.name ?? "") : "Select barangay")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {barangays.data?.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>
        </SectionCard>

        {/* Address & household ----------------------------------------------- */}
        <SectionCard icon={HomeIcon} title="Address & household">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Label>Household</Label>
              <HouseholdOption
                selected={householdMode === "existing"}
                onSelect={() => setHouseholdMode("existing")}
                title="Assign to existing household"
                description="Link this resident to an existing household."
              />
              <HouseholdOption
                selected={householdMode === "new"}
                onSelect={() => setHouseholdMode("new")}
                title="Create new household"
                description="Create a new household and assign this resident as the head."
              />
              <HouseholdOption
                selected={householdMode === "none"}
                onSelect={() => setHouseholdMode("none")}
                title="No household"
                description="Register this resident without a household for now."
              />
            </div>

            <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-5">
              {householdMode === "new" ? (
                <>
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Create new household</h3>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      Will be Household Head
                    </Badge>
                  </div>
                  <p className="mb-4 text-xs text-muted-foreground">
                    The resident being added will be set as the Household Head.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Street" required>
                      <Input placeholder="Enter street / purok" value={street} onChange={(e) => setStreet(e.target.value)} />
                    </Field>
                    <Field label="House number" required>
                      <Input placeholder="Enter house number" value={houseNumber} onChange={(e) => setHouseNumber(e.target.value)} />
                    </Field>
                    <Field label="Zone / Purok" required>
                      <Input placeholder="Enter zone or purok" value={zone} onChange={(e) => setZone(e.target.value)} />
                    </Field>
                  </div>
                </>
              ) : householdMode === "existing" ? (
                <>
                  <h3 className="mb-1 text-sm font-semibold">Assign to existing household</h3>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Choose the household and this resident&apos;s relationship to its head.
                  </p>
                  <div className="grid gap-4">
                    <Field label="Household" required>
                      <Select value={householdId} onValueChange={(v) => setHouseholdId(v ?? "")}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select household">
                            {(value) =>
                              value
                                ? (households.data?.find((h) => h.id === value)?.referenceNumber ?? "")
                                : "Select household"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {households.data?.length === 0 && (
                            <SelectItem value="__none" disabled>No households yet</SelectItem>
                          )}
                          {households.data?.map((h) => (
                            <SelectItem key={h.id} value={h.id}>
                              {h.referenceNumber}
                              {h.headName ? ` — ${h.headName}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Relationship to head">
                      <PlainSelect value={relationship} onChange={setRelationship} options={RELATIONSHIPS} />
                    </Field>
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-32 items-center justify-center text-center text-sm text-muted-foreground">
                  This resident will be registered without a household.
                </div>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Contact | Classifications ----------------------------------------- */}
        <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard icon={PhoneIcon} title="Contact information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact number">
              <Input placeholder="Enter contact number" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
            </Field>
            <Field label="Voter's ID">
              <Input placeholder="Enter voter's ID" value={voterId} onChange={(e) => setVoterId(e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard icon={UsersRoundIcon} title="Resident classifications">
          <div className="grid gap-3">
            <ClassificationCard
              icon={UserRoundIcon}
              label="Solo Parent"
              description="Resident is a solo parent"
              checked={isSoloParent}
              onCheckedChange={(v) => { setIsSoloParent(v); if (!v) setSoloParentId(""); }}
            >
              <Field label="Solo Parent ID No.">
                <Input placeholder="Enter ID number" value={soloParentId} onChange={(e) => setSoloParentId(e.target.value)} />
              </Field>
            </ClassificationCard>
            <ClassificationCard
              icon={UserRoundIcon}
              label="Senior Citizen"
              description="Resident is a senior citizen (60 years old and above)"
              checked={isSeniorCitizen}
              onCheckedChange={(v) => { setIsSeniorCitizen(v); if (!v) setSeniorCitizenId(""); }}
            >
              <Field label="Senior Citizen ID No.">
                <Input placeholder="Enter ID number" value={seniorCitizenId} onChange={(e) => setSeniorCitizenId(e.target.value)} />
              </Field>
            </ClassificationCard>
            <ClassificationCard
              icon={AccessibilityIcon}
              label="Person with Disability"
              description="Resident has a disability"
              checked={hasDisability}
              onCheckedChange={(v) => { setHasDisability(v); if (!v) { setDisabilityId(""); setDisabilityType(""); } }}
            >
              <Field label="Disability ID No.">
                <Input placeholder="Enter ID number" value={disabilityId} onChange={(e) => setDisabilityId(e.target.value)} />
              </Field>
              <Field label="Type of disability">
                <PlainSelect value={disabilityType} onChange={setDisabilityType} options={DISABILITY_TYPES} placeholder="Select type" />
              </Field>
            </ClassificationCard>
          </div>
        </SectionCard>

        </div>

        {/* Employment | Assistance ------------------------------------------- */}
        <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard icon={BriefcaseBusinessIcon} title="Employment">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Employment status" required>
              <PlainSelect value={employmentStatus} onChange={setEmploymentStatus} options={["Unspecified", "Employed", "Unemployed"]} />
            </Field>
            {employmentStatus === "Employed" && (
              <Field label="Employed type">
                <PlainSelect value={employedType} onChange={setEmployedType} options={EMPLOYED_TYPES} placeholder="Select type" />
              </Field>
            )}
            {employmentStatus === "Unemployed" && (
              <Field label="Unemployed type">
                <PlainSelect value={unemployedType} onChange={setUnemployedType} options={UNEMPLOYED_TYPES} placeholder="Select type" />
              </Field>
            )}
          </div>
        </SectionCard>

        <SectionCard icon={HeartHandshakeIcon} title="Assistance programs">
          <div className="flex flex-wrap gap-2">
            {programs.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No programs configured.</p>
            )}
            {programs.data?.map((p) => (
              <Button
                key={p.id}
                type="button"
                size="sm"
                variant={programIds.includes(p.id) ? "default" : "outline"}
                onClick={() => toggleProgram(p.id)}
              >
                {p.code}
              </Button>
            ))}
          </div>
        </SectionCard>
        </div>

        {errorMessage && <p role="alert" className="text-sm text-destructive">{errorMessage}</p>}
      </div>

      <DialogFooter className="m-0 rounded-b-xl px-6">
        <DialogClose render={<Button type="button" variant="outline">Cancel</Button>} />
        <Button type="submit" disabled={!canSubmit || mutation.isPending}>
          <SaveIcon />
          {mutation.isPending ? "Saving…" : "Create resident"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <header className="mb-4 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </header>
      {children}
    </section>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  );
}

function HouseholdOption({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "hover:bg-muted/50",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary" : "border-input",
        )}
      >
        {selected && <span className="size-2 rounded-full bg-primary" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function ClassificationCard({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-4 transition-colors has-data-[checked]:border-primary/40 has-data-[checked]:bg-primary/5">
      <label className="flex cursor-pointer items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Checkbox checked={checked} onCheckedChange={(v) => onCheckedChange(!!v)} className="mt-0.5" />
      </label>
      {checked && <div className="mt-4 flex flex-col gap-3 border-t pt-4">{children}</div>}
    </div>
  );
}

function PlainSelect({
  value, onChange, options, placeholder,
}: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
