# Frontend Setup and Development SOP

## 1. Goal
Manage, build, and deploy the React 19 + Vite frontend application.

## 2. Dependencies
- **Node.js**: Environment
- **Vite**: Build tool and dev server
- **TailwindCSS v4**: Styling
- **React Router**: Navigation
- **Supabase JS Client**: Backend communication

## 3. Directory Structure
```
project/
├── src/
│   ├── components/  # Reusable UI React components
│   ├── contexts/    # React Contexts (e.g., AuthContext)
│   ├── pages/       # Route-level components (LoginPage, DashboardPage, etc.)
│   ├── lib/         # Utility functions and clients (Supabase client)
│   ├── types/       # TypeScript type definitions
│   └── App.tsx      # Main application routing
```

## 4. Instructions

### Local Development
To run the project locally, execution scripts should perform the following sequence:
1. Ensure dependencies are installed (`npm install`).
2. Start the Vite development server (`npm run dev`).
3. Ensure `.env` is properly configured with Supabase credentials.

### Building for Production
1. Run `npm run build` which triggers `tsc -b && vite build`.
2. The output will be in the `/dist` folder.

### Adding New Features
1. **Pages**: Add new route components in `src/pages/`.
2. **Routing**: Import and add the new page to `src/App.tsx`.
3. **Components**: For smaller, reusable parts, use `src/components/`, adopting Tailwind for styling.
4. **State Management**: Complex app-wide state should be managed via Contexts in `src/contexts/`.

## 5. UI/UX Guidelines
- Follow the design system extracted from the existing components.
- Rely on Tailwind utility classes.
- Use Lucide React for iconography.
- The UI should maintain the "Soft UI Evolution" or minimal aesthetics typical of modern React templates.

## 6. Execution Hooks
- Scripts in `execution/` can automate component scaffolding, deployment tasks, or environment setup.
