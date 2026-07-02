"use client";

import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  department: "",
  webpage: "",
  personalPage: "",
  role: "",
  keywords: "",
};

function splitKeywords(keywords) {
  if (!keywords) return [];

  return keywords
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);
}

function keywordMatchesSearch(keyword, search) {
  if (!search.trim()) return false;

  return keyword.toLowerCase().includes(search.toLowerCase().trim());
}

function getEasterEgg(search) {
  const query = search.toLowerCase().trim();

  if (!query) return null;

  if (
    query.includes("handsome dan") ||
    query.includes("bulldog") ||
    query.includes("dog")
  ) {
    return "Handsome Dan approves this directory.";
  }

  if (query.includes("carbon")) {
    return "Carbon found. Now price it.";
  }

  if (query.includes("cbey")) {
    return "Connecting business and the environment.";
  }

  return null;
}

export default function Home() {
  const [professors, setProfessors] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  async function loadProfessors() {
    const res = await fetch("/api/professors");
    const data = await res.json();
    setProfessors(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadProfessors();
  }, []);

  function updateForm(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function startAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(prof) {
    setEditingId(prof.id);
    setForm({
      name: prof.name || "",
      department: prof.department || "",
      webpage: prof.webpage || "",
      personalPage: prof.personalPage || "",
      role: prof.role || "",
      keywords: prof.keywords || "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (editingId) {
      const confirmed = window.confirm(
        "Are you sure you want to save these changes? This will update the Airtable database."
      );

      if (!confirmed) return;
    }

    setLoading(true);

    try {
      const method = editingId ? "PATCH" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;

      const res = await fetch("/api/professors", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(
          "Failed to save professor: " +
            (errorData.message || errorData.error)
        );
        return;
      }

      const savedProfessor = await res.json();

      if (editingId) {
        setProfessors((prev) =>
          prev.map((prof) =>
            prof.id === savedProfessor.id ? savedProfessor : prof
          )
        );
      } else {
        setProfessors((prev) => [savedProfessor, ...prev]);
      }

      cancelForm();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(prof) {
    const confirmed = window.confirm(
      `ARE YOU SURE you want to delete ${prof.name}? This will permanently remove the record from Airtable.`
    );

    if (!confirmed) return;

    const secondConfirmed = window.confirm(
      "Final warning: this deletion is permanent. Click OK to delete, or Cancel to stop."
    );

    if (!secondConfirmed) return;

    const res = await fetch("/api/professors", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: prof.id }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert(
        "Failed to delete professor: " +
          (errorData.message || errorData.error)
      );
      return;
    }

    setProfessors((prev) => prev.filter((item) => item.id !== prof.id));
  }

  const departments = [
    "All",
    ...Array.from(
      new Set(
        professors
          .map((prof) => prof.department)
          .filter(Boolean)
      )
    ).sort(),
  ];

  const filtered = professors.filter((prof) => {
    const text = `
      ${prof.name}
      ${prof.department}
      ${prof.role}
      ${prof.keywords}
      ${prof.webpage}
      ${prof.personalPage}
    `.toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const matchesDepartment =
      departmentFilter === "All" || prof.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const easterEgg = getEasterEgg(search);

  return (
    <main className="min-h-screen bg-[#F6F3EA] text-[#1F2933]">
      <header className="border-b border-[#D8D2C4] bg-[#00356B] text-white">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-[#D7E3D1]">
            CBEY
          </p>

          <h1 className="max-w-4xl font-serif text-4xl font-semibold leading-tight md:text-5xl">
            Environmental Faculty Directory
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-[#E6EEF7] md:text-lg">
            Search faculty working across climate, energy, markets, policy,
            conservation, and environmental systems.
          </p>
        </div>
      </header>

      <section className="border-b border-[#D8D2C4] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#3F6F4E]">
              Searchable research database
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Browse by name, department, role, webpage, or associated research
              keywords.
            </p>
          </div>

          <button
            onClick={startAdd}
            className="border border-[#00356B] bg-[#00356B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-[#00356B]"
          >
            Add Professor
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 border border-[#CFC7B8] bg-white p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-4 border-b border-[#E4DED2] pb-3">
              <h2 className="font-serif text-2xl font-semibold text-[#00356B]">
                {editingId ? "Edit Professor" : "Add Professor"}
              </h2>

              <button
                type="button"
                onClick={cancelForm}
                className="border border-[#CFC7B8] px-3 py-1.5 text-sm hover:bg-[#F6F3EA]"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="border border-[#CFC7B8] bg-[#FBFAF7] p-3 outline-none focus:border-[#00356B]"
                placeholder="Name"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                required
              />

              <input
                className="border border-[#CFC7B8] bg-[#FBFAF7] p-3 outline-none focus:border-[#00356B]"
                placeholder="Department"
                value={form.department}
                onChange={(e) => updateForm("department", e.target.value)}
              />

              <input
                className="border border-[#CFC7B8] bg-[#FBFAF7] p-3 outline-none focus:border-[#00356B]"
                placeholder="Role"
                value={form.role}
                onChange={(e) => updateForm("role", e.target.value)}
              />

              <input
                className="border border-[#CFC7B8] bg-[#FBFAF7] p-3 outline-none focus:border-[#00356B]"
                placeholder="University webpage"
                value={form.webpage}
                onChange={(e) => updateForm("webpage", e.target.value)}
              />

              <input
                className="border border-[#CFC7B8] bg-[#FBFAF7] p-3 outline-none focus:border-[#00356B] md:col-span-2"
                placeholder="Personal page/lab"
                value={form.personalPage}
                onChange={(e) => updateForm("personalPage", e.target.value)}
              />

              <textarea
                className="min-h-24 border border-[#CFC7B8] bg-[#FBFAF7] p-3 outline-none focus:border-[#00356B] md:col-span-2"
                placeholder="Key words, separated by commas"
                value={form.keywords}
                onChange={(e) => updateForm("keywords", e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 border border-[#3F6F4E] bg-[#3F6F4E] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-[#3F6F4E]"
            >
              {loading
                ? "Saving..."
                : editingId
                ? "Save Changes"
                : "Save Professor"}
            </button>
          </form>
        )}

        {easterEgg && (
          <div className="mb-5 border border-[#00356B] bg-white px-5 py-4 text-sm font-semibold text-[#00356B]">
            {easterEgg}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[270px_1fr]">
          <aside className="h-fit border border-[#CFC7B8] bg-white p-5">
            <h2 className="border-b border-[#E4DED2] pb-3 font-serif text-2xl font-semibold text-[#00356B]">
              Filters
            </h2>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Search
              </label>
              <input
                className="mt-2 w-full border border-[#CFC7B8] bg-[#FBFAF7] p-3 outline-none focus:border-[#00356B]"
                placeholder="Name, role, keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                Department
              </label>
              <select
                className="mt-2 w-full border border-[#CFC7B8] bg-[#FBFAF7] p-3 outline-none focus:border-[#00356B]"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 border-t border-[#E4DED2] pt-4">
              <p className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold text-[#00356B]">
                  {filtered.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#00356B]">
                  {professors.length}
                </span>{" "}
                professor(s)
              </p>
            </div>
          </aside>

          <section>
            <div className="mb-4 flex items-end justify-between border-b border-[#CFC7B8] pb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#3F6F4E]">
                  Results
                </p>
                <h2 className="font-serif text-2xl font-semibold text-[#00356B]">
                  Faculty Profiles
                </h2>
              </div>
            </div>

            <div className="grid gap-4">
              {filtered.map((prof) => (
                <article
                  key={prof.id}
                  className="border border-[#CFC7B8] bg-white p-5 transition hover:border-[#00356B]"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-serif text-2xl font-semibold text-[#00356B]">
                        {prof.name}
                      </h3>

                      {prof.role && (
                        <p className="mt-1 text-base text-[#1F2933]">
                          {prof.role}
                        </p>
                      )}

                      {prof.department && (
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[#3F6F4E]">
                          {prof.department}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => startEdit(prof)}
                        className="border border-[#CFC7B8] px-3 py-1.5 text-sm hover:border-[#00356B] hover:text-[#00356B]"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(prof)}
                        className="border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {prof.keywords && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {splitKeywords(prof.keywords).map((keyword) => {
                        const isMatch = keywordMatchesSearch(keyword, search);

                        return (
                          <span
                            key={keyword}
                            className={
                              isMatch
                                ? "border border-[#3F6F4E] bg-[#E6EFE8] px-2.5 py-1 text-xs font-semibold text-[#1F2933] shadow-[0_0_0_2px_rgba(63,111,78,0.22)] transition"
                                : "border border-[#D8D2C4] bg-[#F6F3EA] px-2.5 py-1 text-xs text-[#1F2933] transition"
                            }
                          >
                            {keyword}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-5 border-t border-[#E4DED2] pt-4">
                    {prof.webpage && (
                      <a
                        className="text-sm font-semibold text-[#00356B] underline underline-offset-4 hover:text-[#3F6F4E]"
                        href={prof.webpage}
                        target="_blank"
                      >
                        University Webpage
                      </a>
                    )}

                    {prof.personalPage && (
                      <a
                        className="text-sm font-semibold text-[#00356B] underline underline-offset-4 hover:text-[#3F6F4E]"
                        href={prof.personalPage}
                        target="_blank"
                      >
                        Personal/Lab Page
                      </a>
                    )}
                  </div>
                </article>
              ))}

              {filtered.length === 0 && (
                <div className="border border-[#CFC7B8] bg-white p-8 text-center text-gray-600">
                  No matching faculty profiles found. Try a broader keyword,
                  department, or research area.
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      <footer className="border-t border-[#D8D2C4] bg-white">
        <div className="group mx-auto max-w-6xl px-6 py-6 text-sm text-gray-600">
          <span className="group-hover:hidden">
            Built as a searchable directory for CBEY-related environmental
            research connections.
          </span>

          <span className="hidden text-[#3F6F4E] group-hover:inline">
            🌱 Built with caffeine, Airtable, and optimism.
          </span>
        </div>
      </footer>
    </main>
  );
}