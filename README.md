# Front File Explorer

A modern, high-performance file management application built with **Angular 21+**. This project leverages the latest Angular features including Standalone Components, Signals, and the new Control Flow syntax to deliver a responsive and intuitive user experience.

## 🚀 Key Features

### 📂 File Management (Explorer)
- **Browse & Navigate**: Intuitive file browser with support for both List and Grid views.
- **Advanced Operations**: Create folders, rename, delete, move, and copy files/directories.
- **Compression**: Compress multiple files/folders into ZIP archives and extract existing ZIP files.
- **Context Menu**: Right-click context menu for quick actions on files and folders.
- **Drag & Drop**: Seamless file upload and organization (implied capability for modern explorers).
- **Breadcrumbs**: Easy navigation through directory hierarchy.
- **Tree View**: Collapsible directory tree for quick navigation.

### 🖼️ Media & Preview
- **Image Viewer**: Built-in viewer for image files.
- **Video Player**: Integrated video player for streaming content.
- **File Details**: View detailed properties of selected files.

### 🛠️ Advanced Functionality
- **Search**: Powerful search capabilities to find files and folders instantly.
- **Chunked Uploads**: Robust upload system supporting large files with progress tracking.
- **Trash Bin**: Soft delete functionality with restore capabilities.
- **Sharing**: Securely share files and folders with other users.

### 🔐 Security & Administration
- **Authentication**: Secure login and session management.
- **Role-Based Access Control (RBAC)**: Distinct roles for Admins, Editors, and Viewers.
- **User Management**: Admin interface to manage users and permissions.
- **Audit Logs**: Comprehensive tracking of all user actions for security and compliance.
- **Storage Management**: Monitor and manage storage quotas.
- **Background Jobs**: Monitor long-running tasks and system processes.

### ⚡ Real-time Updates
- **WebSockets**: Real-time file system updates (upload, move, delete) and background job progress tracking without page refreshes.

## 💻 Tech Stack

- **Framework**: [Angular 21+](https://angular.dev/)
- **Architecture**: Standalone Components, Signals, OnPush Change Detection.
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/) for utility-first styling.
- **Icons**: FontAwesome 6.
- **State Management**: Angular Signals & RxJS.
- **Real-time**: WebSocket (RxJS WebSocketSubject).
- **Testing**: [Vitest](https://vitest.dev/) for unit testing.
- **Build Tool**: Angular CLI (Vite-based).

## 🏗️ Project Structure

The project follows a modular architecture for scalability and maintainability:

```
src/app/
├── core/           # Singleton services, guards, interceptors, and global models
│   ├── api/        # HTTP services for API communication
│   ├── auth/       # Authentication logic and state
│   ├── websocket/  # Real-time communication service
│   ├── guards/     # Route guards (Auth, Role, etc.)
│   ├── http/       # HTTP interceptors and tokens
│   └── ...
├── features/       # Lazy-loaded feature modules
│   ├── auth/       # Login and password management
│   ├── explorer/   # Main file browser interface
│   ├── admin/      # Administrative features (Users, Audit, etc.)
│   └── ...
├── shared/         # Reusable components, pipes, and directives
└── ...
```

## ⚙️ Configuration

### Environment Variables

Configure the API and WebSocket URLs in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
  wsUrl: 'ws://localhost:8080/api/v1/ws',
};
```

For production, update `src/environments/environment.production.ts`.

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: v18 or higher
- **npm**: v9 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd front-file-explorer
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Development Server

Run the development server:

```bash
npm start
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Build

Build the project for production:

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Running Tests

Execute unit tests via Vitest:

```bash
npm test
```

## 🤝 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
