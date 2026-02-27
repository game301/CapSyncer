import { render, screen } from '@testing-library/react'
import { Footer } from '../components/Footer'

describe('Footer Component', () => {
  it('renders footer sections', () => {
    render(<Footer />)
    
    expect(screen.getByText('CapSyncer')).toBeInTheDocument()
    expect(screen.getByText('Features')).toBeInTheDocument()
    expect(screen.getByText('About')).toBeInTheDocument()
  })

  it('renders feature list', () => {
    render(<Footer />)
    
    expect(screen.getByText('Team capacity tracking')).toBeInTheDocument()
    expect(screen.getByText('Project management')).toBeInTheDocument()
    expect(screen.getByText('Task assignment')).toBeInTheDocument()
    expect(screen.getByText('Real-time analytics')).toBeInTheDocument()
  })

  it('renders company info', () => {
    render(<Footer />)
    
    expect(screen.getByText(/Modern capacity management for teams/i)).toBeInTheDocument()
  })

  it('renders copyright information', () => {
    render(<Footer />)
    
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(new RegExp(`${currentYear}`))).toBeInTheDocument()
  })

  it('has correct background styling', () => {
    const { container } = render(<Footer />)
    const footer = container.querySelector('footer')
    
    expect(footer).toHaveClass('border-t', 'border-slate-700', 'bg-slate-800/50')
  })
})
