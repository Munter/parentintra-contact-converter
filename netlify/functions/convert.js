const { parse } = require("csv-parse/sync");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    let csvContent = new URLSearchParams(event.body).get("csvContent");

    const [firstLine, otherLines] = csvContent.split("\n");

    if (firstLine.startsWith("sep=")) {
      csvContent = otherLines.join("\n");
    }

    const records = parse(csvContent, {
      delimiter: ";",
      columns: [
        "childName",
        "contactName",
        "address",
        "homePhone",
        "mobilePhone",
        "workPhone",
      ],
    }).slice(1); // Skip header

    const vcards = records
      .map((row) =>
        createVCard(
          row.contactName,
          row.address,
          row.homePhone,
          row.mobilePhone,
          row.workPhone,
          row.childName
        )
      )
      .join("");

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/vcard",
        "Content-Disposition": 'attachment; filename="contacts.vcf"',
      },
      body: vcards,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function sanitizePhone(phone) {
  return phone ? phone.replace(/\D/g, "") : "";
}

function createVCard(
  contactName,
  address,
  homePhone,
  mobilePhone,
  workPhone,
  childName
) {
  let vcard = `BEGIN:VCARD\n`;
  vcard += `VERSION:3.0\n`;
  vcard += `FN:${contactName}\n`;

  if (address) {
    vcard += `ADR:;;${address}\n`;
  }

  if (homePhone) {
    vcard += `TEL;TYPE=HOME,VOICE:${sanitizePhone(homePhone)}\n`;
  }
  if (mobilePhone) {
    vcard += `TEL;TYPE=CELL,VOICE:${sanitizePhone(mobilePhone)}\n`;
  }
  if (workPhone) {
    vcard += `TEL;TYPE=WORK,VOICE:${sanitizePhone(workPhone)}\n`;
  }

  if (childName) {
    vcard += `X-RELATION:PARENT OF ${childName}\n`;
  }

  vcard += `END:VCARD\n\n`;
  return vcard;
}
