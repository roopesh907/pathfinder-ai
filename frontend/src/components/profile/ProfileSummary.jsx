
import { GLASS } from "../../constants/styles";

export default function ProfileSummary({ profile }) {
  return (
    <div
      className={`mb-6 flex flex-wrap gap-x-6 gap-y-2 rounded-xl px-4 py-3 text-xs ${GLASS}`}
    >
      <span>
        <span className="text-zinc-500">Time: </span>
        <span className="text-zinc-200">
          {profile.weekly_hours} hours per week
        </span>
      </span>

      <span>
        <span className="text-zinc-500">Budget: </span>
        <span className="text-zinc-200">
          ₹{Number(profile.monthly_budget).toLocaleString("en-IN")} per month
        </span>
      </span>

      <span>
        <span className="text-zinc-500">Level: </span>
        <span className="text-zinc-200">{profile.education_level}</span>
      </span>
    </div>
  );
}
