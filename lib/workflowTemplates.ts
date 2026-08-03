import { WorkflowTemplate, WorkflowStage, Milestone } from "./schema";

export const STARTER_WORKFLOW_TEMPLATES: Omit<WorkflowTemplate, "businessId" | "createdAt">[] = [
  {
    id: "template-house-construction",
    name: "House Construction",
    category: "construction",
    stages: [
      { id: "hc-1", name: "Site Layout & Excavation", order: 1, expectedDurationDays: 10, approvalNeeded: true, mediaRequired: true, mandatory: true },
      { id: "hc-2", name: "Foundation & Footing Concrete", order: 2, expectedDurationDays: 14, dependsOn: ["hc-1"], paymentLinked: true, paymentAmount: 150000, inspectionRequired: true, mandatory: true },
      { id: "hc-3", name: "Plinth & RCC Column Structure", order: 3, expectedDurationDays: 20, dependsOn: ["hc-2"], documentsRequired: ["blueprint"], inspectionRequired: true, mandatory: true },
      { id: "hc-4", name: "Brickwork & Slab Casting", order: 4, expectedDurationDays: 25, dependsOn: ["hc-3"], paymentLinked: true, paymentAmount: 200000, approvalNeeded: true, mandatory: true },
      { id: "hc-5", name: "Plumbing & Electrical Conduit Piping", order: 5, expectedDurationDays: 12, dependsOn: ["hc-4"], inspectionRequired: true },
      { id: "hc-6", name: "Plastering & Flooring Work", order: 6, expectedDurationDays: 15, dependsOn: ["hc-5"], paymentLinked: true, paymentAmount: 100000 },
      { id: "hc-7", name: "Painting & Handover Inspection", order: 7, expectedDurationDays: 10, dependsOn: ["hc-6"], approvalNeeded: true, documentsRequired: ["warranty_card"], mandatory: true }
    ]
  },
  {
    id: "template-interior-design",
    name: "Interior Design",
    category: "interior",
    stages: [
      { id: "id-1", name: "3D Visuals & Material Approval", order: 1, expectedDurationDays: 7, approvalNeeded: true, documentsRequired: ["blueprint"], mandatory: true },
      { id: "id-2", name: "Carpentry & Modular Framework", order: 2, expectedDurationDays: 14, dependsOn: ["id-1"], paymentLinked: true, paymentAmount: 80000, mediaRequired: true },
      { id: "id-3", name: "Laminate & Veneer Pressing", order: 3, expectedDurationDays: 10, dependsOn: ["id-2"], inspectionRequired: true },
      { id: "id-4", name: "Hardware & Lighting Installation", order: 4, expectedDurationDays: 7, dependsOn: ["id-3"], paymentLinked: true, paymentAmount: 50000 },
      { id: "id-5", name: "Final Deep Cleaning & Handover", order: 5, expectedDurationDays: 3, dependsOn: ["id-4"], approvalNeeded: true, mandatory: true }
    ]
  },
  {
    id: "template-kitchen-renovation",
    name: "Kitchen Renovation",
    category: "renovation",
    stages: [
      { id: "kr-1", name: "Demolition & Countertop Prep", order: 1, expectedDurationDays: 3, mediaRequired: true },
      { id: "kr-2", name: "Gas & Water Line Rerouting", order: 2, expectedDurationDays: 4, dependsOn: ["kr-1"], inspectionRequired: true, mandatory: true },
      { id: "kr-3", name: "Granite & Dado Tile Fixation", order: 3, expectedDurationDays: 5, dependsOn: ["kr-2"], paymentLinked: true, paymentAmount: 35000 },
      { id: "kr-4", name: "Modular Cabinet Fabrication", order: 4, expectedDurationDays: 8, dependsOn: ["kr-3"], approvalNeeded: true, mandatory: true }
    ]
  },
  {
    id: "template-bathroom-renovation",
    name: "Bathroom Renovation",
    category: "renovation",
    stages: [
      { id: "br-1", name: "Sanitary Dismantling & Waterproofing", order: 1, expectedDurationDays: 4, inspectionRequired: true, mandatory: true },
      { id: "br-2", name: "Piping & Tile Laying", order: 2, expectedDurationDays: 6, dependsOn: ["br-1"], paymentLinked: true, paymentAmount: 30000, mediaRequired: true },
      { id: "br-3", name: "Fixture & Shower Fitting", order: 3, expectedDurationDays: 3, dependsOn: ["br-2"], approvalNeeded: true, mandatory: true }
    ]
  },
  {
    id: "template-ac-installation",
    name: "AC Installation",
    category: "hvac",
    stages: [
      { id: "ac-1", name: "Copper Piping & Bracket Mounting", order: 1, expectedDurationDays: 1, mediaRequired: true },
      { id: "ac-2", name: "Indoor & Outdoor Unit Fixation", order: 2, expectedDurationDays: 1, dependsOn: ["ac-1"], inspectionRequired: true },
      { id: "ac-3", name: "Vacuuming & Gas Pressure Test", order: 3, expectedDurationDays: 1, dependsOn: ["ac-2"], approvalNeeded: true, paymentLinked: true, paymentAmount: 15000, mandatory: true }
    ]
  },
  {
    id: "template-solar-installation",
    name: "Solar Installation",
    category: "solar",
    stages: [
      { id: "so-1", name: "Rooftop Structure Fabrication", order: 1, expectedDurationDays: 3, inspectionRequired: true, mandatory: true },
      { id: "so-2", name: "Solar Panel Mounting & Wiring", order: 2, expectedDurationDays: 4, dependsOn: ["so-1"], paymentLinked: true, paymentAmount: 60000, mediaRequired: true },
      { id: "so-3", name: "Inverter & Net Meter Sync", order: 3, expectedDurationDays: 3, dependsOn: ["so-2"], documentsRequired: ["approval"], approvalNeeded: true, mandatory: true }
    ]
  },
  {
    id: "template-painting",
    name: "Painting Work",
    category: "painting",
    stages: [
      { id: "pt-1", name: "Sanding & Putty Coating", order: 1, expectedDurationDays: 4, mediaRequired: true },
      { id: "pt-2", name: "Primer & First Coat", order: 2, expectedDurationDays: 3, dependsOn: ["pt-1"], paymentLinked: true, paymentAmount: 25000 },
      { id: "pt-3", name: "Final Coat & Texture Finishing", order: 3, expectedDurationDays: 3, dependsOn: ["pt-2"], approvalNeeded: true, mandatory: true }
    ]
  },
  {
    id: "template-false-ceiling",
    name: "False Ceiling",
    category: "interior",
    stages: [
      { id: "fc-1", name: "GI Framing & Channel Grid", order: 1, expectedDurationDays: 3, inspectionRequired: true },
      { id: "fc-2", name: "Gypsum Board Fixing & Taping", order: 2, expectedDurationDays: 4, dependsOn: ["fc-1"], paymentLinked: true, paymentAmount: 20000 },
      { id: "fc-3", name: "Cove Light Cutouts & Finishing", order: 3, expectedDurationDays: 2, dependsOn: ["fc-2"], approvalNeeded: true, mandatory: true }
    ]
  },
  {
    id: "template-electrical",
    name: "Electrical Rewiring",
    category: "electrical",
    stages: [
      { id: "el-1", name: "Wall Chipping & Conduit Laying", order: 1, expectedDurationDays: 5, mediaRequired: true },
      { id: "el-2", name: "Wire Pulling & Distribution Board Setup", order: 2, expectedDurationDays: 5, dependsOn: ["el-1"], inspectionRequired: true, paymentLinked: true, paymentAmount: 30000 },
      { id: "el-3", name: "Switchboard & Load Testing", order: 3, expectedDurationDays: 3, dependsOn: ["el-2"], approvalNeeded: true, mandatory: true }
    ]
  },
  {
    id: "template-plumbing",
    name: "Plumbing Line Laying",
    category: "plumbing",
    stages: [
      { id: "pb-1", name: "CPVC & SWR Pipe Laying", order: 1, expectedDurationDays: 4, inspectionRequired: true, mandatory: true },
      { id: "pb-2", name: "Hydrostatic Pressure Testing", order: 2, expectedDurationDays: 2, dependsOn: ["pb-1"], mediaRequired: true, paymentLinked: true, paymentAmount: 20000 },
      { id: "pb-3", name: "Drainage Connection & Sanitary Testing", order: 3, expectedDurationDays: 2, dependsOn: ["pb-2"], approvalNeeded: true, mandatory: true }
    ]
  }
];

export function instantiateWorkflowMilestones(
  projectId: string,
  stages: WorkflowStage[]
): Omit<Milestone, "id">[] {
  // Map stage IDs to position indices to build milestone dependencies
  const stageIdIndexMap = new Map<string, number>();
  stages.forEach((st, idx) => {
    stageIdIndexMap.set(st.id, idx);
  });

  return stages.map((st, idx) => {
    // Map stage dependsOn IDs to milestone indices/IDs
    const dependsOnMilestoneIds = (st.dependsOn || []).map(depId => depId);

    return {
      projectId,
      title: st.name || `Stage ${idx + 1}`,
      description: `Stage #${st.order || idx + 1}: ${st.name}`,
      status: "pending",
      progressPercent: 0,
      order: st.order || idx + 1,
      workflowStageId: st.id || `stage-${idx + 1}`,
      dependsOnMilestoneIds,
      paymentLinked: Boolean(st.paymentLinked),
      paymentAmount: st.paymentAmount || 0,
      documentsRequired: st.documentsRequired || [],
      mediaRequired: Boolean(st.mediaRequired),
      gpsRequired: Boolean(st.gpsRequired),
      inspectionRequired: Boolean(st.inspectionRequired),
      mandatory: Boolean(st.mandatory),
      instructions: st.instructions || [
        `Execute ${st.name} according to approved drawings & layout.`,
        "Adhere to strict safety guidelines and quality inspection standards.",
        "Capture execution photos/videos before proceeding to next stage."
      ],
      objectives: st.objectives || [
        `Complete core ${st.name} work package`,
        "Verify material specs and hardware fittings",
        "Obtain client review & verification"
      ],
      deliverables: st.deliverables || [
        `${st.name} Work Execution`,
        "Inspection & Test Report",
        "Site Photos & Proofs",
        "Client Signoff Certificate"
      ],
      assignedTeamRoles: st.assignedTeamRoles || ["Lead Specialist", "Supervisor"]
    };
  });
}
