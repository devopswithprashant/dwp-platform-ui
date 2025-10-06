# Reactjs Blog Frontend

> Follow the separate documentation for complete CI/CD pipeline & SDLC workflow. [visit here](https://gitlab.com/my-first-group5031428/blog-frontend/-/wikis/home)

## Overview

A lightweight React.js frontend for a blog application. It provides pages to list blogs, view blog details, create and edit blog posts, plus a marketing-style home page and a small reusable component for human-friendly timestamps.

### Key features:
- List all blog posts
- Read a single blog with edit/delete actions
- Create new blog posts
- Edit existing blog posts
- Re-usable PrettyTime component for “x minutes ago” style timestamps
- Client-side routing with React Router
- Uses axios for HTTP calls to a backend API

## Prerequisites
- Node.js (v14+ recommended)
- npm or yarn
- An API backend that exposes these endpoints (examples used in code). for more detail [visit here](https://gitlab.com/my-first-group5031428/blog-backend-restapi/-/blob/feat/doc/README.md):
- GET `/api/v1/blogs` - list all blogs
- GET `/api/v1/blogs/:id` - fetch single blog
- POST `/api/v1/blogs` - create blog
- PUT `/api/v1/blog/:id` - update blog
- DELETE `/api/v1/blog/:id` - delete blog

**Note**: The project uses relative API paths (/api/v1/...) so a proxy or reverse proxy is expected in development or production to route API calls to the backend.

## How to run (developer flow)
1. Clone the repository.
1. Install dependencies: npm install or yarn.
1. Start development server: `npm start` .
1. Run tests: `npm test`.



## Environment & Configuration
- API base URL is hard-coded as relative paths (e.g. axios.get('/api/v1/blogs')). For different environments, either:
- Configure a reverse proxy (recommended), or
- Replace axios calls with an apiClient wrapper that reads process.env.REACT_APP_API_BASE_URL.

Example .env variables you may add if implementing an API client wrapper:
```bash
REACT_APP_API_BASE_URL=https://api.example.com
```

## Project structure (important files)
- `src/App.js` - application root and route definitions. Renders Navbar, configures React Router routes for Home, Blogs, BlogDetail, Create and Edit flows.
- `src/components/Navbar.js` - top navigation bar with links and a + Create button that navigates to /create.
- `src/components/Home.js` - marketing/home page with hero, features, CTAs (statics + props-driven heading).
- `src/components/Blogs.js` - fetches list of blogs from backend and renders them as a Bootstrap list group. Each item links to /blogs/:id.
- `src/components/BlogDetail.js` - fetches a single blog by :id, displays title, author, publish/last-updated timestamps, content, and provides Edit/Delete actions.
- `src/components/CreateBlog.js` - form to create a new blog. On submit it posts publishdate and lastupdatedate timestamps and navigates back to /blogs.
- `src/components/EditBlog.js` - fetches an existing blog into a form, allows editing and submits a PUT to update lastupdatedate.
- `src/components/PrettyTime.js` - small component using date-fns formatDistanceToNow to render human-friendly elapsed time and updates itself every minute.
- `src/components/*.test.js` - unit tests for Home and PrettyTime using React Testing Library and Jest.


## Component details & behaviors

#### Routing (App.js)
1. Uses BrowserRouter, Routes and Route components. Main routes:
1. / -> Home
1. /blogs -> Blogs
1. /blogs/:id -> BlogDetail
1. /create -> CreateBlog
1. /blogs/:id/edit -> EditBlog

#### Blogs list (Blogs.js)
1. Calls GET /api/v1/blogs and stores the response in blogs state.
1. Renders a loading spinner while blogs is null.
1. Each blog list item shows title, author and the two timestamps using PrettyTime.

#### Blog detail (BlogDetail.js)
1. Calls GET /api/v1/blogs/:id and shows full content.
1. Delete triggers DELETE /api/v1/blog/:id, with a confirm() prompt. On success navigates to /blogs.
1. Edit navigates to the edit route.

#### Create / Edit forms
1. CreateBlog posts publishdate and lastupdatedate as new Date().toISOString() when creating.
1. EditBlog fetches existing blog values and updates lastupdatedate before sending the PUT request.

#### PrettyTime
1. Uses formatDistanceToNow(new Date(timestamp), { addSuffix: true }) and updates every minute via setInterval.



## API contract (shape expected in code)

From how the components consume the data, a blog object is expected to include at least these fields:
```json
{
  "id": "<number|string>",
  "title": "string",
  "content": "string",
  "author": "string",
  "publishdate": "ISO-8601 timestamp string",
  "lastupdatedate": "ISO-8601 timestamp string"
}
```

## Styling & UI
 - The app uses Bootstrap classes throughout (e.g., container, card, list-group, btn, etc.).
 - Home.js imports ../styles/Home.css for additional custom styles.

## Testing
 - Tests included:
 - Home.test.js — asserts the heading prop renders.
 - PrettyTime.test.js — tests human-friendly output and interval-based updates (uses Jest timers).











