# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Azure authentication using device code flow
- Create snapshot functionality
- Delete snapshot functionality
- Validate snapshot functionality
- List snapshots by age functionality
- Dockerization of the application
- README.md with project information and setup instructions
- This CHANGELOG.md file

### Changed
- Updated LoginButton component to use device code flow
- Modified Dockerfile to build for Linux 64-bit systems

### Fixed
- Resolved issues with Azure authentication in Docker container

## [0.1.0] - 2023-09-14
### Added
- Initial release of Azure Snapshot Manager
- Basic CRUD operations for Azure disk snapshots
- Azure authentication integration
- React frontend with Material-UI components
- Go backend using Gin framework
- Docker support for easy deployment