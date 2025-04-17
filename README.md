
# Website Installation Guide

## Prerequisites
- Python 3.7+
- Node.js (LTS version recommended)
- MySQL Server
- pip (Python package manager)
- npm (Node.js package manager)

## Backend Setup

1. Install required Python packages:
   ```bash
   pip install fastapi[all] mysql-connector-python passlib python-jose[cryptography] python-multipart
   ```
2.  Start the backend server:
    
    ```bash
    cd website-backend
    python -m uvicorn main:app --reload --port 8001
    ```
## Frontend Setup

1.  Install dependencies:
    
    ```bash
    cd ../website-frontend
    npm install
    ```
2.  Start the frontend development server:
	```bash
	npm run dev
	```
## Database Setup

1.  Create MySQL database using the provided SQL file
    
2.  Use these credentials:
```
    Username: root
    Password: amsterdam
 ```
