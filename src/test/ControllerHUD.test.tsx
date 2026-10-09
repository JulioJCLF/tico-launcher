import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ControllerHUD } from '../components/ControllerHUD';

describe('ControllerHUD', () => {
  it('renders PlayStation prompts on main screen', () => {
    render(<ControllerHUD controllerType="playstation" inModal={false} />);

    expect(screen.getByText('Jogar')).toBeInTheDocument();
    expect(screen.getByText('Detalhes')).toBeInTheDocument();
    expect(screen.getByText('Favorito')).toBeInTheDocument();
    expect(screen.getByText('Alternar Sistema')).toBeInTheDocument();
    expect(screen.getByText('Config / BIOS')).toBeInTheDocument();

    // Verify vector badges are rendered
    expect(screen.getByTestId('ps-badge-cross')).toBeInTheDocument();
    expect(screen.getByTestId('ps-badge-square')).toBeInTheDocument();
    expect(screen.getByTestId('ps-badge-triangle')).toBeInTheDocument();
  });

  it('renders modal prompts when inModal is true', () => {
    render(<ControllerHUD controllerType="playstation" inModal={true} />);

    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('Fechar')).toBeInTheDocument();
    expect(screen.getByTestId('ps-badge-cross')).toBeInTheDocument();
    expect(screen.getByTestId('ps-badge-circle')).toBeInTheDocument();
  });

  it('renders Xbox prompts when controllerType is xbox', () => {
    render(<ControllerHUD controllerType="xbox" inModal={false} />);

    expect(screen.getByTestId('xbox-badge-cross')).toBeInTheDocument();
    expect(screen.getByTestId('xbox-badge-square')).toBeInTheDocument();
    expect(screen.getByTestId('xbox-badge-triangle')).toBeInTheDocument();
  });
});
