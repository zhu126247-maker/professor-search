import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

const table = base(process.env.AIRTABLE_TABLE_NAME);

function formatRecord(record) {
  return {
    id: record.id,
    name: record.get("Name") || "",
    department: record.get("Department") || "",
    webpage: record.get("Webpage") || "",
    personalPage: record.get("personal page/lab") || "",
    role: record.get("role") || "",
    keywords: record.get("key words") || "",
    engagement: record.get("CBEY/PSIA Engagement") || [],
  };
}

function buildFields(body) {
  return {
    Name: body.name || "",
    Department: body.department || "",
    Webpage: body.webpage || "",
    "personal page/lab": body.personalPage || "",
    role: body.role || "",
    "key words": body.keywords || "",
    "CBEY/PSIA Engagement": Array.isArray(body.engagement)
      ? body.engagement
      : [],
  };
}

export async function GET() {
  try {
    const records = await table.select().all();
    return Response.json(records.map(formatRecord));
  } catch (error) {
    console.error("Airtable GET error:", error);

    return Response.json(
      {
        error: error.error || error.message || "Failed to fetch professors",
        message: error.message,
        statusCode: error.statusCode,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const createdRecords = await table.create([
      {
        fields: buildFields(body),
      },
    ]);

    return Response.json(formatRecord(createdRecords[0]), { status: 201 });
  } catch (error) {
    console.error("Airtable POST error:", error);

    return Response.json(
      {
        error: error.error || error.message || "Failed to add professor",
        message: error.message,
        statusCode: error.statusCode,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return Response.json({ error: "Missing professor ID" }, { status: 400 });
    }

    const updatedRecords = await table.update([
      {
        id: body.id,
        fields: buildFields(body),
      },
    ]);

    return Response.json(formatRecord(updatedRecords[0]));
  } catch (error) {
    console.error("Airtable PATCH error:", error);

    return Response.json(
      {
        error: error.error || error.message || "Failed to update professor",
        message: error.message,
        statusCode: error.statusCode,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();

    if (!body.id) {
      return Response.json({ error: "Missing professor ID" }, { status: 400 });
    }

    await table.destroy([body.id]);

    return Response.json({ success: true, id: body.id });
  } catch (error) {
    console.error("Airtable DELETE error:", error);

    return Response.json(
      {
        error: error.error || error.message || "Failed to delete professor",
        message: error.message,
        statusCode: error.statusCode,
      },
      { status: 500 }
    );
  }
}