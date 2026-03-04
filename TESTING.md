# CapSyncer Test Suite

Comprehensive testing strategy for the CapSyncer application covering unit, integration, and end-to-end tests.

## Package Management

This project uses **separate package management** for each concern:

- **`frontend/`** - Next.js application with Jest for component tests
- **`e2e/`** - Playwright for end-to-end tests (separate project)
- **`backend.tests/`** - .NET/xUnit tests (no Node.js packages)

This separation ensures:
✅ Clean dependencies (frontend doesn't need Playwright)  
✅ Independent versioning (can update test frameworks separately)  
✅ Smaller install size (production builds exclude test dependencies)  
✅ Better isolation (e2e tests can run independently)

## Test Coverage

### Backend Tests (.NET/C#)

#### **Unit Tests** (`backend.tests/Unit/`)

- **Purpose**: Test individual model classes and business logic in isolation
- **Framework**: xUnit
- **Coverage**:
  - `CoworkerTests.cs` - Coworker model validation and relationships
  - `ProjectTests.cs` - Project model, status management, date handling
  - `TaskTests.cs` - Task model, priority/status validation
  - `AssignmentTests.cs` - Assignment model, week tracking, calculations

#### **Integration Tests** (`backend.tests/Integration/`)

- **Purpose**: Test API endpoints with full request/response cycle
- **Framework**: xUnit + WebApplicationFactory
- **Database**: In-Memory EF Core
- **Coverage**:
  - `CoworkersIntegrationTests.cs` - CRUD operations for coworkers
  - `ProjectsIntegrationTests.cs` - Project management with cascade deletes
  - `TasksIntegrationTests.cs` - Task operations with assignments
  - `AssignmentsIntegrationTests.cs` - Assignment creation and capacity tracking
  - `CapacityIntegrationTests.cs` - Weekly capacity calculations, utilization

### Frontend Tests (React/Next.js)

#### **Component Tests** (`frontend/__tests__/`)

- **Purpose**: Test UI components in isolation
- **Framework**: Jest + React Testing Library
- **Coverage**:
  - `Button.test.tsx` - Button variants, states, click handlers
  - `Modal.test.tsx` - Modal visibility, close handlers, backdrop clicks
  - `Table.test.tsx` - Data rendering, sorting, empty states
  - `Navbar.test.tsx` - Navigation structure
  - `Footer.test.tsx` - Footer content
  - `FormInputs.test.tsx` - Text, number, select, textarea, date inputs
  - `ProgressBar.test.tsx` - Percentage display, color thresholds
  - `WeekSelector.test.tsx` - Week navigation, year transitions
  - `Toast.test.tsx` - Toast notifications, auto-dismiss
  - `RoleSwitcher.test.tsx` - Role switching, localStorage persistence

#### **Context Tests** (`frontend/__tests__/`)

- **Purpose**: Test React Context providers and hooks
- **Coverage**:
  - `PermissionContext.test.tsx` - User role/name management, localStorage sync

### E2E Tests (Playwright)

#### **End-to-End Workflows** (`e2e/tests/`)

- **Purpose**: Test complete user workflows across frontend and backend
- **Framework**: Playwright
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Coverage**:
  - `coworkers.spec.ts` - Coworker CRUD, search, detail views
  - `dashboard.spec.ts` - Dashboard views, capacity visualization, week navigation
  - `workflow.spec.ts` - Complete project→task→assignment workflow

## Running Tests

### Backend Tests

```bash
# Run all backend tests
cd backend.tests
dotnet test

# Run with verbose output
dotnet test -v detailed

# Run with coverage
dotnet test /p:CollectCoverage=true

# Run only unit tests
dotnet test --filter "FullyQualifiedName~Unit"

# Run only integration tests
dotnet test --filter "FullyQualifiedName~Integration"

# Run specific test class
dotnet test --filter "FullyQualifiedName~CoworkersIntegrationTests"
```

### Frontend Tests

```bash
# Run all frontend tests
cd frontend
npm test

# Run in watch mode (development)
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test Button.test.tsx

# Update snapshots
npm test -- -u
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
cd e2e
npm install
npx playwright install

# Run E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run headed (see browser)
npm run test:e2e:headed

# Run and debug
npm run test:e2e:debug

# View last test report
npm run test:e2e:report

# Run specific test file
npx playwright test coworkers.spec.ts

# Run on specific browser
npx playwright test --project=chromium
```

## Test Scripts

### All Tests Runner

Run all tests at once (except E2E which requires app running):

**Windows:**

```powershell
.\run-all-tests.ps1
```

**Linux/Mac:**

```bash
./run-all-tests.sh
```

This script runs:

1. Backend unit tests
2. Backend integration tests
3. Frontend component tests
4. _(E2E tests optional - requires app running)_

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-dotnet@v3
        with:
          dotnet-version: "10.0.x"
      - name: Run Backend Tests
        run: cd backend.tests && dotnet test

      - name: Generate Coverage Report
        run: dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Install Dependencies
        run: cd frontend && npm ci
      - name: Run Frontend Tests
        run: cd frontend && npm test -- --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - name: Start Database
        run: docker-compose up -d
      - name: Install E2E Dependencies
        run: cd e2e && npm ci && npx playwright install
      - name: Run E2E Tests
        run: cd e2e && npm run test:e2e
      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: e2e/playwright-report/
```

## Test Data Management

### Backend

- Uses **in-memory database** (`UseInMemoryDatabase`) for each test
- Fresh database instance per test class
- No test pollution between runs
- Each test class gets unique database name

### Frontend

- **localStorage** cleared before each test
- Mock API responses where needed
- Isolated test environment via `@testing-library/react`

### E2E

- Tests run against **real backend API**
- **Option 1**: Use test database that resets between runs
- **Option 2**: Mock API responses for predictable tests
- Current setup: Uses real backend with Docker database

## Code Coverage Goals

- **Backend**: 80%+ line coverage
- **Frontend Components**: 90%+ coverage
- **Critical Paths**: 100% coverage (capacity calculations, assignments)

Run coverage reports:

```bash
# Backend
cd backend.tests && dotnet test /p:CollectCoverage=true

# Frontend
cd frontend && npm run test:coverage
```

## Best Practices

### Unit Tests

✅ Test one thing at a time  
✅ Use descriptive test names: `Method_Scenario_ExpectedBehavior`  
✅ Follow Arrange-Act-Assert pattern  
✅ Use `[Theory]` for parameterized tests with multiple inputs  
✅ Test edge cases (null, empty, boundary values)

Example:

```csharp
[Theory]
[InlineData(0)]
[InlineData(10)]
[InlineData(40)]
public void Coworker_ShouldAccept_ValidCapacityValues(int capacity)
{
    // Arrange & Act
    var coworker = new Coworker { Name = "Test", Capacity = capacity };

    // Assert
    Assert.Equal(capacity, coworker.Capacity);
}
```

### Integration Tests

✅ Test full API request/response cycle  
✅ Verify HTTP status codes (200, 201, 404, 400)  
✅ Test error scenarios and validation  
✅ Verify database state changes  
✅ Test relationships and cascade deletes

Example:

```csharp
[Fact]
public async Task POST_Coworker_ReturnsCreatedCoworker()
{
    // Arrange
    var coworker = new { Name = "John", Capacity = 40, IsActive = true };

    // Act
    var response = await _client.PostAsJsonAsync("/api/coworkers", coworker);

    // Assert
    Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    var result = await response.Content.ReadFromJsonAsync<Coworker>();
    Assert.NotNull(result);
    Assert.Equal("John", result.Name);
}
```

### Component Tests

✅ Test component behavior, not implementation  
✅ Use user events (click, type) not direct state manipulation  
✅ Test accessibility (roles, labels, ARIA)  
✅ Test error states and loading states  
✅ Use semantic queries (getByRole, getByLabelText)

Example:

```typescript
it('should handle button click', async () => {
  const handleClick = jest.fn()
  const user = userEvent.setup()

  render(<Button onClick={handleClick}>Click Me</Button>)

  await user.click(screen.getByRole('button', { name: /click me/i }))

  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

### E2E Tests

✅ Test real user workflows (create → edit → delete)  
✅ Avoid testing implementation details  
✅ Use data-testid for reliable selectors  
✅ Test happy paths AND error scenarios  
✅ Verify end-to-end data flow

Example:

```typescript
test("should create and assign task", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Projects");
  await page.click('button:has-text("New Project")');
  await page.fill('[name="name"]', "Test Project");
  await page.click('button:has-text("Save")');

  await expect(page.locator("text=Test Project")).toBeVisible();
});
```

## Debugging Tests

### Backend

```bash
# Run single test with verbose output
dotnet test --filter "FullyQualifiedName~TestName" -v detailed

# Debug in VS Code (set breakpoint, F5)
# Or attach to test process
```

### Frontend

```bash
# Debug specific test
npm test -- --testNamePattern="Button should"

# Run with node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Use console.log()
# Or add debugger; statement in test
```

### E2E

```bash
# Debug with Playwright Inspector (step through)
npx playwright test --debug

# Record trace for failed tests
npx playwright test --trace on

# Screenshots on failure (auto-configured)
# Check playwright-report/ folder
```

## Continuous Improvement

- ✅ Review test failures immediately
- ✅ Update tests when features change
- ✅ Add tests for every bug fix
- ✅ Refactor tests like production code
- ✅ Monitor test execution time
- ✅ Remove flaky tests or fix them
- ✅ Keep tests independent and isolated

## Test Statistics

Current test suite includes:

- **Backend Unit Tests**: ~40 tests across 4 model classes
- **Backend Integration Tests**: ~60 tests across 5 API surfaces
- **Frontend Component Tests**: ~80 tests across 11 components
- **E2E Workflow Tests**: ~25 tests across 3 user journeys
- **Total**: 200+ tests

## Resources

- [xUnit Documentation](https://xunit.net/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [WebApplicationFactory Pattern](https://docs.microsoft.com/en-us/aspnet/core/test/integration-tests)
