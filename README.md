# RoadGuard 🚗🛣️

A real-time road safety and alert management system built with React, Vite, and Material-UI.

## 🌟 Features

- **Interactive Map**: Real-time road alerts and hazards visualization using React Leaflet
- **Alert Reporting**: Report road incidents with location, photos, and voice messages
- **Emergency Services**: Quick access to emergency contacts (Police, Fire, Hospital)
- **User Profiles**: Track your contributions and verify status
- **Admin Dashboard**: Manage alerts, users, and system analytics
- **Real-time Updates**: WebSocket integration for live alert updates

## 🛠️ Tech Stack

- **Frontend**: React 19 + Vite
- **UI Library**: Material-UI (MUI) + Tailwind CSS
- **Maps**: React Leaflet + OpenStreetMap
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd RoadGuard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:

   - `VITE_API_BASE_URL`: Your backend API URL
   - `VITE_SOCKET_URL`: WebSocket server URL
   - Map configuration (center coordinates, zoom level)

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Build for production**

   ```bash
   npm run build
   ```

6. **Preview production build**
   ```bash
   npm run preview
   ```

## 🚀 Available Scripts

- `npm run dev` - Start development server (default: http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
RoadGuard/
├── src/
│   ├── assets/          # Images, icons, media files
│   ├── components/      # Reusable components (Navbar, etc.)
│   ├── context/         # React Context providers
│   ├── pages/           # Page components
│   │   ├── MapPage.jsx
│   │   ├── ReportAlert.jsx
│   │   ├── Emergency.jsx
│   │   ├── Profile.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   ├── App.jsx          # Main app component
│   └── main.jsx         # App entry point
├── public/              # Static assets
├── .env                 # Environment variables (not in git)
├── .env.example         # Example environment variables
└── package.json         # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables

| Variable              | Description            | Default                 |
| --------------------- | ---------------------- | ----------------------- |
| `VITE_API_BASE_URL`   | Backend API endpoint   | `http://localhost:5000` |
| `VITE_SOCKET_URL`     | WebSocket server URL   | `http://localhost:5000` |
| `VITE_MAP_CENTER_LAT` | Map default latitude   | `23.8103` (Dhaka)       |
| `VITE_MAP_CENTER_LNG` | Map default longitude  | `90.4125` (Dhaka)       |
| `VITE_MAP_ZOOM`       | Map default zoom level | `12`                    |

### Backend Requirements

This frontend requires a backend API server. Make sure your backend is running and configured with:

- User authentication endpoints (`/auth/login`, `/auth/signup`)
- Alert management endpoints
- WebSocket server for real-time updates

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 Development Notes

- The app uses React 19 with Fast Refresh via SWC
- Tailwind CSS is configured for utility-first styling
- Material-UI components are used for consistent design
- ESLint is configured with React-specific rules

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and confidential.

## 👥 Team

- Branch: Arafath
- Branch: Bably

## 🆘 Support

For support, please contact the development team.

---

**Built with ❤️ for safer roads**
