export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company: string;
  role: 'Logistics Compliance Officer' | 'Customs Broker' | 'Supply Chain Director' | 'Auditor';
  avatarInitials: string;
  joinedAt: string;
}

export interface RegionAnnotation {
  id: string;
  label: string;
  note?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  color?: string;
  createdAt: number;
}
