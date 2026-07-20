export interface BusinessProfile {
  uid: string;
  slug: string; // company URL slug
  name: string;
  ownerName?: string;
  companyName: string;
  category: string; // construction, interior, architect, etc.
  subcategory?: string;
  description: string;
  bio: string;
  avatar: string;
  coverImage: string;
  pricingRate: string;
  experience: string;
  verifiedBadges: {
    identity: boolean;
    businessReg: boolean;
    gst: boolean;
    officeAddress: boolean;
  };
  portfolio: string[];
  team: { name: string; role: string; avatar: string }[];
  awards: string[];
  workingHours?: Record<string, { active: boolean; start: string; end: string }>;
  serviceRadius?: string; // in km
  emergencyService?: boolean;
  priceStartingFrom?: string;
  blockedDates?: string[]; // e.g. ["2026-07-20"]
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
  };
  documentVerifications?: {
    aadhar?: string;
    pan?: string;
    gstNumber?: string;
    licenseNumber?: string;
  };
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  businessId: string;
  title: string;
  description: string;
  category: string;
  status: 'brief' | 'quoting' | 'active' | 'completed' | 'cancelled';
  budgetRange: string;
  timelineEstimate: string;
  startDate?: string;
  timelineFidelity?: number; // percentage variance
  budgetFidelity?: number; // percentage variance
  createdAt: string;
}

export interface Quotation {
  id: string;
  projectId: string;
  businessId: string;
  businessName: string;
  items: { description: string; qty: number; unitPrice: number; total: number }[];
  materialsCost: number;
  laborCost: number;
  terms: string;
  status: 'draft' | 'submitted' | 'accepted' | 'declined';
  createdAt: string;
}

export interface WorkspaceMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  text: string;
  fileUrl?: string;
  createdAt: string;
}
