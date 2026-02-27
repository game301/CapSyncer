import { render, screen } from '@testing-library/react'
import { Button } from '../components/Button'
import userEvent from '@testing-library/user-event'

describe('Button Component', () => {
  it('renders button with children', () => {
    render(<Button>Click Me</Button>)
    expect(screen.getByText('Click Me')).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click Me</Button>)
    await user.click(screen.getByText('Click Me'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders primary variant by default', () => {
    render(<Button>Primary</Button>)
    const button = screen.getByText('Primary')
    expect(button).toHaveClass('bg-blue-600')
  })

  it('renders secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByText('Secondary')
    expect(button).toHaveClass('bg-slate-700')
  })

  it('renders danger variant', () => {
    render(<Button variant="danger">Danger</Button>)
    const button = screen.getByText('Danger')
    expect(button).toHaveClass('bg-red-600')
  })

  it('renders success variant', () => {
    render(<Button variant="success">Success</Button>)
    const button = screen.getByText('Success')
    expect(button).toHaveClass('bg-green-600')
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByText('Disabled')
    expect(button).toBeDisabled()
  })

  it('respects different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>)
    expect(screen.getByText('Small')).toHaveClass('px-3', 'py-1.5', 'text-sm')

    rerender(<Button size="md">Medium</Button>)
    expect(screen.getByText('Medium')).toHaveClass('px-4', 'py-2', 'text-sm')

    rerender(<Button size="lg">Large</Button>)
    expect(screen.getByText('Large')).toHaveClass('px-6', 'py-3', 'text-base')
  })
})
