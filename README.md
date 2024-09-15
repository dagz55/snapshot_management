# Azure Snapshot Manager

Azure Snapshot Manager is a web application that allows users to manage Azure disk snapshots. It provides functionalities to create, delete, validate, and list snapshots based on age.

## Features

- Azure authentication using device code flow
- Create snapshots
- Delete snapshots
- Validate existing snapshots
- List snapshots by age
- Containerized application for easy deployment

## Prerequisites

- Docker
- Azure subscription
- Azure CLI (for local development)

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/azure-snapshot-manager.git
   cd azure-snapshot-manager
   ```

2. Set up environment variables:
   Create a `.env` file in the root directory with the following content:
   ```
   REACT_APP_AZURE_TENANT_ID=your_tenant_id
   REACT_APP_AZURE_CLIENT_ID=your_client_id
   REACT_APP_AZURE_SUBSCRIPTION_ID=your_subscription_id
   ```

3. Build the Docker image:
   ```
   docker build --platform linux/amd64 -t dagz55/snapshot_management:latest .
   ```

4. Run the container:
   ```
   docker run -p 3000:3000 -p 8080:8080 --env-file .env dagz55/snapshot_management:latest
   ```

5. Access the application:
   Open your web browser and navigate to `http://localhost:3000`

## Usage

1. Click the "Login" button to authenticate with Azure.
2. Use the provided device code to complete the authentication process.
3. Once logged in, you can use the various snapshot management features.

## Development

For local development:

1. Install dependencies:
   ```
   cd client
   npm install
   ```

2. Start the React development server:
   ```
   npm start
   ```

3. In another terminal, run the Go backend:
   ```
   go run main.go
   ```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Azure SDK for Go
- React
- Docker