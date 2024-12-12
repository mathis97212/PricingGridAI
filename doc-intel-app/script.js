const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');

const apiKey = "1QKpFo9JUKxFYVLWzHxvrE2AWR67HkF61rq1Tl3AdKDwEXNvVhv7JQQJ99ALACHYHv6XJ3w3AAAAACOGfmM9";
const apiUrl = "https://diall-m48m4jbi-eastus2.cognitiveservices.azure.com/openai/deployments/gpt-4-2/chat/completions?api-version=2024-08-01-preview";

async function callAzureOpenAI(prompt) {
    try {
        const response = await axios.post(
            apiUrl,
            {
                messages: [
                    { role: 'system', content: `restructure la grille tariffaire suivante et le format doit ressembler à un csv comme celui-ci : Produit	Prix \nSABLE 0/6 AMIENOIS	€6,30 \nGRAVE 0/31,5 AMIENOIS	€8,40 \n0/80 AMIENOIS	€7,30 \n` },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 100,
                temperature: 0.5,
                top_p: 1,
                n: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': apiKey,
                }
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error calling Azure OpenAI:', error.response?.data || error.message);
        throw error;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function cleanGridWithOpenAI(data) {
    const chunkSize = 5; 
    const chunks = [];

    for (let i = 0; i < data.length; i += chunkSize) {
        chunks.push(data.slice(i, i + chunkSize));
    }

    let cleanedData = '';
    for (const chunk of chunks) {
        console.log(chunk)
        const prompt = chunk.join('\n');
        const cleanedChunk = await callAzureOpenAI(prompt);
        cleanedData += cleanedChunk + '\n';
        console.log(cleanedData)
        await sleep(11000); 
    }

    return cleanedData;
}

async function main() {
    const inputCsvPath = './tables_output.csv';
    const outputCsvPath = './cleaned_tables_output.csv';

    const inputCsvData = [];

    fs.createReadStream(inputCsvPath)
        .pipe(csv())
        .on('data', (row) => {
            inputCsvData.push(Object.values(row).join(','));
        })
        .on('end', async () => {
            try {
                const cleanedData = await cleanGridWithOpenAI(inputCsvData);
                fs.writeFileSync(outputCsvPath, cleanedData);
                console.log('Data cleaned and saved to', outputCsvPath);
            } catch (error) {
                console.error('Erreur lors du nettoyage:', error);
            }
        });
}

main().catch((error) => {
    console.error('Erreur lors du nettoyage:', error);
});
