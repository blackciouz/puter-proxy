const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
app.use(express.json());

// Render utilise le port défini dans l'environnement, ou 3000 par défaut
const PORT = process.env.PORT || 3000;

app.post('/puter-chat', async (req, res) => {
  const { prompt, model = 'gpt-5-nano' } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Le paramètre "prompt" est requis.' });
  }

  let browser;
  try {
    // Lancement de Puppeteer avec des arguments recommandés pour Render/Linux
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();

    // On injecte le HTML et le script Puter dans la page
    const htmlContent = `
      <html>
        <body>
          <script src="https://js.puter.com/v2/"></script>
          <script>
            async function getPuterResponse(prompt, model) {
              try {
                // ATTENTION: C'est ici que l'appel échouera à cause de l'authentification
                const response = await puter.ai.chat(prompt, { model: model });
                return response;
              } catch (error) {
                console.error("Erreur depuis Puter:", error);
                return { error: "Puter Error: " + error.message };
              }
            }
          </script>
        </body>
      </html>
    `;
    await page.setContent(htmlContent);

    // On exécute la fonction dans le contexte du navigateur
    const response = await page.evaluate(async (prompt, model) => {
      return await getPuterResponse(prompt, model);
    }, prompt, model);

    res.json(response);

  } catch (error) {
    console.error("Erreur dans le proxy Puppeteer:", error);
    res.status(500).json({ error: "Proxy Error: " + error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Serveur proxy Puter écoutant sur le port ${PORT}`);
});
