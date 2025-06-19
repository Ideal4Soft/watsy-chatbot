# Contributing to Watsy-Chatbot Platform

Thank you for your interest in contributing to the Watsy-Chatbot platform! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Development Workflow](#development-workflow)
- [Branch Strategy](#branch-strategy)
- [Commit Standards](#commit-standards)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)
- [Development Setup](#development-setup)
- [Testing Requirements](#testing-requirements)
- [Code Style Guidelines](#code-style-guidelines)

## 🔄 Development Workflow

We follow a **Git Flow** branching strategy to ensure organized development and stable releases.

### Getting Started

1. **Fork the repository** (for external contributors)
2. **Clone your fork** or the main repository
3. **Set up the development environment** (see README.md)
4. **Create a feature branch** from `develop`
5. **Make your changes** following our guidelines
6. **Test thoroughly** before submitting
7. **Submit a pull request** to the `develop` branch

## 🌿 Branch Strategy

### Main Branches

- **`main`** - Production-ready code. Only accepts merges from `release/*` and `hotfix/*` branches
- **`develop`** - Integration branch for new features. Default branch for development

### Supporting Branches

#### Feature Branches
- **Naming**: `feature/description-of-feature`
- **Purpose**: Develop new features
- **Branch from**: `develop`
- **Merge to**: `develop`

**Examples:**
```
feature/user-authentication
feature/whatsapp-integration
feature/visual-flow-builder
feature/analytics-dashboard
```

#### Bugfix Branches
- **Naming**: `bugfix/description-of-fix`
- **Purpose**: Fix bugs in development
- **Branch from**: `develop`
- **Merge to**: `develop`

**Examples:**
```
bugfix/login-validation-error
bugfix/message-sending-timeout
bugfix/dashboard-loading-issue
```

#### Release Branches
- **Naming**: `release/v1.0.0`
- **Purpose**: Prepare for production release
- **Branch from**: `develop`
- **Merge to**: `main` and `develop`

#### Hotfix Branches
- **Naming**: `hotfix/critical-security-fix`
- **Purpose**: Fix critical issues in production
- **Branch from**: `main`
- **Merge to**: `main` and `develop`

## 📝 Commit Standards

We follow the **Conventional Commits** specification for clear and consistent commit messages.

### Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without changing functionality
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks, dependency updates
- **ci**: CI/CD configuration changes
- **build**: Build system or external dependency changes

### Examples

```bash
feat(auth): add JWT refresh token functionality

fix(whatsapp): resolve message sending timeout issue

docs(readme): update Docker setup instructions

style(components): format code according to Prettier rules

refactor(database): optimize user query performance

test(auth): add unit tests for login validation

chore(deps): update Next.js to version 15.3.4
```

## 🔍 Pull Request Process

### Before Submitting

1. **Ensure your branch is up to date** with the target branch
2. **Run all tests** and ensure they pass
3. **Run linting** and fix any issues
4. **Update documentation** if necessary
5. **Test your changes** thoroughly

### Pull Request Requirements

1. **Clear title** following commit message conventions
2. **Detailed description** explaining:
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
   - Any breaking changes
3. **Link related issues** using keywords (fixes #123, closes #456)
4. **Screenshots** for UI changes
5. **Test coverage** for new features

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## 👥 Code Review Guidelines

### For Authors

- **Keep PRs small** and focused on a single concern
- **Provide context** in the description
- **Respond promptly** to review feedback
- **Test thoroughly** before requesting review

### For Reviewers

- **Be constructive** and respectful
- **Focus on code quality**, not personal preferences
- **Check for**:
  - Functionality and logic
  - Performance implications
  - Security considerations
  - Test coverage
  - Documentation completeness

### Review Criteria

- ✅ Code follows project conventions
- ✅ Tests are comprehensive and pass
- ✅ Documentation is updated
- ✅ No security vulnerabilities
- ✅ Performance is acceptable
- ✅ Breaking changes are documented

## 🛠️ Development Setup

See the main [README.md](README.md) for detailed setup instructions.

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Ideal4Soft/watsy-chatbot.git
cd watsy-chatbot

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start development services
npm run docker:up

# Start development server
npm run dev
```

## 🧪 Testing Requirements

### Test Coverage

- **Minimum 80% code coverage** for new features
- **Unit tests** for all business logic
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows

### Running Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Connection tests
npm run test:connections
```

## 🎨 Code Style Guidelines

### TypeScript

- Use **strict TypeScript** configuration
- Define **explicit types** for function parameters and returns
- Use **interfaces** for object shapes
- Prefer **type unions** over enums when appropriate

### React

- Use **functional components** with hooks
- Follow **React best practices** for performance
- Use **proper prop types** and default values
- Implement **error boundaries** for robust UX

### Styling

- Use **Tailwind CSS** utility classes
- Follow **mobile-first** responsive design
- Use **shadcn/ui** components when available
- Maintain **consistent spacing** and typography

### File Organization

- Use **kebab-case** for file names
- Group related files in **feature folders**
- Keep **components small** and focused
- Use **barrel exports** (index.ts files)

## 🚀 Release Process

1. **Create release branch** from `develop`
2. **Update version numbers** and changelog
3. **Final testing** and bug fixes
4. **Merge to main** and tag release
5. **Deploy to production**
6. **Merge back to develop**

## 📞 Getting Help

- **GitHub Issues**: Report bugs or request features
- **Discussions**: Ask questions or share ideas
- **Documentation**: Check README.md and docs/
- **Code Review**: Request feedback on your changes

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Watsy-Chatbot! 🎉
