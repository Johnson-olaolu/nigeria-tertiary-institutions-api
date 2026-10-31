// Swagger UI page for /docs. Assets come from a CDN because serverless hosts like Vercel
// don't serve files from node_modules, which is how swagger-ui-express delivers them.
const SWAGGER_UI_CDN = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.33.3";

const docsPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Nigeria Tertiary Institutions API</title>
    <link rel="stylesheet" href="${SWAGGER_UI_CDN}/swagger-ui.css">
    <link rel="icon" type="image/png" href="${SWAGGER_UI_CDN}/favicon-32x32.png" sizes="32x32">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="${SWAGGER_UI_CDN}/swagger-ui-bundle.js" crossorigin></script>
    <script src="${SWAGGER_UI_CDN}/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: "/docs.json",
                dom_id: "#swagger-ui",
                presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
                layout: "StandaloneLayout",
                deepLinking: true,
            });
        };
    </script>
</body>
</html>`;

export default docsPage;
