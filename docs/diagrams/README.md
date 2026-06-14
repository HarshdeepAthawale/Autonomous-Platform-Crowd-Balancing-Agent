# Diagrams

Wa-modern architecture and application-flow visuals for the project (palette from [Design.md](../../Design.md)).

| File | Description |
|------|-------------|
| `architecture.mmd` / `.png` / `.svg` | Four-layer system: Perception → Backend → Multi-Agent → Action |
| `app-flow.mmd` / `.png` / `.svg` | End-to-end flow: passenger journey, agent loop, actions, outcome |
| `mermaid-config.json` | Shared Mermaid theme (Kinari paper, Ai indigo, Hanada accents) |
| `render.sh` | Re-render PNG + SVG from `.mmd` sources |

## Re-render

```bash
cd docs/diagrams && ./render.sh
```

Requires `@mermaid-js/mermaid-cli` (`mmdc`) and Chrome/Chromium. Set `PUPPETEER_EXECUTABLE_PATH` if needed.

## Used in

- [readme.md](../../readme.md) — architecture + app flow images
- [AppFlow.md](../../AppFlow.md) — full application flow narrative
