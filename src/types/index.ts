export type ContributionStatus = 'available' | 'pending' | 'confirmed';

export interface Contribution {
  id: string; // The number chosen (e.g., "1")
  number: number;
  nome_usuario: string; // User's name
  numero_usuario: string; // User's phone/contact
  status: ContributionStatus;
  timestamp?: any;
}

export interface AppConfig {
  maxNumbers: number;
}

export interface Admin {
  email: string;
  nome: string;
}
