# Contributing to FinanceFlow

Thank you for your interest in contributing to FinanceFlow! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

### Our Pledge

We as contributors, maintainers, and developers pledge to make participation in our community a harassment-free experience for everyone.

### Our Standards

- **Resful****: We value different opinions and approaches
- **Inclusive**: We welcome contributors from all backgrounds
- **Collaborative**: We work together to solve problems
- **Constructive**: We provide helpful feedback

### Responsibilities

- Be respectful and inclusive
- Use welcoming and inclusive language
- Focus on what is best for the community
- Show empathy towards other community members

## How to Contribute

### Ways to Contribute

1. **Report Bugs**: Found a bug? [Create an issue](../../issues)
2. **Suggest Features**: Have an idea? Let us know!
3. **Submit Pull Requests**: Fix bugs or add features
4. **Improve Documentation**: Help us improve docs
5. **Share Feedback**: Tell us what you think

### What We're Looking For

- Bug fixes
- New features (check [Issues](../../issues) first)
- Performance improvements
- Documentation improvements
- Test coverage
- UI/UX enhancements

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Git

### Fork and Clone

1. Fork the repository
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/Financetrack.git
cd Financetrack
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/Financetrack.git
```

### Install Dependencies

```bash
npm install
```

### Set Up Environment

1. Copy `.env.example` to `.env`
2. Configure your database
3. Run migrations:

```bash
npx prisma migrate dev
```

### Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Coding Standards

### TypeScript

- Use TypeScript for all files
- Avoid `any` types
- Use interfaces for object shapes
- Add proper type annotations

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): User | null {
  // ...
}

// Bad
function getUser(id: any): any {
  // ...
}
```

### React Components

- Use functional components with hooks
- Follow the component naming: PascalCase
- Use TypeScript for props

```typescript
// Good
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// Bad
export const button = (props) => {
  return <button>{props.label}</button>;
};
```

### File Naming

- Components: kebab-case (`summary-card.tsx`)
- Utilities: kebab-case (`format-currency.ts`)
- Types: kebab-case (`transaction.types.ts`)
- Pages: Follow Next.js conventions

### Imports

- Group imports in this order:
  1. React imports
  2. Third-party libraries
  3. Internal components
  4. Utilities
  5. Types

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Transaction } from '@/lib/types';
```

### Styling

- Use Tailwind CSS classes
- Follow mobile-first approach
- Use semantic HTML
- Maintain consistent spacing

```tsx
// Good
<div className="flex items-center justify-between p-4">
  <h2 className="text-xl font-bold">Title</h2>
</div>

// Bad
<div style={{display: 'flex', padding: '16px'}}>
  <h2 style={{fontSize: '20px', fontWeight: 'bold'}}>Title</h2>
</div>
```

### Error Handling

- Always handle errors gracefully
- Show user-friendly error messages
- Log errors for debugging

```typescript
// Good
try {
  const result = await api.call();
  return result;
} catch (error) {
  console.error('API call failed:', error);
  toast({
    title: 'Error',
    description: 'Failed to load data',
    variant: 'destructive'
  });
  return null;
}

// Bad
const result = await api.call();
return result;
```

## Commit Guidelines

### Commit Message Format

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(transactions): add installment tracking

Implement installment tracking for credit card purchases.
Includes progress bars and automatic monthly payment recording.

Closes #123

fix(wallets): correct balance calculation

The balance was not updating when transactions were edited.
This fix ensures balance is recalculated correctly.

docs: update API documentation

Added missing endpoint documentation for credit card payments.
```

### Best Practices

- Use present tense ("add" not "added")
- Use imperative mood ("move" not "moves")
- Limit first line to 50 characters
- Reference issues when applicable

## Pull Request Process

### Before Submitting

1. **Update Documentation**: If adding features, update docs
2. **Add Tests**: Include tests for new functionality
3. **Test Changes**: Manually test your changes
4. **Code Style**: Ensure code follows standards
5. **Commit Messages**: Use proper commit format

### Submitting a PR

1. Create a new branch:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

2. Make your changes and commit:

```bash
git add .
git commit -m "feat: add your feature"
```

3. Push to your fork:

```bash
git push origin feature/your-feature-name
```

4. Create Pull Request:
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill in PR template

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe testing performed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed the code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests
- [ ] All tests pass
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Maintainers review your code
3. **Feedback**: Address review comments
4. **Approval**: Once approved, PR will be merged

### After Merge

- Update your local main branch:

```bash
git checkout main
git pull upstream main
```

- Delete your feature branch:

```bash
git branch -d feature/your-feature-name
```

## Reporting Issues

### Before Creating an Issue

1. **Search existing issues**: Check if it's already reported
2. **Check documentation**: Review docs first
3. **Try latest version**: Ensure you're on the latest version

### Issue Template

```markdown
## Description
Clear description of the issue or feature request

## Steps to Reproduce (for bugs)
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
Add screenshots if applicable

## Environment
- OS: [e.g., Windows, macOS, Linux]
- Browser: [e.g., Chrome, Firefox, Safari]
- Node Version: [e.g., 18.0.0]
- App Version: [e.g., 1.0.0]

## Additional Context
Any other relevant information
```

### Feature Requests

When requesting features:

1. **Use Case**: Describe the problem you're solving
2. **Proposed Solution**: How you envision it working
3. **Alternatives**: Other approaches you considered
4. **Examples**: Links to similar features in other apps

## Recognition

Contributors who make significant contributions will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Recognized in the community

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas
- **Email**: For private matters

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](../LICENSE).

---

Thank you for contributing to FinanceFlow! 🎉

Every contribution, no matter how small, is valuable and appreciated.
