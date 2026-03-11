import { google } from "googleapis";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const FOLDER_ID = process.env.DRIVE_FOLDER_ID;
if (!FOLDER_ID) {
    console.error("❌ DRIVE_FOLDER_ID environment variable is not set");
    process.exit(1);
}
const OUTPUT_DIR = path.join(REPO_ROOT, "input_data");

// File types and how to handle them
const FILE_HANDLERS = {
    "text/csv": {
        extension: ".csv",
        download: (drive, fileId) =>
            drive.files.get({ fileId, alt: "media" }, { responseType: "text" }),
    },
    "application/vnd.google-apps.spreadsheet": {
        extension: ".csv",
        download: (drive, fileId) =>
            drive.files.export(
                { fileId, mimeType: "text/csv" },
                { responseType: "text" }
            ),
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        extension: ".xlsx",
        download: (drive, fileId) =>
            drive.files.get(
                { fileId, alt: "media" },
                { responseType: "arraybuffer" }
            ),
    },
};

const SUPPORTED_TYPES = Object.keys(FILE_HANDLERS);

async function withRetry(fn, maxAttempts = 3, baseDelayMs = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt < maxAttempts) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1);
                console.warn(`   ⚠️  Attempt ${attempt}/${maxAttempts} failed: ${err.message}. Retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

async function authenticate() {
    const auth = new google.auth.GoogleAuth({
        scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    return google.drive({ version: "v3", auth });
}

async function listFolders(drive, parentId) {
    const res = await drive.files.list({
        q: `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: "files(id, name)",
    });
    return res.data.files || [];
}

async function listFiles(drive, folderId) {
    const typeFilter = SUPPORTED_TYPES.map((t) => `mimeType='${t}'`).join(
        " or "
    );

    const res = await drive.files.list({
        q: `'${folderId}' in parents and (${typeFilter}) and trashed=false`,
        fields: "files(id, name, mimeType, modifiedTime)",
        orderBy: "name",
    });

    return res.data.files || [];
}

async function downloadFile(drive, file) {
    const handler = FILE_HANDLERS[file.mimeType];
    if (!handler) {
        console.warn(`⚠️  Unsupported file type for ${file.name}: ${file.mimeType}`);
        return null;
    }

    const response = await withRetry(() => handler.download(drive, file.id));

    const baseName = path.parse(file.name).name;
    const outputName = `${baseName}${handler.extension}`;

    return {
        name: outputName,
        data: response.data,
        isBinary: handler.extension === ".xlsx",
    };
}

async function fetchFolder(drive, folderId, outputPath) {
    await mkdir(outputPath, { recursive: true });

    const files = await listFiles(drive, folderId);

    if (files.length === 0) {
        console.log(`   📭 No files found in ${outputPath}`);
        return { success: 0, fail: 0 };
    }

    let success = 0;
    let fail = 0;

    for (const file of files) {
        try {
            const result = await downloadFile(drive, file);

            if (!result) {
                fail++;
                continue;
            }

            const filePath = path.join(outputPath, result.name);

            if (result.isBinary) {
                await writeFile(filePath, Buffer.from(result.data));
            } else {
                await writeFile(filePath, result.data, "utf-8");
            }

            console.log(`   ✅ ${result.name} (modified: ${file.modifiedTime})`);
            success++;
        } catch (err) {
            console.error(`   ❌ ${file.name}: ${err.message}`);
            fail++;
        }
    }

    return { success, fail };
}

async function main() {
    console.log("🏟️  PUL Stats Hub — Fetching data from Google Drive\n");

    const drive = await authenticate();
    console.log("✅ Authenticated with Google Cloud\n");

    // Look for year subfolders (e.g. "2024", "2025", "2026")
    const subfolders = await listFolders(drive, FOLDER_ID);
    const yearFolders = subfolders.filter((f) => /^\d{4}$/.test(f.name));

    let totalSuccess = 0;
    let totalFail = 0;

    if (yearFolders.length > 0) {
        // Structured: root folder has year subfolders
        for (const folder of yearFolders) {
            console.log(`📂 ${folder.name}/`);
            const outputPath = path.join(OUTPUT_DIR, folder.name);
            const { success, fail } = await fetchFolder(drive, folder.id, outputPath);
            totalSuccess += success;
            totalFail += fail;
            console.log();
        }
    } else {
        // Flat: files directly in root folder
        console.log("📂 Root folder (no year subfolders found)");
        const { success, fail } = await fetchFolder(drive, FOLDER_ID, OUTPUT_DIR);
        totalSuccess += success;
        totalFail += fail;
    }

    console.log(`\n📊 Done: ${totalSuccess} fetched, ${totalFail} failed`);

    if (totalFail > 0) {
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("💥 Fatal error:", err.message);
    process.exit(1);
});
