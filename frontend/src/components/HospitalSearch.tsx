import { Search } from "lucide-react";

type HospitalSearchProps = {
  search: string;
  state: string;
  onSearchChange: (value: string) => void;
  onStateChange: (value: string) => void;
};

export function HospitalSearch({ search, state, onSearchChange, onStateChange }: HospitalSearchProps) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[1fr_140px]">
      <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3">
        <Search size={17} className="text-slate-400" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search hospital, city, or provider ID"
          className="h-10 w-full border-0 bg-transparent text-sm outline-none"
        />
      </label>
      <input
        value={state}
        onChange={(event) => onStateChange(event.target.value.toUpperCase().slice(0, 2))}
        placeholder="State"
        className="h-10 rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-teal"
      />
    </div>
  );
}
