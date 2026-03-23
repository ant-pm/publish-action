import * as core from "@actions/core";
import * as fs from "fs";

async function run(): Promise<void> {
    try {
        const registryUrl = core.getInput("registry_url", { required: true });

        core.info("Requesting OIDC token...");
        const token = await core.getIDToken(registryUrl);

        const archivePath = "/tmp/archive.tar.gz";

        if (!fs.existsSync(archivePath)) {
            throw new Error(`Archive not found: ${archivePath}`);
        }

        core.info(`Uploading archive to ${registryUrl}/publish...`);
        const body = fs.readFileSync(archivePath);

        const response = await fetch(`${registryUrl}/publish`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/gzip",
            },
            body,
        });

        if (!response.ok) {
            const text = await response.text();
            core.setFailed(
                `Publish failed with status ${response.status}: ${text}`,
            );
            return;
        }

        core.info("Package published successfully");
    } catch (error) {
        core.setFailed(
            error instanceof Error
                ? error.message
                : "An unexpected error occurred",
        );
    }
}

run();
