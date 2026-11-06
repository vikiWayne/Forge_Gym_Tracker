import type { User } from "../../shared/api/types";
export function ProfileFields({ user }: { user?: User | null }) {
  return (
    <>
      <div className="form-row">
        <label>
          Age
          <input
            name="age"
            type="number"
            min="13"
            max="110"
            required
            defaultValue={user?.age}
          />
        </label>
        <label>
          Body weight (kg)
          <input
            name="weight"
            type="number"
            min="0.01"
            max="500"
            step="0.01"
            required
            defaultValue={user?.weight}
          />
        </label>
      </div>
      <label>
        Sex
        <select name="sex" defaultValue={user?.sex || "Prefer not to say"}>
          <option>Prefer not to say</option>
          <option>Female</option>
          <option>Male</option>
          <option>Other</option>
        </select>
      </label>
    </>
  );
}
