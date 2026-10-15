
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
import { formatRupees, formatSkill } from "../../utils/formatters";

const SLIDER_STYLES = [
  "[&>span:first-child]:bg-white/10",
  "[&>span:first-child>span]:bg-gradient-to-r",
  "[&>span:first-child>span]:from-indigo-500",
  "[&>span:first-child>span]:to-violet-400",
  "[&>span:last-child]:border-indigo-300",
  "[&>span:last-child]:bg-zinc-950",
  "[&>span:last-child]:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]",
  "[&>span:last-child]:transition-transform",
  "[&>span:last-child]:duration-150",
  "[&>span:last-child]:hover:scale-110",
  "[&>span:last-child]:focus-visible:outline-none",
  "[&>span:last-child]:focus-visible:ring-2",
  "[&>span:last-child]:focus-visible:ring-indigo-400",
  "[&>span:last-child]:focus-visible:ring-offset-2",
  "[&>span:last-child]:focus-visible:ring-offset-zinc-950",
].join(" ");

const SECTION_STYLES =
  "space-y-4 rounded-2xl border border-white/[0.07] p-5 transition-colors duration-200 hover:border-indigo-400/20 sm:p-6";

const LABEL_STYLES =
  "text-sm font-medium text-zinc-200";

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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Weekly learning time */}
      <section className={`${SECTION_STYLES} ${GLASS}`}>
        <div className="flex items-center justify-between gap-4">
          <Label className={LABEL_STYLES}>
            Time per week
          </Label>

          <span className="rounded-lg border border-indigo-400/20 bg-indigo-400/[0.08] px-3 py-1.5 text-sm font-semibold tabular-nums text-indigo-200">
            {draft.weekly_hours}{" "}
            {draft.weekly_hours === 1 ? "hour" : "hours"}
          </span>
        </div>

        <Slider
          aria-label="Hours per week"
          min={1}
          max={40}
          step={1}
          value={[draft.weekly_hours]}
          onValueChange={([value]) => update("weekly_hours", value)}
          className={`py-1 ${SLIDER_STYLES}`}
        />

        <div className="flex justify-between text-xs text-zinc-500">
          <span>1 hour</span>
          <span>40 hours</span>
        </div>

        <p className="text-xs leading-relaxed text-zinc-400">
          Choose the time you can realistically commit to learning each week.
        </p>
      </section>

      {/* Monthly course budget */}
      <section className={`${SECTION_STYLES} ${GLASS}`}>
        <div className="flex items-center justify-between gap-4">
          <Label className={LABEL_STYLES}>
            Monthly budget for courses
          </Label>

          <span className="rounded-lg border border-violet-400/20 bg-violet-400/[0.08] px-3 py-1.5 text-sm font-semibold tabular-nums text-violet-200">
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
          className={`py-1 ${SLIDER_STYLES}`}
        />

        <div className="flex justify-between text-xs text-zinc-500">
          <span>₹0</span>
          <span>₹5,000</span>
        </div>

        <p className="text-xs leading-relaxed text-zinc-400">
          Set your budget to ₹0 if you want to use free learning resources only.
        </p>
      </section>

      {/* Education */}
      <section className={`${SECTION_STYLES} ${GLASS} space-y-3`}>
        <Label className={LABEL_STYLES}>
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

      {/* Interests */}
      <section className={`${SECTION_STYLES} ${GLASS} space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <Label className={LABEL_STYLES}>
            Interests
          </Label>

          <span className="text-xs tabular-nums text-zinc-500">
            {draft.interests.length} selected
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => (
            <Chip
              key={interest}
              selected={draft.interests.includes(interest)}
              onClick={() => toggle("interests", interest)}
            >
              {formatSkill(interest)}
            </Chip>
          ))}
        </div>

        {draft.interests.length === 0 && (
          <p className="text-xs text-rose-300" role="alert">
            Select at least one interest to continue.
          </p>
        )}
      </section>

      {/* Current skills */}
      <section className={`${SECTION_STYLES} ${GLASS} space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <Label className={LABEL_STYLES}>
            Current skills
          </Label>

          <span className="text-xs tabular-nums text-zinc-500">
            {draft.skills.length} selected
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {SKILL_OPTIONS.map((skill) => (
            <Chip
              key={skill}
              selected={draft.skills.includes(skill)}
              onClick={() => toggle("skills", skill)}
            >
              {formatSkill(skill)}
            </Chip>
          ))}
        </div>

        <p className="text-xs leading-relaxed text-zinc-400">
          Select the skills you already have. You can build on them in your roadmap.
        </p>
      </section>

      {/* Personal goal */}
      <section className={`${SECTION_STYLES} ${GLASS} space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="goal" className={LABEL_STYLES}>
            Goal{" "}
            <span className="font-normal text-zinc-500">
              (optional)
            </span>
          </Label>

          <span className="text-xs tabular-nums text-zinc-500">
            {draft.goals.length}/500
          </span>
        </div>

        <Textarea
          id="goal"
          value={draft.goals}
          onChange={(event) => update("goals", event.target.value)}
          rows={3}
          maxLength={500}
          placeholder="For example: build scientific simulations for research"
          className="resize-none border-white/10 bg-zinc-950/40 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 hover:border-indigo-400/30 focus-visible:border-indigo-400/60 focus-visible:ring-indigo-400/30"
        />
      </section>

      <Separator className="bg-white/10" />

      {/* Form actions */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={submitting}
            className="text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-zinc-100"
          >
            Back to chat
          </Button>
        ) : (
          <span />
        )}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-950/20 transition-all duration-200 hover:from-indigo-400 hover:to-violet-400 hover:shadow-indigo-500/20 focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting && (
            <LoaderCircle
              className="animate-spin"
              size={15}
              aria-hidden="true"
            />
          )}

          {submitting
            ? "Saving..."
            : onCancel
              ? "Save and refresh matches"
              : "Continue"}

          {!submitting && (
            <ArrowRight
              size={15}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          )}
        </Button>
      </div>
    </form>
  );
}
