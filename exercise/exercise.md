# Claude Code Exercises

If you get stuck - ask claude code. If you have an issue, drag and drop a screenshot to the console. If you are not satisfied - tell claude code. Take the exercises as guiding project, feel free to explore outside of this list or take different approaches.

## Exercise 1 — Create a feature branch

Ask Claude to create a new git branch following this naming convention:

```
exercise-<name>-<emaildomain>
```

Use your git username and email to derive the values. For example, if your git user is "Jane Doe" with email "jane@acme.com", the branch would be:

```
exercise-jane-acme.com
```

## Exercise 2 — Run the project locally

Ask Claude to start the project and give you the URL for the application.

## Exercise 3 — Generate an app overview page

Ask Claude:

> Create a new file `app-overview.html` which is self-contained and explains the app from 3 different perspectives:
> - **Product** — explaining the features
> - **Architecture and tech** — explaining the stack, database, internal communications
> - **Tests** — explaining any available tests
>
> The design needs to be "modern tech". When you are done, take a screenshot of the file and do a self-eval. If the eval is good, give me the URL to open in browser.

## Exercise 4 — Plan a feature: board stats

Ask Claude:

> Enter plan mode. On the main screen (list of boards), add stats for each board card. The stats should include:
> - Number of lists
> - Total tasks
> - Number of tasks past due date
> - Number of tasks with due date in the next 5 days

Review the plan Claude produces. If you want changes to the feature, chat with Claude about them — it will update the plan. When you're satisfied with the implementation plan, instruct Claude to execute the plan.

> **Note:** After Claude implements backend changes, you may need to ask it to restart the API server for the changes to take effect.

## Exercise 5 — Redesign the UI

First, install the official **frontend-design** skill. This skill guides Claude to produce distinctive, production-grade UI code instead of generic-looking output.

Run this in your terminal:

```bash
mkdir -p ~/.claude/skills/frontend-design
curl -sL https://raw.githubusercontent.com/anthropics/claude-code/main/plugins/frontend-design/skills/frontend-design/SKILL.md \
  -o ~/.claude/skills/frontend-design/SKILL.md
```

> **Note:** After installing, restart your Claude Code session so the new `/frontend-design` skill is picked up. You can verify it appears by typing `/` and looking for `frontend-design` in the autocomplete list.

Now ask Claude:

> Use /frontend-design to redesign the entire application with a dark, high-tech aesthetic. The design should follow these principles:
> - **Backgrounds**: Near-black base with layered dark surfaces for cards and panels
> - **Borders**: Subtle, thin borders on cards and containers to create depth
> - **Accent colors**: Indigo-to-cyan gradients for highlighted text and active elements. Use vivid colors (green, yellow, red, purple, orange, cyan) for badges, labels, and status indicators
> - **Glow effects**: Soft radial glows in the background, and neon-style box shadows on hover for interactive elements like buttons and cards
> - **Header**: Glassmorphism style — semi-transparent with backdrop blur and a thin bottom border
> - **Typography**: Light text on dark backgrounds, muted gray for secondary text, gradient treatment for key headings
> - **Inputs and forms**: Dark input fields with colored focus rings
>
> Take a screenshot when done and self-evaluate.

## Exercise 6 — Add card comments

Ask Claude:

> Enter plan mode. I want users to be able to leave comments on cards. Here are the requirements:
> - Add a `Comment` model to the Prisma schema with fields: id, text, createdAt, cardId, userId
> - Create API routes for posting and retrieving comments (`POST` and `GET` on `/api/cards/:cardId/comments`)
> - In the card modal, display existing comments showing the commenter's name and a relative timestamp (e.g. "2 hours ago")
> - Add an input at the bottom of the modal to post a new comment
> - Comments should appear newest-first

Review the plan Claude produces — check that it covers the migration, API routes, auth middleware, and frontend changes. Ask questions or request adjustments if needed. When you're happy with the plan, instruct Claude to execute it.

> **Note:** After Claude implements backend changes, you may need to ask it to restart the API server for the changes to take effect.

## Exercise 7 — Add light mode toggle

Ask Claude:

> Add a light/dark mode toggle to the app. The toggle should:
> - Add a toggle button in the Header component
> - Persist the user's preference in localStorage
> - Update all existing styles to support both themes using CSS custom properties
> - Apply appropriate light mode colors across all pages and components
>
> Take a screenshot when done and self-evaluate.
