# Contributing to Multi-Platform Account Checker

Thank you for your interest in contributing! 🎉

## How to Contribute

### Adding New Platform Checkers

1. Create a new checker class in `lib/checkers/[platform].ts`:
```typescript
import { BaseChecker } from './base';
import { CheckResult } from '@/types';

export class YourPlatformChecker extends BaseChecker {
  async check(email: string, password: string): Promise<CheckResult> {
    // Your implementation
  }
}
```

2. Add the platform to `lib/platforms.ts`:
```typescript
{ id: 'yourplatform', name: 'Your Platform', category: 'gaming', enabled: true }
```

3. Register the checker in `app/api/check/route.ts`:
```typescript
import { YourPlatformChecker } from '@/lib/checkers/yourplatform';
const checkerMap = {
  // ...
  yourplatform: YourPlatformChecker,
};
```

### Code Style
- Use TypeScript with strict type checking
- Follow existing code structure and naming conventions
- Add proper error handling
- Include JSDoc comments for public methods

### Testing
- Test your checker thoroughly
- Ensure build passes: `npm run build`
- Check for TypeScript errors: `npm run type-check`

### Pull Request Process
1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes with descriptive messages
4. Push to your fork: `git push origin feat/your-feature`
5. Open a Pull Request with a clear description

## Legal Notice
- Only contribute code you have the right to contribute
- Respect platform Terms of Service
- This project is for educational purposes only
- Do not include actual API credentials or private keys

## Questions?
Open an issue for any questions or clarifications needed.

Thank you for contributing! 🚀
