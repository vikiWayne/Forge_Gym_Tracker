import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search, X } from "lucide-react";
import { PageHeader } from "../../shared/ui/PageHeader";
import { InstallApp } from "../pwa/InstallApp";
import { toolGroups } from "./tools";
export function ExplorePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const search = query.trim().toLocaleLowerCase();
  const groups = toolGroups
    .filter((group) => category === "all" || group.id === category)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        (item.title + " " + item.description)
          .toLocaleLowerCase()
          .includes(search),
      ),
    }))
    .filter((group) => group.items.length);
  return (
    <>
      <PageHeader
        eyebrow="MAKE THIS SPACE YOURS"
        title="What would you like to do?"
        description="Everything for your training, all in one place."
      />
      <div className="tool-search">
        <Search size={19} />
        <label className="sr-only" htmlFor="tool-search">
          Find a tool
        </label>
        <input
          id="tool-search"
          type="search"
          placeholder="Find a tool, journal or goal…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        {query && (
          <button
            className="icon-button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
          >
            <X size={18} />
          </button>
        )}
      </div>
      <div className="tool-filters" role="group" aria-label="Filter tools">
        {[{ id: "all", title: "All tools" }, ...toolGroups].map((group) => (
          <button
            key={group.id}
            type="button"
            aria-pressed={category === group.id}
            onClick={() => setCategory(group.id)}
          >
            {group.title}
          </button>
        ))}
      </div>
      <span className="sr-only" role="status">
        {groups.reduce((sum, group) => sum + group.items.length, 0)} tools found
      </span>
      {groups.length ? (
        groups.map((group) => (
          <section className="explore-section" key={group.id}>
            <h2>{group.title}</h2>
            <div className="explore-grid">
              {group.items.map(({ to, title, description, icon: Icon }) => (
                <Link className="panel explore-card" to={to} key={to}>
                  <span className="panel-icon">
                    <Icon size={21} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        ))
      ) : (
        <section className="panel tool-no-results">
          <Search size={28} />
          <h2>No matching tools yet.</h2>
          <p>Try “protein”, “routine” or “recovery”.</p>
          <button
            className="button secondary"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Show all tools
          </button>
        </section>
      )}
      <InstallApp />
    </>
  );
}
