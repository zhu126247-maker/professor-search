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

export default function Home() {
  const [professors, setProfessors] = useState([]);
  const [search, setSearch] = useState("");
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

  const filtered = professors.filter((prof) => {
    const text = `
      ${prof.name}
      ${prof.department}
      ${prof.role}
      ${prof.keywords}
      ${prof.webpage}
      ${prof.personalPage}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Professor Search Database</h1>

        <button
          onClick={startAdd}
          className="border rounded-lg px-4 py-2 shadow-sm"
        >
          Add Professor
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="border rounded-lg p-4 mb-6 grid gap-3 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {editingId ? "Edit Professor" : "Add Professor"}
            </h2>

            <button
              type="button"
              onClick={cancelForm}
              className="border rounded-lg px-3 py-1"
            >
              Cancel
            </button>
          </div>

          <input
            className="border rounded-lg p-3"
            placeholder="Name"
            value={form.name}
            onChange={(e) => updateForm("name", e.target.value)}
            required
          />

          <input
            className="border rounded-lg p-3"
            placeholder="Department"
            value={form.department}
            onChange={(e) => updateForm("department", e.target.value)}
          />

          <input
            className="border rounded-lg p-3"
            placeholder="Role"
            value={form.role}
            onChange={(e) => updateForm("role", e.target.value)}
          />

          <input
            className="border rounded-lg p-3"
            placeholder="University webpage"
            value={form.webpage}
            onChange={(e) => updateForm("webpage", e.target.value)}
          />

          <input
            className="border rounded-lg p-3"
            placeholder="Personal page/lab"
            value={form.personalPage}
            onChange={(e) => updateForm("personalPage", e.target.value)}
          />

          <textarea
            className="border rounded-lg p-3"
            placeholder="Key words, separated by commas"
            value={form.keywords}
            onChange={(e) => updateForm("keywords", e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="border rounded-lg px-4 py-2 shadow-sm"
          >
            {loading
              ? "Saving..."
              : editingId
              ? "Save Changes"
              : "Save Professor"}
          </button>
        </form>
      )}

      <input
        className="w-full border rounded-lg p-3 mb-6"
        placeholder="Search by name, department, role, or keyword..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <p className="mb-4 text-gray-600">
        Showing {filtered.length} professor(s)
      </p>

      <div className="grid gap-4">
        {filtered.map((prof) => (
          <div key={prof.id} className="border rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{prof.name}</h2>
                <p className="text-gray-600">{prof.department}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(prof)}
                  className="border rounded-lg px-3 py-1"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(prof)}
                  className="border rounded-lg px-3 py-1"
                >
                  Delete
                </button>
              </div>
            </div>

            {prof.role && (
              <p className="mt-1">
                <strong>Role:</strong> {prof.role}
              </p>
            )}

            <p className="mt-2">
              <strong>Keywords:</strong> {prof.keywords}
            </p>

            <div className="mt-3 flex gap-4">
              {prof.webpage && (
                <a
                  className="text-blue-600 underline"
                  href={prof.webpage}
                  target="_blank"
                >
                  University Webpage
                </a>
              )}

              {prof.personalPage && (
                <a
                  className="text-blue-600 underline"
                  href={prof.personalPage}
                  target="_blank"
                >
                  Personal/Lab Page
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}