Below is a concise, step‑by‑step guide with exact commands to point shivansh-sharma.vercel.app to the latest deployment.
Option A — Point to the latest production deployment (recommended)

1. Find the latest production deployment URL:
   vercel ls
   Look for the newest Production entry and copy the URL (e.g. https://shivansh-portfolio-<hash>-...vercel.app).
2. Point the domain to that deployment:
   vercel alias set <LATEST_PROD_DEPLOYMENT_URL> shivansh-sharma.vercel.app
3. Verify the alias:
   vercel inspect shivansh-sharma.vercel.app
   Confirm the url in the output matches the deployment you set.

---

Option B — Point to the latest deployment from a specific build

1. Find the newest deployment from main:
   vercel ls
2. Alias that URL:
   vercel alias set <DEPLOYMENT_URL> shivansh-sharma.vercel.app
3. Verify:
   vercel inspect shivansh-sharma.vercel.app
