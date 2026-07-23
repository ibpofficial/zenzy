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
  brandColor?: string;
  themeStyle?: string;
  logo?: string;
  gstNumber?: string;
  licenseNumber?: string;
  yearsInBusiness?: string;
  teamSize?: string;
  notableClients?: string[];
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountName?: string;
    upiId?: string;
    paymentLink?: string;
  };
  documentVerifications?: {
    aadhar?: string;
    pan?: string;
    gstNumber?: string;
    licenseNumber?: string;
  };
  trustScore?: {
    overall: number;
    label: string;
    factors: {
      identityVerification: { score: number; max: 20; status: "verified" | "pending" | "needs_improvement" };
      professionalDocuments: { score: number; max: 15; status: "verified" | "pending" | "needs_improvement" };
      clientReviews: { score: number; max: 20; status: "verified" | "pending" | "needs_improvement" };
      projectCompletionRate: { score: number; max: 15; status: "verified" | "pending" | "needs_improvement" };
      responseTime: { score: number; max: 10; status: "verified" | "pending" | "needs_improvement" };
      portfolioQuality: { score: number; max: 10; status: "verified" | "pending" | "needs_improvement" };
      profileCompletion: { score: number; max: 10; status: "verified" | "pending" | "needs_improvement" };
    };
    suggestions: { message: string; potentialPoints: number }[];
    updatedAt: string;
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
  projectId?: string;
  businessId?: string;
  workerId?: string;
  businessName?: string;
  workerName?: string;
  workerLogo?: string;
  workerGstin?: string;
  brandColor?: string;
  revisionOf?: string;
  version?: number;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountName?: string;
    upiId?: string;
    paymentLink?: string;
  };
  items: { description: string; qty: number; unitPrice: number; total: number }[];
  materialsCost?: number;
  laborCost?: number;
  terms?: string;
  termsAndConditions?: string;
  status: 'draft' | 'submitted' | 'accepted' | 'declined' | 'Pending' | 'Accepted' | 'Declined' | 'Expired';
  acceptedAt?: string;
  acceptedSignature?: string;
  signatureName?: string;
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
