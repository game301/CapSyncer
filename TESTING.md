# Test Infrastructure

This document describes the test setup for CapSyncer.

## Backend Tests (.NET/xUnit)

### Location
`backend.tests/`

### Framework
- **xUnit** - .NET testing framework
- **Microsoft.EntityFrameworkCore.InMemory** - In-memory database for testing
- **Microsoft.AspNetCore.Mvc.Testing** - Integration testing support

### Running Backend Tests
```bash
cd backend.tests
dotnet test
```

Or with detailed output:
```bash
dotnet test --logger "console;verbosity=detailed"
```

### Test Coverage
- `CoworkersApiTests.cs` - Tests for Coworker entity CRUD operations
- `ProjectsApiTests.cs` - Tests for Project entity operations
- `TasksApiTests.cs` - Tests for Task entity with priority/status validation
- `AssignmentsApiTests.cs` - Tests for Assignment entity and relationships

### Test Statistics
- **Total Tests**: 27
- **Test Categories**:
  - Entity Creation Tests
  - Read/Query Tests
  - Update Tests
  - Delete Tests
  - Validation Tests
  - Relationship Tests

## Frontend Tests (Jest + React Testing Library)

### Location
`frontend/__tests__/`

### Framework
- **Jest** - JavaScript testing framework
- **React Testing Library** - React component testing
- **@testing-library/user-event** - User interaction simulation

### Running Frontend Tests
```bash
cd frontend
npm test
```

Watch mode:
```bash
npm run test:watch
```

Coverage report:
```bash
npm run test:coverage
```

### Test Coverage
- `Button.test.tsx` - Button component with variants and sizes
- `Table.test.tsx` - Table component with data rendering and interactions
- `Modal.test.tsx` - Modal dialog functionality
- `Navbar.test.tsx` - Navigation bar rendering
- `Footer.test.tsx` - Footer component sections

### Test Types

#### Unit Tests
- Component rendering
- Props handling
- Event handlers
- Style classes

#### Integration Tests
- User interactions
- Click events
- Form submissions
- Navigation

## Test Best Practices

### Backend
1. **Use In-Memory Database**: Each test class uses a unique database instance
2. **Cleanup**: Tests implement `IDisposable` for proper cleanup
3. **Arrange-Act-Assert**: Follow AAA pattern consistently
4. **Theory Tests**: Use `[Theory]` for testing multiple scenarios

### Frontend
1. **User-Centric**: Test from user perspective
2. **Accessibility**: Use accessible queries (getByRole, getByLabelText)
3. **No Implementation Details**: Avoid testing internal state
4. **Setup/Teardown**: Clean up after tests

## Continuous Integration

### GitHub Actions (Future)
```yaml
# Recommended CI/CD setup
- name: Run Backend Tests
  run: dotnet test backend.tests/CapSyncer.Server.Tests.csproj

- name: Run Frontend Tests
  run: |
    cd frontend
    npm test -- --coverage
```

## Coverage Goals
- **Backend**: Aim for 80%+ code coverage
- **Frontend**: Aim for 70%+ component coverage

## Adding New Tests

### Backend
1. Create test class in `backend.tests/`
2. Inherit from `IDisposable`
3. Setup in-memory database in constructor
4. Write tests using `[Fact]` or `[Theory]`
5. Clean up in `Dispose()`

### Frontend
1. Create test file in `frontend/__tests__/`
2. Import component and testing utils
3. Use `describe` blocks for organization
4. Test user interactions with `userEvent`
5. Assert on visible behavior

## Running All Tests
```bash
# Backend
cd backend.tests && dotnet test

# Frontend
cd frontend && npm test
```

## Test Reports
Test results are displayed in console with pass/fail status for each test.
