const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");
const fs = require("fs");

const key = "e3d0464ba6e14a22875d7d0d7cea87ef";
const endpoint = "https://francecentral.api.cognitive.microsoft.com/";
const pdfFilePath = "./grilles/test1.pdf";
const outputCsvPath = "./tables_output.csv";

async function main() {
    const client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(key));

    const fileStream = fs.createReadStream(pdfFilePath);

    const poller = await client.beginAnalyzeDocument("prebuilt-document", fileStream, {
        contentType: "application/pdf",
    });

    const { tables } = await poller.pollUntilDone();

    if (!tables || tables.length === 0) {
        console.log("No tables were extracted from the document.");
    } else {
        console.log(`Extracted ${tables.length} table(s):`);

        const csvData = [];

        tables.forEach((table, tableIndex) => {
            console.log(`\nTable ${tableIndex + 1}:`);

            const tableCsvData = [];
            table.cells.forEach((cell) => {
                if (!tableCsvData[cell.rowIndex]) {
                    tableCsvData[cell.rowIndex] = [];
                }
                tableCsvData[cell.rowIndex][cell.columnIndex] = cell.content.trim();
            });

            tableCsvData.forEach((row, rowIndex) => {
                console.log(`Row ${rowIndex + 1}: ${row.join(" | ")}`);
                csvData.push(row);
            });
        });

        writeCsv(csvData, outputCsvPath);
        console.log(`The tables have been saved to: ${outputCsvPath}`);
    }
}

function writeCsv(data, filePath) {
    const csvContent = data.map((row) => row.map((cell) => `"${cell || ""}"`).join(",")).join("\n");
    fs.writeFileSync(filePath, csvContent, "utf8");
}

main().catch((error) => {
    console.error("An error occurred:", error);
    process.exit(1);
});
