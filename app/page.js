"use client";

import { useEffect, useRef, useState } from "react";

const engagementOptions = [
  "Commercialization - Lab to Market",
  "Policy Acceleration",
  "Applied Research",
  "Teaching and Curriculum",
];

const emptyForm = {
  name: "",
  department: "",
  webpage: "",
  personalPage: "",
  role: "",
  keywords: "",
  engagement: [],
};

function splitKeywords(keywords) {
  if (!keywords) return [];

  return keywords
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean);
}

function splitDepartments(department) {
  if (!department) return [];

  return department
    .split(",")
    .map((dept) => dept.trim())
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
    query.includes("Dan") ||
    query.includes("dog")
  ) {
    return "Handsome Dan approves this directory.";
  }

  if (query.includes("coffee") || query.includes("caffeine")) {
    return "No exact match, but several professors probably need some.";
  }

  if (query.includes("quantum")) {
    return "Careful. The results may change when observed.";
  }

  if (query.includes("carbon")) {
    return "Carbon found. Now price it.";
  }

  if (query.includes("climate")) {
    return "Searching for people working on the future.";
  }

  if (query.includes("yale")) {
    return "That one was easy.";
  }

  if (query.includes("nothing")) {
    return "Nothing found. Philosophically impressive.";
  }

  if (query.includes("meaning of life")) {
    return "No exact match. Try philosophy, biology, or coffee.";
  }

  if (query.includes("help")) {
    return "Try searching by professor name, department, keyword, webpage, or engagement type.";
  }

  if (query.includes("cbey")) {
    return "Connecting business and the environment.";
  }

  return null;
}

function toggleArrayValue(array, value) {
  if (array.includes(value)) {
    return array.filter((item) => item !== value);
  }

  return [...array, value];
}

function matchesAnySelected(values, selectedValues) {
  if (selectedValues.length === 0) return true;

  if (!Array.isArray(values) || values.length === 0) return false;

  return values.some((value) => selectedValues.includes(value));
}

export default function Home() {
  const [professors, setProfessors] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedEngagement, setSelectedEngagement] = useState([]);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [surpriseProfessor, setSurpriseProfessor] = useState(null);

  const departmentDropdownRef = useRef(null);
  const engagementDropdownRef = useRef(null);

  async function loadProfessors() {
    const res = await fetch("/api/professors");
    const data = await res.json();
    setProfessors(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    loadProfessors();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      const clickedDepartment =
        departmentDropdownRef.current &&
        departmentDropdownRef.current.contains(event.target);

      const clickedEngagement =
        engagementDropdownRef.current &&
        engagementDropdownRef.current.contains(event.target);

      if (!clickedDepartment && !clickedEngagement) {
        setOpenDropdown(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

  function handleSurpriseMe() {
  if (professors.length === 0) return;

  const randomIndex = Math.floor(Math.random() * professors.length);
  const randomProfessor = professors[randomIndex];

  setSearch("");
  setSelectedDepartments([]);
  setSelectedEngagement([]);
  setOpenDropdown(null);
  setSurpriseProfessor(randomProfessor);
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
      engagement: Array.isArray(prof.engagement) ? prof.engagement : [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  }

  function toggleFormEngagement(option) {
    setForm((prev) => ({
      ...prev,
      engagement: toggleArrayValue(prev.engagement, option),
    }));
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

  const departments = Array.from(
    new Set(professors.flatMap((prof) => splitDepartments(prof.department)))
  ).sort();

  const filtered = surpriseProfessor
  ? [surpriseProfessor]
  : professors.filter((prof) => {
      const text = `
        ${prof.name}
        ${prof.department}
        ${prof.role}
        ${prof.keywords}
        ${prof.webpage}
        ${prof.personalPage}
        ${Array.isArray(prof.engagement) ? prof.engagement.join(" ") : ""}
      `.toLowerCase();

      const professorDepartments = splitDepartments(prof.department);
      const professorEngagement = Array.isArray(prof.engagement)
        ? prof.engagement
        : [];

      const matchesSearch = text.includes(search.toLowerCase());

      const matchesDepartment = matchesAnySelected(
        professorDepartments,
        selectedDepartments
      );

      const matchesEngagement = matchesAnySelected(
        professorEngagement,
        selectedEngagement
      );

      return matchesSearch && matchesDepartment && matchesEngagement;
    });

  const easterEgg = getEasterEgg(search);
  const quantumMode = search.toLowerCase().trim().includes("quantum");
  return (
    <main className="min-h-screen bg-[#F7F4EC] text-[#1F2933]">
      <header className="bg-[#00356B] text-white">
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#D7E3D1]">
            Yale CBEY and PSIA
          </p>

          <h1 className="font-serif text-4xl font-semibold tracking-tight md:text-5xl">
            Environmental Faculty Directory
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-[#E6EEF7]">
            Search faculty working across climate, energy, markets, policy,
            conservation, and environmental systems.
          </p>
        </div>
      </header>

      <section className="border-b border-[#D8D2C4] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            <input
              className="min-h-11 flex-1 border border-[#CFC7B8] bg-[#FBFAF7] px-4 text-sm outline-none focus:border-[#00356B]"
              placeholder="Search by name, role, keyword, department, webpage, or engagement..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSurpriseProfessor(null);
              }}
            />

            <div ref={departmentDropdownRef} className="relative md:w-40">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(
                    openDropdown === "departments" ? null : "departments"
                  )
                }
                className="min-h-11 w-full border border-[#CFC7B8] bg-[#FBFAF7] px-3 py-3 text-left text-sm outline-none hover:border-[#00356B]"
              >
                Departments
                {selectedDepartments.length > 0
                  ? ` (${selectedDepartments.length})`
                  : ""}
              </button>

              {openDropdown === "departments" && (
                <div className="absolute z-20 mt-2 max-h-72 w-56 overflow-auto border border-[#CFC7B8] bg-white p-3 shadow-lg">
                  {departments.map((dept) => (
                    <label key={dept} className="mb-2 flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedDepartments.includes(dept)}
                        onChange={() => {
                          setSurpriseProfessor(null);
                          setSelectedDepartments((prev) =>
                            toggleArrayValue(prev, dept)
                          );
         
                        }}
                      />
                      {dept}
                    </label>
                  ))}

                  {selectedDepartments.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedDepartments([])}
                      className="mt-2 text-xs font-semibold text-[#00356B] underline"
                    >
                      Clear departments
                    </button>
                  )}
                </div>
              )}
            </div>

            <div ref={engagementDropdownRef} className="relative md:w-48">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(
                    openDropdown === "engagement" ? null : "engagement"
                  )
                }
                className="min-h-11 w-full border border-[#CFC7B8] bg-[#FBFAF7] px-3 py-3 text-left text-sm outline-none hover:border-[#00356B]"
              >
                Engagement
                {selectedEngagement.length > 0
                  ? ` (${selectedEngagement.length})`
                  : ""}
              </button>

              {openDropdown === "engagement" && (
                <div className="absolute z-20 mt-2 w-64 border border-[#CFC7B8] bg-white p-3 shadow-lg">
                  {engagementOptions.map((option) => (
                    <label key={option} className="mb-2 flex gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedEngagement.includes(option)}
                        onChange={() => {
                          setSurpriseProfessor(null);
                          setSelectedEngagement((prev) =>
                            toggleArrayValue(prev, option)
                          );
                        }}
                      />
                      {option}
                    </label>
                  ))}

                  {selectedEngagement.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedEngagement([])}
                      className="mt-2 text-xs font-semibold text-[#00356B] underline"
                    >
                      Clear engagement
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSurpriseMe}
              className="min-h-11 border border-[#3F6F4E] px-4 text-sm font-semibold text-[#3F6F4E] transition hover:bg-[#3F6F4E] hover:text-white"
            >
              surprise me
            </button>
            <button
              onClick={startAdd}
              className="min-h-11 border border-[#00356B] px-4 text-sm font-semibold text-[#00356B] transition hover:bg-[#00356B] hover:text-white"
            >
              + Add record
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-2 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
            <p>
              Showing{" "}
              <span className="font-semibold text-[#00356B]">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#00356B]">
                {professors.length}
              </span>{" "}
              faculty profile(s)
            </p>

            <p className="text-xs uppercase tracking-wide text-[#3F6F4E]">
              Searchable research database
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-7">
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 border border-[#CFC7B8] bg-white p-5"
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

            <div className="mt-4 border-t border-[#E4DED2] pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#3F6F4E]">
                CBEY/PSIA Engagement
              </p>

              <div className="grid gap-2 md:grid-cols-2">
                {engagementOptions.map((option) => (
                  <label key={option} className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.engagement.includes(option)}
                      onChange={() => toggleFormEngagement(option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
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
          <div className="mb-5 border-l-4 border-[#00356B] bg-white px-5 py-3 text-sm font-semibold text-[#00356B]">
            {easterEgg}
          </div>
        )}

        <div className="mb-4 border-b border-[#CFC7B8] pb-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#3F6F4E]">
            Results
          </p>
          <h2 className="font-serif text-2xl font-semibold text-[#00356B]">
            Faculty Profiles
          </h2>
        </div>

        <div
          className={
            quantumMode
              ? "quantum-effect divide-y divide-[#D8D2C4] border-y border-[#D8D2C4] bg-white"
              : "divide-y divide-[#D8D2C4] border-y border-[#D8D2C4] bg-white"
          }
        >
          {filtered.map((prof) => (
            <article
              key={prof.id}
              className="px-5 py-4 transition hover:bg-[#FBFAF7]"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-[#00356B]">
                    {prof.name}
                  </h3>

                  {prof.role && (
                    <p className="mt-1 text-sm text-[#1F2933]">{prof.role}</p>
                  )}

                  {prof.department && (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                      {splitDepartments(prof.department).map((dept) => (
                        <span
                          key={dept}
                          className="text-xs font-semibold uppercase tracking-wide text-[#3F6F4E]"
                        >
                          {dept}
                        </span>
                      ))}
                    </div>
                  )}

                  {Array.isArray(prof.engagement) &&
                    prof.engagement.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {prof.engagement.map((item) => (
                          <span
                            key={item}
                            className="border border-[#CFC7B8] bg-[#FBFAF7] px-2 py-0.5 text-xs font-medium text-[#00356B]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                </div>

                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => startEdit(prof)}
                    className="text-sm font-medium text-[#00356B] underline underline-offset-4 hover:text-[#3F6F4E]"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(prof)}
                    className="text-sm font-medium text-red-700 underline underline-offset-4 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {prof.keywords && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {splitKeywords(prof.keywords).map((keyword) => {
                    const isMatch = keywordMatchesSearch(keyword, search);

                    return (
                      <span
                        key={keyword}
                        className={
                          isMatch
                            ? "border border-[#3F6F4E] bg-[#E6EFE8] px-2 py-0.5 text-xs font-semibold text-[#1F2933] shadow-[0_0_0_2px_rgba(63,111,78,0.2)] transition"
                            : "border border-[#D8D2C4] bg-[#F7F4EC] px-2 py-0.5 text-xs text-[#1F2933] transition"
                        }
                      >
                        {keyword}
                      </span>
                    );
                  })}
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-5">
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
            <div className="bg-white p-8 text-center text-gray-600">
              No matching faculty profiles found. Try a broader keyword,
              department, engagement type, or research area.
            </div>
          )}
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