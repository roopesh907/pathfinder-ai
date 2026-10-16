
import { memo } from "react";
import { Clock3, Wallet, GraduationCap } from "lucide-react";
import { GLASS } from "../../constants/styles";

function ProfileSummary({ profile }) {
  if (!profile) return null;

  const details = [
    {
      label: "Time",
      value: `${profile.weekly_hours} hours/week`,
      Icon: Clock3,
    },
    {
      label: "Budget",
      value: `₹${Number(profile.monthly_budget).toLocaleString("en-IN")}/month`,
      Icon: Wallet,
    },
    {
      label: "Level",
      value: profile.education_level,
      Icon: GraduationCap,
    },
  ];

  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl px-3 py-2 sm:px-4 ${GLASS}`}
      aria-label="Your profile summary"
    >
      {details.map(({ label, value, Icon }) => (
        <div key={label} className="flex min-w-0 items-center gap-2">
          <Icon
            size={13}
            className="shrink-0 text-indigo-300/80"
            aria-hidden="true"
          />

          <span className="text-xs text-zinc-500">{label}</span>

          <span className="text-xs font-medium text-zinc-200">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default memo(ProfileSummary);
