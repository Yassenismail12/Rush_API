# Rush API

Rush API is a production-ready Digital Wallet & Banking API built with Django and Django Rest Framework (DRF). It provides secure user authentication, wallet management, and transaction capabilities.

## Features

- **User Authentication**: Secure registration and login using JWT (JSON Web Tokens).
- **Wallet Management**: Automatic wallet creation for users, balance tracking, and currency support.
- **Transactions**:
    - **Deposit**: Add funds to your wallet.
    - **Transfer**: Securely transfer funds to other users with concurrency control.
    - **History**: View transaction history with pagination and filtering.
- **API Documentation**: Interactive Swagger UI and Redoc documentation.
- **Security**: Environment variable configuration and secure password handling.

## Prerequisites

- Python 3.8+
- PostgreSQL (recommended) or SQLite (default for dev)

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd Rush-API
    ```

2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv .venv
    # Windows
    .venv\Scripts\activate
    # Linux/macOS
    source .venv/bin/activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

1.  **Environment Variables:**
    Copy the example environment file to create your local configuration:
    ```bash
    cp .env.example .env
    ```

2.  **Update `.env`:**
    Open `.env` and configure your database credentials and secret key.
    ```ini
    SECRET_KEY=your-secure-secret-key
    DEBUG=True
    DB_NAME=Rush
    DB_USER=postgres
    DB_PASSWORD=your_password
    DB_HOST=localhost
    DB_PORT=5432
    ```

3.  **Apply Migrations:**
    ```bash
    python manage.py migrate
    ```

## Running the Application

Start the development server:
```bash
python manage.py runserver
```

The API will be available at `http://127.0.0.1:8000/`.

## API Documentation

Interactive API documentation is available at:

- **Swagger UI**: [http://127.0.0.1:8000/api/schema/swagger-ui/](http://127.0.0.1:8000/api/schema/swagger-ui/)
- **Redoc**: [http://127.0.0.1:8000/api/schema/redoc/](http://127.0.0.1:8000/api/schema/redoc/)

## Testing

Run the automated test suite:
```bash
python manage.py test wallet
```
