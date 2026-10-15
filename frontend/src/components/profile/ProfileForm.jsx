
import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { ArrowRight, LoaderCircle } from "lucide-react";

import Chip from "../ui/Chip";
import { OptionButton } from "../ui/OptionButton";

import { GLASS } from "../../constants/styles";
import {
  EDUCATION_OPTIONS,
  INTEREST_OPTIONS,
  SKILL_OPTIONS,
} from "../../constants/profile";
import {
  formatRupees,
  formatSkill,
} from "../../utils/formatters";

export default function ProfileForm({
  initialProfile,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [draft, setDraft] = useState(initialProfile);

  const canSubmit = draft.interests.length > 0 && !submitting;

  function update(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggle(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!canSubmit) return;

    onSubmit({ ...draft, goals: draft.goals.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className={`space-y-4 rounded-xl p-5 ${GLASS}`}>
        <div className="flex items-baseline justify-between">
          <Label className="text-sm font-medium text-zinc-200">
            Time per week
          </Label>

          <span className="text-sm tabular-nums text-zinc-100">
            {draft.weekly_hours} hours
          </span>
        </div>

        <Slider
          aria-label="Hours per week"
          min={1}
          max={40}
          step={1}
          value={[draft.weekly_hours]}
          onValueChange={([value]) => update("weekly_hours", value)}
        />

        <p className="text-xs text-zinc-500">
          The time you can realistically spend learning each week.
        </p>
      </section>

      <section className={`space-y-4 rounded-xl p-5 ${GLASS}`}>
        <div className="flex items-baseline justify-between">
          <Label className="text-sm font-medium text-zinc-200">
            Monthly budget for courses
          </Label>

          <span className="text-sm tabular-nums text-zinc-100">
            {formatRupees(draft.monthly_budget)}
          </span>
        </div>

        <Slider
          aria-label="Monthly budget in rupees"
          min={0}
          max={5000}
          step={100}
          value={[draft.monthly_budget]}
          onValueChange={([value]) => update("monthly_budget", value)}
        />

        <p className="text-xs text-zinc-500">
          Set to ₹0 to use free resources only.
        </p>
      </section>

      <section className={`space-y-3 rounded-xl p-5 ${GLASS}`}>
        <Label className="text-sm font-medium text-zinc-200">
          Education level
        </Label>

        <div
          role="radiogroup"
          aria-label="Education level"
          className="grid gap-2 sm:grid-cols-2"
        >
          {EDUCATION_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              active={draft.education_level === option}
              onClick={() => update("education_level", option)}
            >
              {option}
            </OptionButton>
          ))}
        </div>
      </section>

      <section className={`space-y-3 rounded-xl p-5 ${GLASS}`}>
        <Label className="text-sm font-medium text-zinc-200">
          Interests
        </Label>

        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => (
            <Chip
              key={interest}
              active={draft.interests.includes(interest)}
              onClick={() => toggle("interests", interest)}
            >
              {formatSkill(interest)}
            </Chip>
          ))}
        </div>

        {draft.interests.length === 0 && (
          <p className="text-xs text-rose-300">
            Select at least one interest.
          </p>
        )}
      </section>

      <section className={`space-y-3 rounded-xl p-5 ${GLASS}`}>
        <Label className="text-sm font-medium text-zinc-200">
          Current skills
        </Label>

        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map((skill) => (
            <Chip
              key={skill}
              active={draft.skills.includes(skill)}
              onClick={() => toggle("skills", skill)}
            >
              {formatSkill(skill)}
            </Chip>
          ))}
        </div>
      </section>

      <section className={`space-y-3 rounded-xl p-5 ${GLASS}`}>
        <Label
          htmlFor="goal"
          className="text-sm font-medium text-zinc-200"
        >
          Goal{" "}
          <span className="font-normal text-zinc-500">(optional)</span>
        </Label>

        <Textarea
          id="goal"
          value={draft.goals}
          onChange={(event) => update("goals", event.target.value)}
          rows={3}
          maxLength={500}
          placeholder="For example: build scientific simulations for research"
          className="resize-none border-white/10 bg-white/[0.02] text-sm text-zinc-100 placeholder:text-zinc-600"
        />
      </section>

      <Separator className="bg-white/10" />

      <div className="flex items-center justify-between gap-3">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-100"
          >
            Back to chat
          </Button>
        ) : (
          <span />
        )}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-40"
        >
          {submitting && (
            <LoaderCircle className="animate-spin" size={15} />
          )}

          {onCancel ? "Save and refresh matches" : "Continue"}

          {!submitting && <ArrowRight size={15} />}
        </Button>
      </div>
    </form>
  );
}
