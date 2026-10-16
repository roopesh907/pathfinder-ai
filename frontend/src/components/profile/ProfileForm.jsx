import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, LoaderCircle, Plus, X } from "lucide-react";

import Chip from "@/components/ui/Chip";
import OptionButton from "@/components/ui/OptionButton";

import {
  EDUCATION_OPTIONS,
  INTEREST_OPTIONS,
  SKILL_OPTIONS,
} from "@/constants/profile";
import { formatRupees, formatSkill } from "@/utils/formatters";

function CustomOption({ value, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-500/10 py-1 pl-3 pr-1.5 text-sm text-violet-200">
      {value}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${value}`}
        className="rounded-full p-0.5 transition hover:bg-white/10"
      >
        <X size={13} />
      </button>
    </span>
  );
}

function CustomOptionEditor({ label, value, onChange, onAdd, onCancel }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onAdd();
      }}
      className="mt-3 flex flex-wrap items-center gap-2"
    >
      <input
        autoFocus
        aria-label={label}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`Enter ${label.toLowerCase()}...`}
        maxLength={60}
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10"
      />

      <Button
        type="submit"
        size="sm"
        disabled={!value.trim()}
        className="gap-1.5 rounded-xl bg-violet-500 text-white hover:bg-violet-400"
      >
        <Plus size={14} />
        Add
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={onCancel}
        className="rounded-xl text-slate-400 hover:text-white"
      >
        Cancel
      </Button>
    </form>
  );
}

export default function ProfileForm({
  initialProfile,
  submitting = false,
  onSubmit,
  onCancel,
}) {
  const [draft, setDraft] = useState(() => ({
    ...initialProfile,
    interests: [...(initialProfile?.interests ?? [])],
    skills: [...(initialProfile?.skills ?? [])],
  }));

  const [showInterestEditor, setShowInterestEditor] = useState(false);
  const [showSkillEditor, setShowSkillEditor] = useState(false);

  const [customInterest, setCustomInterest] = useState("");
  const [customSkill, setCustomSkill] = useState("");

  const canSubmit = draft.interests.length > 0 && !submitting;

  function updateField(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggle(key, value) {
    setDraft((current) => {
      const selected = current[key] ?? [];

      const updated = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];

      return {
        ...current,
        [key]: updated,
      };
    });
  }

  function addCustomOption(key, value, setValue, setEditorOpen) {
    const cleanedValue = value.trim().replace(/\s+/g, " ");

    if (!cleanedValue) return;

    setDraft((current) => {
      const existing = current[key] ?? [];

      const alreadyExists = existing.some(
        (item) => item.toLowerCase() === cleanedValue.toLowerCase(),
      );

      if (alreadyExists) {
        return current;
      }

      return {
        ...current,
        [key]: [...existing, cleanedValue],
      };
    });

    setValue("");
    setEditorOpen(false);
  }

  function removeCustomOption(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: (current[key] ?? []).filter((item) => item !== value),
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) return;

    // Goals are intentionally omitted from the submitted profile.
    const profileWithoutGoals = { ...draft };
    delete profileWithoutGoals.goals;

    onSubmit({
      ...profileWithoutGoals,
      interests: [...draft.interests],
      skills: [...draft.skills],
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
      <div className="space-y-8">
        {/* Weekly learning time */}
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-white">
                Weekly learning time
              </Label>

              <p className="text-sm text-slate-400">
                How much time can you dedicate to learning?
              </p>
            </div>

            <span className="shrink-0 rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-sm font-semibold text-violet-200">
              {draft.weekly_hours} hrs/week
            </span>
          </div>

          <Slider
            value={[draft.weekly_hours]}
            min={1}
            max={40}
            step={1}
            onValueChange={(value) => updateField("weekly_hours", value[0])}
            aria-label="Weekly learning hours"
          />

          <div className="flex justify-between text-xs text-slate-500">
            <span>1 hour</span>
            <span>40 hours</span>
          </div>
        </section>

        <Separator className="bg-white/10" />

        {/* Monthly budget */}
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-white">
                Monthly learning budget
              </Label>

              <p className="text-sm text-slate-400">
                How much can you spend on courses and resources?
              </p>
            </div>

            <span className="shrink-0 rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-sm font-semibold text-violet-200">
              {formatRupees(draft.monthly_budget)}
            </span>
          </div>

          <Slider
            value={[draft.monthly_budget]}
            min={0}
            max={5000}
            step={100}
            onValueChange={(value) => updateField("monthly_budget", value[0])}
            aria-label="Monthly learning budget in rupees"
          />

          <div className="flex justify-between text-xs text-slate-500">
            <span>Free resources</span>
            <span>₹5,000</span>
          </div>
        </section>

        <Separator className="bg-white/10" />

        {/* Education level */}
        <section className="space-y-3">
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-white">
              Education level
            </Label>

            <p className="text-sm text-slate-400">
              Choose the option that best describes you.
            </p>
          </div>

          <div
            role="group"
            aria-label="Education level"
            className="grid grid-cols-1 gap-2 sm:grid-cols-2"
          >
            {EDUCATION_OPTIONS.map((option) => (
              <OptionButton
                key={option}
                label={option}
                selected={draft.education_level === option}
                onClick={() => updateField("education_level", option)}
              />
            ))}
          </div>
        </section>

        <Separator className="bg-white/10" />

        {/* Interests */}
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-white">
                Interests
              </Label>

              <p className="text-sm text-slate-400">
                Select the subjects you enjoy exploring.
              </p>
            </div>

            <span className="shrink-0 text-xs text-slate-500">
              {draft.interests.length} selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((interest) => (
              <Chip
                key={interest}
                label={formatSkill(interest)}
                selected={draft.interests.includes(interest)}
                onClick={() => toggle("interests", interest)}
              />
            ))}
          </div>

          {draft.interests.filter(
            (interest) => !INTEREST_OPTIONS.includes(interest),
          ).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {draft.interests
                .filter((interest) => !INTEREST_OPTIONS.includes(interest))
                .map((interest) => (
                  <CustomOption
                    key={interest}
                    value={interest}
                    onRemove={() => removeCustomOption("interests", interest)}
                  />
                ))}
            </div>
          )}

          {showInterestEditor ? (
            <CustomOptionEditor
              label="Interest"
              value={customInterest}
              onChange={setCustomInterest}
              onAdd={() =>
                addCustomOption(
                  "interests",
                  customInterest,
                  setCustomInterest,
                  setShowInterestEditor,
                )
              }
              onCancel={() => {
                setCustomInterest("");
                setShowInterestEditor(false);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowInterestEditor(true)}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-violet-300 transition hover:bg-violet-500/10 hover:text-violet-200"
            >
              <Plus size={15} />
              Add a custom interest
            </button>
          )}

          {draft.interests.length === 0 && (
            <p className="text-sm text-amber-300">
              Select at least one interest to get career recommendations.
            </p>
          )}
        </section>

        <Separator className="bg-white/10" />

        {/* Skills */}
        <section className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-white">
                Current skills
              </Label>

              <p className="text-sm text-slate-400">
                Select skills you already have, even if you are a beginner.
              </p>
            </div>

            <span className="shrink-0 text-xs text-slate-500">
              {draft.skills.length} selected
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map((skill) => (
              <Chip
                key={skill}
                label={formatSkill(skill)}
                selected={draft.skills.includes(skill)}
                onClick={() => toggle("skills", skill)}
              />
            ))}
          </div>

          {draft.skills.filter((skill) => !SKILL_OPTIONS.includes(skill))
            .length > 0 && (
            <div className="flex flex-wrap gap-2">
              {draft.skills
                .filter((skill) => !SKILL_OPTIONS.includes(skill))
                .map((skill) => (
                  <CustomOption
                    key={skill}
                    value={skill}
                    onRemove={() => removeCustomOption("skills", skill)}
                  />
                ))}
            </div>
          )}

          {showSkillEditor ? (
            function CustomOptionEditor({
              label,
              value,
              onChange,
              onAdd,
              onCancel,
            }) {
              function handleKeyDown(event) {
                if (event.key === "Enter") {
                  event.preventDefault();

                  if (value.trim()) {
                    onAdd();
                  }
                }
              }

              return (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    autoFocus
                    aria-label={label}
                    type="text"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    maxLength={60}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-400/10"
                  />

                  <Button
                    type="button"
                    size="sm"
                    disabled={!value.trim()}
                    onClick={onAdd}
                    className="gap-1.5 rounded-xl bg-violet-500 text-white hover:bg-violet-400"
                  >
                    <Plus size={14} />
                    Add
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={onCancel}
                    className="rounded-xl text-slate-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              );
            }
          ) : (
            <button
              type="button"
              onClick={() => setShowSkillEditor(true)}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-violet-300 transition hover:bg-violet-500/10 hover:text-violet-200"
            >
              <Plus size={15} />
              Add a custom skill
            </button>
          )}
        </section>
      </div>

      {/* Form actions */}
      <div className="sticky bottom-0 mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-white/10 bg-slate-950/90 py-4 backdrop-blur-xl">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-xl text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="gap-2 rounded-xl bg-violet-500 px-5 text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <LoaderCircle size={16} className="animate-spin" />
              Finding careers...
            </>
          ) : (
            <>
              Find my career paths
              <ArrowRight size={16} />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
