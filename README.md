This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Virtual Try-On for Clothes

An AI-powered virtual try-on system that allows users to see how clothes will look on them using **Mediapipe Pose Detection** and **Three.js** for 3D rendering.

## Project Structure
```
virtual-try-on/
├── frontend/                      # Next.js frontend application
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── TryOn/           # Try-on related components
│   │   │   ├── Layout/          # Layout components
│   │   │   └── UI/              # Reusable UI components
│   │   ├── pages/               # Next.js pages
│   │   ├── styles/              # CSS/SCSS files
│   │   ├── utils/               # Utility functions
│   │   └── lib/                 # Third-party integrations
│   ├── public/                  # Static files
│   │   ├── models/             # 3D clothing models
│   │   └── assets/             # Images and other assets
│   └── package.json
│
├── backend/                      # FastAPI backend (optional)
│   ├── app/
│   │   ├── api/                # API routes
│   │   ├── core/               # Core functionality
│   │   ├── models/             # Data models
│   │   └── services/           # Business logic
│   ├── requirements.txt
│   └── main.py
│
├── models/                      # ML models and scripts
│   ├── pose_detection/         # Mediapipe pose detection
│   └── cloth_segmentation/     # Clothing segmentation models
│
└── docs/                       # Documentation
    ├── api/                    # API documentation
    └── setup/                  # Setup guides
```

## Features
- Real-time body pose detection using Mediapipe
- 3D clothing models rendered using Three.js
- Webcam integration for live try-on
- Easy integration with e-commerce platforms

## Tech Stack
- **Frontend**: 
  - Next.js
  - Three.js for 3D rendering
  - Mediapipe for pose detection
  - TailwindCSS for styling (recommended)
- **Backend** (Optional): 
  - FastAPI
  - PostgreSQL/MongoDB
- **ML/AI**: 
  - Mediapipe
  - TensorFlow

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/virtual-try-on.git
   cd virtual-try-on
   ```

2. Setup Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Setup Backend (Optional):
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

## Development Setup

1. Frontend Development:
   - Start the development server:
     ```bash
     cd frontend
     npm run dev
     ```
   - Access the application at `http://localhost:3000`

2. Backend Development (Optional):
   - Start the FastAPI server:
     ```bash
     cd backend
     uvicorn main:app --reload
     ```
   - Access the API at `http://localhost:8000`
   - API documentation available at `http://localhost:8000/docs`

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details