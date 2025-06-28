# 🤝 Contributing to CrampPanchayat

Thank you for your interest in contributing to CrampPanchayat! We welcome contributions from developers, designers, health advocates, and users who want to improve menstrual health tracking for everyone.

## 🌟 Ways to Contribute

### 🐛 Bug Reports

- Use clear, descriptive titles
- Include steps to reproduce the issue
- Provide device/OS information
- Respect user privacy - no personal data in reports

### ✨ Feature Requests

- Check existing issues first
- Explain the problem you're solving
- Consider privacy implications
- Suggest implementation approaches

### 💻 Code Contributions

- Bug fixes and performance improvements
- New features with proper documentation
- UI/UX enhancements
- Accessibility improvements

### 🎨 Design Contributions

- UI/UX improvements
- App icons and graphics
- Cultural sensitivity reviews
- Accessibility audits

### 📚 Documentation

- README improvements
- Code documentation
- User guides
- Translation contributions

### 🗺️ Roadmap Contributions

Want to help build the future of CrampPanchayat? Here are key areas where we need contributors:

- **✅ Smart Notifications**: Help implement period predictions and medication reminders
- **✅ Enhanced Cloud Sync**: Contribute to real-time Supabase synchronization features
- **🔄 Machine Learning**: Assist with cycle prediction algorithms and pattern analysis
- **♿ Accessibility**: Improve screen reader support and high contrast modes
- **🌍 Internationalization**: Add translations and cultural sensitivity improvements
- **🏥 Healthcare Integration**: Work on Apple Health, Google Fit, and FHIR compatibility
- **📱 Widget Development**: Create home screen widgets for quick cycle overview
- **🔐 Security Enhancements**: Implement end-to-end encryption for cloud data

_Check our [Roadmap](README.md#🗺️-roadmap--future-goals) for detailed feature plans and timelines._

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- React Native development environment
- Expo CLI
- Git knowledge

### Development Setup

1. **Fork the repository**

   ```bash
   git clone https://github.com/your-username/cramppanchayat.git
   cd cramppanchayat
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**

   ```bash
   npm start
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 📝 Development Guidelines

### Code Style

#### TypeScript

- Use strict TypeScript configuration
- Define interfaces for all data structures
- Use proper type annotations
- Avoid `any` type

```typescript
// Good
interface PeriodLog {
  id: string;
  date: string;
  flowIntensity: 1 | 2 | 3 | 4 | 5;
  symptoms: SymptomType[];
}

// Avoid
const log: any = { ... };
```

#### React Components

- Use functional components with hooks
- Define proper TypeScript interfaces for props
- Use React.memo for performance optimization
- Handle loading and error states

```typescript
interface ProfileCardProps {
  emoji: EmojiType;
  isSelected: boolean;
  onSelect: (emoji: EmojiType) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = React.memo(
  ({ emoji, isSelected, onSelect }) => {
    // Component implementation
  }
);
```

#### Privacy Guidelines

- Never log personal information
- Use anonymous identifiers
- Implement proper data sanitization
- Follow GDPR principles

```typescript
// Good - Anonymous logging
console.log('Cycle calculated', { cycleLength: 28, anonymous: true });

// Never do this
console.log('User data', { email: 'user@email.com', cycles: [...] });
```

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── ComponentName/
│   │   ├── index.tsx    # Main component
│   │   ├── types.ts     # Component-specific types
│   │   └── styles.ts    # Component styles
├── screens/            # Screen components
├── services/           # API and business logic
├── hooks/              # Custom React hooks
├── types/              # Shared TypeScript types
├── constants/          # App constants
└── utils/              # Utility functions
```

### Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add symptom intensity tracking
fix: resolve calendar date selection bug
docs: update README with installation guide
style: improve profile card UI consistency
refactor: optimize period prediction algorithm
test: add unit tests for cycle calculations
chore: update dependencies
```

### Testing Guidelines

#### Unit Tests

- Test core business logic
- Test utility functions
- Test custom hooks
- Use Jest and React Native Testing Library

```typescript
describe("cycleCalculations", () => {
  it("should predict next period date correctly", () => {
    const logs = [
      /* test data */
    ];
    const prediction = predictNextPeriod(logs);
    expect(prediction).toEqual(expectedDate);
  });
});
```

#### Integration Tests

- Test screen functionality
- Test navigation flows
- Test data persistence
- Test privacy compliance

### Performance Guidelines

#### React Optimization

```typescript
// Use React.memo for components
const ExpensiveComponent = React.memo(({ data }) => {
  return <ComplexUI data={data} />;
});

// Use useMemo for expensive calculations
const cycleStats = useMemo(() => {
  return calculateCycleStatistics(periodLogs);
}, [periodLogs]);

// Use useCallback for event handlers
const handleSymptomSelect = useCallback((symptom: SymptomType) => {
  setSelectedSymptoms((prev) => [...prev, symptom]);
}, []);
```

#### Storage Optimization

- Minimize AsyncStorage operations
- Use data normalization
- Implement proper caching
- Clean up old data

### Privacy & Security

#### Data Handling

- Use anonymous user IDs
- Encrypt sensitive data
- Implement proper data retention
- Provide data export/deletion

#### Supabase RLS Policies

```sql
-- Example RLS policy
CREATE POLICY "Users can only access their own data" ON period_logs
FOR ALL USING (user_id = auth.uid());
```

## 🔄 Pull Request Process

### Before Submitting

1. **Test thoroughly** on multiple devices
2. **Run linter** and fix all issues
3. **Update documentation** if needed
4. **Add tests** for new functionality
5. **Check privacy compliance**

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Documentation update

## Testing

- [ ] Tested on Android
- [ ] Tested on iOS
- [ ] Added unit tests
- [ ] Privacy compliance verified

## Screenshots

[Add screenshots for UI changes]

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No privacy violations
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Privacy review** for data handling
4. **Testing** on multiple platforms
5. **Merge** after approval

## 🌍 Cultural Sensitivity

### Guidelines

- **Inclusive language** in all content
- **Diverse representation** in examples
- **Cultural awareness** in UI design
- **Accessibility** for all users

### Emoji Selection

- Consider cultural meanings
- Ensure diverse representation
- Test with various demographics
- Avoid potentially offensive symbols

## 📞 Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and ideas
- **Email**: security@cramppanchayat.com (for security issues)

### Mentorship

New contributors are welcome! We provide:

- Code review and feedback
- Architecture guidance
- Privacy best practices
- React Native development tips

## 🏆 Recognition

### Contributors

- All contributors are recognized in README
- Significant contributions highlighted in releases
- Open source contributions for portfolio

### Code of Conduct

- Be respectful and inclusive
- Help others learn and grow
- Prioritize user privacy and safety
- Maintain professional communication

## 📄 License

By contributing to CrampPanchayat, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to menstrual health awareness and privacy-first technology! 🩷
