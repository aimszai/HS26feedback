# HS26feedback
HS26feedback

## Admin-Bereich

Die Administration ist unter `/admin.html` erreichbar. Der Admin-Zugang wird über serverseitige Umgebungsvariablen konfiguriert; Zugangsdaten gehören nicht in die Website oder ins Repository.

In den Vercel-Projekteinstellungen unter **Settings → Environment Variables** setzen:

- `ADMIN_USERNAME` auf `admin`
- `ADMIN_PASSWORD` auf das gewünschte Admin-Passwort
- `ADMIN_SESSION_SECRET` auf einen zufälligen, geheimen Wert mit mindestens 32 Zeichen (z. B. mit `openssl rand -base64 32` erzeugen)

Anschließend neu deployen. Ohne diese Variablen ist die Anmeldung deaktiviert. Admin-Sitzungen laufen nach acht Stunden ab. Öffentliche Nutzer können weiterhin Module und Feedback hinzufügen; vollständige Änderungen und Löschungen sind der Admin-Sitzung vorbehalten.
