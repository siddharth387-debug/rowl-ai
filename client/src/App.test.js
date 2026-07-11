import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the app without crashing and shows the hero heading', () => {
  render(<App />);
  const heading = screen.getByText(/You Are Not/i);
  expect(heading).toBeInTheDocument();
});

test('renders the Rowl AI brand name at least once on the page', () => {
  render(<App />);
  const brandMentions = screen.getAllByText(/Rowl/i);
  expect(brandMentions.length).toBeGreaterThan(0);
});