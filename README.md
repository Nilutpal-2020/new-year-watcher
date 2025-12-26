### New Year Watcher

current-app/
├── backend/
│   ├── main.py 
│   ├── requirements.txt 
│   └── run.sh 
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapViz.jsx 
│   │   │   └── WishWall.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md


### Setup Instructions

- Frontend (React)
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install leaflet react-leaflet luxon axios clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Running the Application

- Backend

```bash
cd backend
uvicorn main:app --reload
```

- Frontend

```bash
cd frontend
npm run dev
```