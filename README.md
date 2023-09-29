# Save the Servers

The booth game for Øredev 2023.

**NOTE: This documentation is a work in progress.**

## Packages

| Package     | Description                                                                              | Implementation Status |
| ----------- | ---------------------------------------------------------------------------------------- | --------------------- |
| app         | Self-contained application that combines backend and frontend, for easy local deployment | Not implemented.      |
| backend     | Persists and vends leaderboard data.                                                     | Not implemented.      |
| backend-api | TypeScript API for the above.                                                            | Not implemented.      |
| frontend    | The in-browser application.                                                              | Mostly done.          |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) version ≥ 18.18.0 (LTS), < 19
- [pnpm](https://pnpm.io/) version ≥ 8.8.0

**Tip:** Use [Volta](https://volta.sh) for easy version management of the above (even on Windows!).
