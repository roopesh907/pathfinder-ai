
export const formatRupees = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

export function formatSkill(skill = "") {
  return String(skill)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
