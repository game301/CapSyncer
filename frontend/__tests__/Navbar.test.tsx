import { render, screen } from '@testing-library/react'
import { Navbar } from '../components/Navbar'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('Navbar Component', () => {
  it('renders logo text', () => {
    render(<Navbar />)
    expect(screen.getByText('CS')).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Navbar />)
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toBeInTheDocument()
    expect(dashboardLink).toHaveAttribute('href', '/dashboard')
  })

  it('renders Get Started button', () => {
    render(<Navbar />)
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('has correct styling classes', () => {
    const { container } = render(<Navbar />)
    const nav = container.querySelector('nav')
    
    expect(nav).toHaveClass('sticky', 'top-0', 'z-50')
  })

  it('contains logo that links to home', () => {
    render(<Navbar />)
    
    const logoLink = screen.getByText('CS').closest('a')
    expect(logoLink).toHaveAttribute('href', '/')
  })
})
