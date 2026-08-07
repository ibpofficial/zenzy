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
  responseTimeHours?: number;
  quotationAcceptanceRate?: number;
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

export interface WorkflowStage {
  id: string;
  name: string;
  expectedDurationDays?: number;
  dependsOn?: string[]; // ids of other WorkflowStage entries that must complete first
  paymentLinked?: boolean;
  paymentAmount?: number;
  approvalNeeded?: boolean;
  documentsRequired?: string[]; // ProjectDocument types required before this stage can complete
  mediaRequired?: boolean;
  gpsRequired?: boolean;
  inspectionRequired?: boolean;
  mandatory?: boolean;
  order: number;
  instructions?: string[];
  objectives?: string[];
  deliverables?: string[];
  assignedTeamRoles?: string[];
}

export interface WorkflowTemplate {
  id: string;
  businessId: string; // owned by the professional/business who created it, reusable across their projects
  name: string; // e.g. "House Construction", "AC Installation"
  category?: string;
  stages: WorkflowStage[];
  createdAt: string;
}

export interface Agreement {
  id: string;
  projectId?: string;
  quotationId: string;
  inquiryId?: string;
  businessId: string;
  businessName: string;
  clientId: string;
  clientName: string;
  scopeSummary: string;
  totalCost: number;
  advanceAmount: number;
  paymentScheduleSummary: string;
  timelineEstimate: string;
  warrantyTerms?: string;
  cancellationPolicy?: string;
  responsibilities?: string;
  clientSignatureName?: string;
  clientSignatureDataUrl?: string;
  clientSignedAt?: string;
  proSignatureName?: string;
  proSignatureDataUrl?: string;
  proSignedAt?: string;
  documentId?: string;
  status: 'draft' | 'pending_signature' | 'signed' | 'cancelled';
  createdAt: string;
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
  expectedCompletionDate?: string;
  timelineFidelity?: number; // percentage variance
  budgetFidelity?: number; // percentage variance
  createdAt: string;
  inquiryId?: string; // Link back to Inquiry
  progressPercent?: number;
  currentStage?: string;
  nextMilestone?: string;
  nextMilestoneDueDate?: string;
  estimatedCost?: number;
  finalCost?: number;
  completedAt?: string;
  warrantyId?: string;
  businessName?: string;
  projectTrustScore?: number;
  escrowTotal?: number;
  escrowFunded?: number;
  escrowReleased?: number;
  totalPaid?: number;
  agreedPrice?: number;
  retentionAmount?: number;
  extraRequestsAmount?: number;
  workflowTemplateId?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  pendingApprovalsCount?: number;
  pendingPaymentsAmount?: number;
  proposedStartDate?: string;
  proposedCompletionDate?: string;
  proposedTimelineEstimate?: string;
  dateStatus?: 'accepted' | 'pending_customer_approval' | 'rejected';
  dateProposedBy?: string;
  dateProposedByName?: string;
}

export interface ProjectEvent {
  id: string;
  projectId: string;
  type:
    | 'quote_accepted'
    | 'agreement_signed'
    | 'payment_deposited'
    | 'blueprint_uploaded'
    | 'milestone_started'
    | 'milestone_completion_requested'
    | 'milestone_approved'
    | 'milestone_rejected'
    | 'payment_requested'
    | 'payment_released'
    | 'daily_log_submitted'
    | 'document_uploaded'
    | 'warranty_issued'
    | 'message_sent'
    | string;
  title: string;
  description?: string;
  actorId: string;
  actorName: string;
  actorRole: 'client' | 'professional' | 'system';
  relatedId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  businessId: string;
  professionalId: string;
  clientId: string;
  clientName: string;
  title: string;
  requirements: string;
  budgetRange: string;
  timelineEstimate: string;
  documents: string[];
  communicationSummary?: string;
  stage: 'received' | 'viewed' | 'discussion' | 'quotation_sent' | 'negotiation' | 'accepted' | 'project_started' | 'completed' | 'closed';
  stageHistory: {
    stage: 'received' | 'viewed' | 'discussion' | 'quotation_sent' | 'negotiation' | 'accepted' | 'project_started' | 'completed' | 'closed';
    timestamp: string;
    note?: string;
    updatedBy: string;
  }[];
  quotationIds: string[];
  createdAt: string;
  updatedAt: string;
  overdue?: boolean;
  clientStarted?: boolean;
  proStarted?: boolean;
  quotedAmount?: number;
  clientEmail?: string;
}

export interface QuoteItemRow {
  id?: string;
  phase?: string;
  name?: string;
  description?: string;
  qty?: number;
  unit?: string;
  rate?: number;
  gst?: number;
  hsn?: string;
  discount?: number;
  discountType?: "flat" | "percent";
  optional?: boolean;
}

export interface QuoteSectionBlock {
  id: string;
  title: string;
  type: "text" | "grid" | "table";
  content: any;
}

export interface QuoteDiscussionMessage {
  id: string;
  quoteId: string;
  senderId: string;
  senderName: string;
  senderRole: 'client' | 'professional';
  message: string;
  type: 'question' | 'change_request' | 'reply' | 'approval';
  createdAt: string;
  status?: 'open' | 'resolved' | 'revised';
}

export interface QuotationAttachment {
  name: string;
  url: string;
  type: string;
  size?: string;
}

export interface QuotePaymentPlanStep {
  stageName: string;
  percentage: number;
  amount: number;
  description?: string;
}

export interface Quotation {
  id: string;
  projectId?: string;
  inquiryId?: string; // Link back to Inquiry
  enquiryId?: string;
  businessId?: string;
  workerId?: string;
  businessName?: string;
  workerName?: string;
  workerPhone?: string;
  workerAddress?: string;
  workerState?: string;
  workerLogo?: string;
  workerGstin?: string;
  licenseNo?: string;
  brandColor?: string;
  quoteDocumentTitle?: string;
  quoteNumber?: string;
  revisionOf?: string;
  version?: number;
  supersededBy?: string;
  customerName?: string;
  customerCompany?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  customerState?: string;
  projectTitle?: string;
  projectDescription?: string;
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountName?: string;
    upiId?: string;
    paymentLink?: string;
  };
  sections?: QuoteSectionBlock[];
  items?: QuoteItemRow[];
  materialsCost?: number;
  laborCost?: number;
  taxInclusive?: boolean;
  discount?: number;
  discountType?: "flat" | "percent";
  subtotal?: number;
  taxAmount?: number;
  grandTotal?: number;
  total?: number;
  paymentTerms?: string;
  terms?: string;
  termsAndConditions?: string;
  status: 'draft' | 'submitted' | 'accepted' | 'declined' | 'Pending' | 'Accepted' | 'Declined' | 'Expired';
  expiryDate?: string;
  acceptedAt?: string;
  acceptedSignature?: string;
  signatureName?: string;
  signatureDataUrl?: string;
  acceptedEmail?: string;
  acceptedNotes?: string;
  snapshotHash?: string;
  clientSelectedOptionIds?: string[];
  viewCount?: number;
  firstViewedAt?: string;
  lastViewedAt?: string;
  createdAt: string;
  customerId?: string;
  sharedWithEmail?: string;
  sharedAt?: string;

  // Embedded Workflow & Rich Terms
  workflowTemplateId?: string;
  workflowStages?: WorkflowStage[];
  cancellationPolicy?: string;
  materialResponsibility?: string;
  riskNotes?: string;
  scopeOfWork?: string[];
  includedItems?: string[];
  excludedItems?: string[];
  deliverables?: string[];
  paymentPlan?: QuotePaymentPlanStep[];
  attachments?: QuotationAttachment[];
  discussions?: QuoteDiscussionMessage[];
  validityDays?: number;
  workingDays?: number;
  expectedCompletionDate?: string;
  warrantyTerms?: string;
  optionalAddOns?: { id: string; name: string; description?: string; cost: number; selected?: boolean }[];
  versionHistory?: { version: number; createdAt: string; grandTotal: number; changedBy: string; notes?: string; quoteId?: string }[];
}

export interface Invoice {
  id: string;
  quoteId: string;
  quoteNumber?: string;
  invoiceNumber: string;
  workerId: string;
  workerName: string;
  workerPhone?: string;
  workerAddress?: string;
  workerGstin?: string;
  brandColor?: string;
  customerName: string;
  customerCompany?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  projectTitle: string;
  sections: QuoteSectionBlock[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  grandTotal: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export interface WorkspaceMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  text: string;
  fileUrl?: string;
  voiceNoteUrl?: string;
  location?: { lat: number; lng: number; label: string };
  pinned?: boolean;
  isMeetingNote?: boolean;
  milestoneId?: string;
  createdAt: string;
}

export interface ProjectTaskItem {
  id: string;
  title: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  cost?: number;
  deadline?: string;
  progressPercent: number;
  order: number;
  photoIds?: string[];
  documentIds?: string[];
  completionRequestedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  proApproved?: boolean;
  clientApproved?: boolean;
  proApprovedAt?: string;
  clientApprovedAt?: string;
  responsibleProfessionalId?: string;
  inspectionId?: string;
  risk?: 'low' | 'medium' | 'high';
  issues?: string;
  actualCompletionDate?: string;

  // Custom Tasks Checklist
  tasks?: ProjectTaskItem[];

  // Dynamic Workflow Linkage & Requirements Checklist
  workflowStageId?: string;
  dependsOnMilestoneIds?: string[];
  paymentLinked?: boolean;
  paymentAmount?: number;
  documentsRequired?: string[];
  mediaRequired?: boolean;
  gpsRequired?: boolean;
  inspectionRequired?: boolean;
  mandatory?: boolean;

  // Stage Intelligence Extensions
  // Stage Checklist Items (Strictly required for stage completion)
  stageChecklist?: { id: string; title: string; completed: boolean; completedAt?: string; completedBy?: string }[];
  instructions?: string[];
  objectives?: string[];
  deliverables?: string[];
  assignedTeamRoles?: string[];
  health?: 'healthy' | 'attention_required' | 'locked';
  healthReason?: string;
  issuesTracked?: {
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    reportedBy: string;
    status: 'open' | 'resolved';
    createdAt: string;
  }[];
  structuredNotes?: {
    id: string;
    note: string;
    authorName: string;
    authorRole: string;
    createdAt: string;
  }[];
}

export interface DailyLog {
  id: string;
  projectId: string;
  date: string;
  workersPresent: number;
  hoursWorked: number;
  workSummary: string[];
  workCompletedList?: string[];
  issues?: string;
  tomorrowPlan?: string;
  completionPercentToday?: number;
  overallCompletionPercent?: number;
  expensesAmount?: number;
  customerRemarks?: string;
  proRemarks?: string;
  aiSummary?: string;
  photoUrls?: string[];
  submittedBy: string;
  createdAt: string;
  beforePhotoIds?: string[];
  afterPhotoIds?: string[];
  materialsUsed?: { itemName: string; quantity: number; unit?: string }[];
  weather?: string;
  supervisorNotes?: string;
  videoIds?: string[];
  milestoneId?: string;
}

export interface ProjectMedia {
  id: string;
  projectId: string;
  milestoneId?: string;
  milestoneTitle?: string;
  spaceName?: string; // e.g. "Bedroom", "Kitchen", "Living Room"
  stageTag?: 'before' | 'during' | 'after';
  type: 'image' | 'video';
  url: string;
  caption?: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  capturedAt?: string;
  location?: { lat: number; lng: number; label?: string };
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  milestoneId?: string;
  type: 'quotation' | 'invoice' | 'agreement' | 'gst_bill' | 'blueprint' | 'approval' | 'warranty_card' | 'receipt' | 'completion_certificate' | 'other';
  name: string;
  fileUrl: string;
  uploadedBy: string;
  createdAt: string;
  version?: number;
  status?: 'pending' | 'verified' | 'rejected';
  verified?: boolean;
}

export interface MaterialEntry {
  id: string;
  projectId: string;
  itemName: string;
  quantity: number;
  unit?: string;
  cost: number;
  billUrl?: string;
  purchasedAt: string;
  addedBy: string;
  requiredQuantity?: number;
  deliveredQuantity?: number;
  usedQuantity?: number;
  remainingQuantity?: number;
  supplierName?: string;
  supplierPhone?: string;
  invoiceRef?: string;
  deliveryDate?: string;
}

export interface ProjectTeamMember {
  id: string;
  projectId: string;
  name: string;
  role: string;
  count?: number;
  avatar?: string;
  linkedUserId?: string;
  phone?: string;
  attendance?: { date: string; present: boolean }[];
  attendanceLog?: { date: string; inTime: string; outTime: string; hoursWorked: number; todayWork?: string }[];
  assignedWork?: string;
  verified?: boolean;
  experience?: string;
  reportsTo?: string;
}

export interface PaymentRequest {
  id: string;
  projectId: string;
  milestoneId?: string;
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  gateway?: string;
  paymentId?: string;
  orderId?: string;
  requestedBy: string;
  requestedAt: string;
  respondedAt?: string;
}

export interface ProjectWeeklySummary {
  id: string;
  projectId: string;
  weekLabel: string;
  weekStartDate: string;
  weekEndDate: string;
  milestonesCompleted: string[];
  mediaUploadedCount: number;
  issuesResolvedCount: number;
  fundsReleasedAmount: number;
  progressPercentGain: number;
  highlights: string[];
  nextWeekOutlook: string;
  aiSummaryText: string;
  createdAt: string;
}

export interface BeforeAfterGroup {
  spaceName: string;
  beforePhotos: ProjectMedia[];
  duringPhotos: ProjectMedia[];
  afterPhotos: ProjectMedia[];
}

export interface ProjectWarranty {
  id: string;
  projectId: string;
  businessId: string;
  durationMonths: number;
  coverage: string;
  issuedAt: string;
  documentUrl?: string;
}

export interface DecisionOption {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  costImpact?: number;
}

export interface ProjectDecision {
  id: string;
  projectId: string;
  milestoneId?: string;
  title: string;
  description?: string;
  options: DecisionOption[];
  deadline?: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  selectedOptionId?: string;
  customerNotes?: string;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface ProjectIssue {
  id: string;
  projectId: string;
  milestoneId?: string;
  title: string;
  description: string;
  effectDays?: number;
  extraCost?: number;
  reportedBy: string;
  reportedByName?: string;
  reportedByRole: 'client' | 'professional';
  status: 'pending' | 'accepted' | 'rejected' | 'resolved';
  responseNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface ProjectChangeRequest {
  id: string;
  projectId: string;
  title: string;
  description: string;
  extraCost: number;
  extraTimeDays: number;
  requestedBy: string;
  requestedByName?: string;
  requestedByRole: 'client' | 'professional';
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  createdAt: string;
}

// ==========================================
// ZENZY PROFESSIONAL SUITE INTERFACES
// ==========================================

export interface ProCustomer {
  id: string;
  professionalId: string;
  name: string;
  email?: string;
  phone: string;
  companyName?: string;
  address?: string;
  city?: string;
  status: 'lead' | 'active' | 'completed' | 'archived';
  isFavourite?: boolean;
  isRepeat?: boolean;
  completedProjectsCount?: number;
  totalRevenue?: number;
  createdAt: string;
  updatedAt?: string;
  profilePhoto?: string;
  preferredTime?: string;
  paymentPreference?: string;
  materialPreference?: string;
  familyMembers?: string[];
  specialNotes?: string[];
  addresses?: { label: string; address: string; isPrimary?: boolean }[];
}

export interface ProCustomerNote {
  id: string;
  customerId: string;
  professionalId: string;
  authorName: string;
  note: string;
  createdAt: string;
}

export interface ProCustomerFollowup {
  id: string;
  customerId: string;
  customerName?: string;
  professionalId: string;
  dueDate: string;
  note: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface ProPortfolioAlbum {
  id: string;
  professionalId: string;
  title: string;
  category: string;
  description: string;
  location: string;
  cost: number;
  duration: string;
  beforeAfterPairs: { id: string; beforeUrl: string; afterUrl: string; caption?: string }[];
  videoUrls: string[];
  rating?: number;
  reviewText?: string;
  customerId?: string;
  customerName?: string;
  projectId?: string;
  status: 'draft' | 'published';
  createdAt: string;
}

export interface ProCalendarEvent {
  id: string;
  professionalId: string;
  type: 'site_visit' | 'meeting' | 'payment_due' | 'payment_received' | 'material_delivery' | 'customer_followup' | 'warranty_reminder';
  title: string;
  startDate: string;
  endDate: string;
  customerId?: string;
  customerName?: string;
  projectId?: string;
  invoiceId?: string;
  warrantyId?: string;
  notes?: string;
  color?: string;
  source?: 'manual' | 'crm' | 'warranty' | 'finance';
}

export interface ProVaultDocument {
  id: string;
  professionalId: string;
  category: 'gst' | 'pan' | 'aadhaar' | 'contract' | 'bill' | 'drawing' | 'warranty' | 'insurance' | 'other';
  name: string;
  fileUrl: string;
  fileType: string;
  fileSize?: string;
  tags: string[];
  expiryDate?: string;
  customerId?: string;
  customerName?: string;
  projectId?: string;
  createdAt: string;
}

export interface ProTeamMember {
  id: string;
  professionalId: string;
  name: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive';
  salaryAmount: number;
  payCycle: 'monthly' | 'weekly' | 'daily';
  assignedProjectIds: string[];
  rating?: number;
  performanceNotes?: string;
  createdAt: string;
}

export interface ProTeamAttendance {
  id: string;
  professionalId: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'half_day' | 'leave';
}

export interface ProExpense {
  id: string;
  professionalId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  projectId?: string;
  supplierId?: string;
  receiptUrl?: string;
  createdAt: string;
}

export interface ProWarrantyIssue {
  id: string;
  description: string;
  reportedAt: string;
  status: 'open' | 'scheduled' | 'resolved';
  visitDate?: string;
  resolutionNotes?: string;
  photos?: string[];
}

export interface ProWarrantyRecord {
  id: string;
  professionalId: string;
  projectId: string;
  projectTitle?: string;
  customerId: string;
  customerName?: string;
  startDate: string;
  durationMonths: number;
  endDate: string;
  coverageTerms: string;
  issues: ProWarrantyIssue[];
  createdAt: string;
}

export interface ProSupplier {
  id: string;
  professionalId: string;
  name: string;
  phone: string;
  email?: string;
  categories: string[];
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface ProMaterialPrice {
  id: string;
  professionalId: string;
  supplierId: string;
  supplierName?: string;
  materialName: string;
  category?: string;
  unit: string;
  price: number;
  effectiveDate: string;
  createdAt: string;
}

export interface CrmLead {
  id: string;
  professionalId: string;
  name: string;
  phone: string;
  email?: string;
  location: string;
  serviceNeeded: string;
  budget: number;
  propertyType: "Residential" | "Commercial" | "Villa" | "Apartment" | "Office";
  leadSource: "Zenzy Marketplace" | "Direct Website" | "WhatsApp" | "Referral" | "Instagram" | "Direct Profile Inquiry" | "Direct Professional CRM" | string;
  createdAt: string;
  updatedAt?: string;
  status: "new" | "contacted" | "site_visit" | "quotation_sent" | "negotiation" | "won" | "lost";
  aiScore: number; // e.g. 92%
  aiReasons: string[]; // ["Budget matches", "Replies quickly", "Site visit done", "Likely to convert"]
  followUps: {
    id: string;
    type: "call" | "whatsapp" | "reminder" | "visit" | "email";
    scheduledFor: string;
    notes?: string;
    status: "pending" | "done";
  }[];
  timeline: {
    id: string;
    title: string;
    description?: string;
    timestamp: string;
    actor?: string;
  }[];
  notes?: string[];
  sitePhotos?: string[];
  callLogs?: { id: string; date: string; duration: string; summary: string }[];
  quotationId?: string;
}



export interface CrmQuotation {
  id: string;
  professionalId: string;
  leadId?: string;
  customerName: string;
  customerPhone: string;
  projectTitle: string;
  totalAmount: number;
  status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired";
  createdAt: string;
  validUntil?: string;
  items: { title: string; qty: number; unit: string; rate: number; amount: number }[];
  pdfUrl?: string;
  aiGenerated?: boolean;
}

export interface CrmInvoice {
  id: string;
  professionalId: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  status: "pending" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  createdAt: string;
  paymentLink?: string;
  paymentId?: string;
}




