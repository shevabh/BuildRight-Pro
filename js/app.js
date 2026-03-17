/**
 * Construction Manager — Main Application Logic (Alpine.js)
 * Step-by-step project management with cost estimator
 */

document.addEventListener('alpine:init', () => {
  Alpine.data('constructionApp', () => ({
    // ─── NAVIGATION ──────────────────────────────────────────────
    currentView: 'dashboard', // dashboard | newProject | projectDetail | estimate
    currentStep: 1,
    totalSteps: 5,

    // ─── PROJECTS ────────────────────────────────────────────────
    projects: JSON.parse(localStorage.getItem('cm_projects') || '[]'),
    activeProjectId: null,

    // ─── NEW PROJECT FORM ────────────────────────────────────────
    form: {
      name: '',
      stateCode: '',
      cityKey: '',
      sqft: 2000,
      builderType: 'gc',
      qualityTier: 'standard',
      homeType: 'ranch',
      foundationType: 'basement',
      garageType: 'two',
      contingencyRate: 10,
      startDate: '',
      notes: ''
    },

    // ─── ESTIMATE RESULTS ────────────────────────────────────────
    estimate: null,
    comparison: null,
    showComparison: false,

    // ─── COMPUTED / HELPERS ──────────────────────────────────────
    get states() {
      return Object.entries(CostData.REGIONS)
        .map(([code, data]) => ({ code, name: data.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    get cities() {
      if (!this.form.stateCode) return [];
      const region = CostData.REGIONS[this.form.stateCode];
      if (!region || !region.cities) return [];
      return Object.entries(region.cities)
        .map(([key, data]) => ({ key, name: data.name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },

    get qualityTiers() {
      return Object.entries(CostData.QUALITY_TIERS)
        .map(([key, data]) => ({ key, ...data }));
    },

    get homeTypes() {
      return Object.entries(CostData.HOME_TYPES)
        .map(([key, data]) => ({ key, ...data }));
    },

    get foundationTypes() {
      return Object.entries(CostData.FOUNDATION_TYPES)
        .map(([key, data]) => ({ key, ...data }));
    },

    get garageOptions() {
      return Object.entries(CostData.GARAGE_OPTIONS)
        .map(([key, data]) => ({ key, ...data }));
    },

    get builderTypes() {
      return Object.entries(CostData.BUILDER_TYPE_MULTIPLIERS)
        .map(([key, data]) => ({ key, ...data }));
    },

    get activeProject() {
      return this.projects.find(p => p.id === this.activeProjectId) || null;
    },

    get sortedPhases() {
      if (!this.estimate) return [];
      return Object.values(this.estimate.phases)
        .sort((a, b) => a.order - b.order);
    },

    get locationName() {
      if (!this.form.stateCode) return '';
      const state = CostData.REGIONS[this.form.stateCode];
      if (this.form.cityKey && state.cities[this.form.cityKey]) {
        return `${state.cities[this.form.cityKey].name}, ${state.name}`;
      }
      return state.name;
    },

    // ─── INITIALIZATION ──────────────────────────────────────────
    init() {
      // Set default start date to today
      this.form.startDate = new Date().toISOString().split('T')[0];
    },

    // ─── NAVIGATION METHODS ──────────────────────────────────────
    goToDashboard() {
      this.currentView = 'dashboard';
      this.activeProjectId = null;
      this.estimate = null;
      this.comparison = null;
      this.showComparison = false;
    },

    startNewProject() {
      this.resetForm();
      this.currentStep = 1;
      this.currentView = 'newProject';
    },

    nextStep() {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      }
      if (this.currentStep === 5) {
        this.generateEstimate();
      }
    },

    prevStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
      }
    },

    canProceed() {
      switch (this.currentStep) {
        case 1: return this.form.name && this.form.stateCode;
        case 2: return this.form.sqft >= 500;
        case 3: return this.form.builderType;
        case 4: return true;
        default: return true;
      }
    },

    // ─── PROJECT CRUD ────────────────────────────────────────────
    resetForm() {
      this.form = {
        name: '',
        stateCode: '',
        cityKey: '',
        sqft: 2000,
        builderType: 'gc',
        qualityTier: 'standard',
        homeType: 'ranch',
        foundationType: 'basement',
        garageType: 'two',
        contingencyRate: 10,
        startDate: new Date().toISOString().split('T')[0],
        notes: ''
      };
      this.estimate = null;
      this.comparison = null;
      this.showComparison = false;
    },

    saveProject() {
      const project = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...JSON.parse(JSON.stringify(this.form)),
        estimate: JSON.parse(JSON.stringify(this.estimate)),
        phases: this.buildPhaseTracker(),
        status: 'planning'
      };
      this.projects.unshift(project);
      this.persistProjects();
      this.activeProjectId = project.id;
      this.currentView = 'projectDetail';
    },

    deleteProject(id) {
      if (confirm('Are you sure you want to delete this project?')) {
        this.projects = this.projects.filter(p => p.id !== id);
        this.persistProjects();
        if (this.activeProjectId === id) {
          this.goToDashboard();
        }
      }
    },

    openProject(id) {
      this.activeProjectId = id;
      const project = this.activeProject;
      if (project) {
        this.estimate = project.estimate;
        this.currentView = 'projectDetail';
      }
    },

    persistProjects() {
      localStorage.setItem('cm_projects', JSON.stringify(this.projects));
    },

    // ─── PHASE TRACKER ───────────────────────────────────────────
    buildPhaseTracker() {
      if (!this.estimate) return [];
      const startDate = new Date(this.form.startDate || Date.now());
      let currentDate = new Date(startDate);
      
      return this.sortedPhases.map(phase => {
        const phaseStart = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + (phase.durationWeeks * 7));
        const phaseEnd = new Date(currentDate);
        
        return {
          key: phase.phaseKey,
          name: phase.phaseName,
          description: phase.description,
          status: 'not-started', // not-started | in-progress | completed
          startDate: phaseStart.toISOString().split('T')[0],
          endDate: phaseEnd.toISOString().split('T')[0],
          durationWeeks: phase.durationWeeks,
          estimatedCost: phase.totalCost,
          actualCost: 0,
          notes: '',
          checklist: this.getPhaseChecklist(phase.phaseKey)
        };
      });
    },

    getPhaseChecklist(phaseKey) {
      const checklists = {
        sitePrep: [
          'Survey property boundaries',
          'Obtain clearing permits',
          'Clear trees and debris',
          'Grade and level site',
          'Install silt fence / erosion control',
          'Set up temporary power',
          'Bring in temporary sanitation',
          'Mark utility locations (call 811)'
        ],
        foundation: [
          'Excavation complete',
          'Footings poured and inspected',
          'Foundation walls poured',
          'Waterproofing applied',
          'Drain tile installed',
          'Foundation inspection passed',
          'Backfill complete',
          'Slab / basement floor poured'
        ],
        framing: [
          'Sill plates and anchor bolts',
          'Floor joists / system installed',
          'Subfloor installed',
          'Exterior walls framed and raised',
          'Interior walls framed',
          'Roof trusses / rafters set',
          'Roof sheathing installed',
          'Stairs framed',
          'Framing inspection passed'
        ],
        roofing: [
          'Ice and water shield at edges',
          'Underlayment installed',
          'Drip edge and flashing',
          'Shingles / metal installed',
          'Ridge vent / ventilation',
          'Gutters and downspouts',
          'Roof inspection passed'
        ],
        exteriorEnvelope: [
          'House wrap / WRB installed',
          'Windows installed and flashed',
          'Exterior doors installed',
          'Siding / cladding installed',
          'Soffit and fascia',
          'Exterior trim and caulking',
          'Exterior paint / stain (if applicable)'
        ],
        plumbing: [
          'Underground rough-in (before slab)',
          'Supply lines roughed in',
          'Drain / waste / vent roughed in',
          'Gas lines roughed in',
          'Plumbing rough inspection passed',
          'Water heater installed',
          'Fixtures installed (sinks, toilets, tubs)',
          'Final plumbing inspection passed'
        ],
        electrical: [
          'Panel and meter base set',
          'Rough wiring — outlets and switches',
          'Rough wiring — lighting circuits',
          'Low voltage (network, cable, speakers)',
          'Smoke and CO detectors wired',
          'Electrical rough inspection passed',
          'Fixtures and devices installed',
          'Final electrical inspection passed'
        ],
        hvac: [
          'Ductwork installed',
          'Furnace / air handler set',
          'AC condenser placed and connected',
          'Venting (furnace, water heater)',
          'Thermostat / controls wired',
          'ERV / HRV installed (if applicable)',
          'HVAC inspection passed',
          'System start-up and balance'
        ],
        insulation: [
          'Air sealing (gaps, penetrations)',
          'Exterior wall insulation',
          'Interior wall insulation (soundproofing)',
          'Attic / ceiling insulation',
          'Basement / crawl insulation',
          'Vapor barriers installed',
          'Insulation inspection passed'
        ],
        drywall: [
          'Drywall delivered and stocked',
          'Sheets hung on ceilings',
          'Sheets hung on walls',
          'First coat of mud (taping)',
          'Second coat of mud',
          'Final coat and sanding',
          'Texture applied (if applicable)',
          'Touch-ups complete'
        ],
        interiorFinish: [
          'Interior doors hung',
          'Door casing / trim installed',
          'Baseboard installed',
          'Crown molding (if applicable)',
          'Closet systems / shelving',
          'Stair railings / balusters',
          'Window sills and aprons',
          'All trim caulked and filled'
        ],
        cabinetryCountertops: [
          'Kitchen cabinets installed',
          'Bathroom vanities installed',
          'Countertop measurements / template',
          'Countertops fabricated and installed',
          'Cabinet hardware installed',
          'Backsplash installed',
          'Pantry / utility shelving'
        ],
        flooring: [
          'Subfloor prep and leveling',
          'Tile floors installed',
          'Hardwood / LVP installed',
          'Carpet installed',
          'Transitions and thresholds',
          'Floor registers / vents',
          'Final clean of all floors'
        ],
        painting: [
          'Prime all new drywall',
          'Ceilings painted',
          'Walls painted — first coat',
          'Walls painted — second coat',
          'Trim and doors painted',
          'Touch-ups after final trades',
          'Exterior paint / stain (if not done)'
        ],
        landscaping: [
          'Final grading',
          'Topsoil spread',
          'Driveway poured / paved',
          'Sidewalks and paths',
          'Seed or sod laid',
          'Deck / patio built',
          'Fencing installed',
          'Landscaping beds and plantings',
          'Irrigation (if applicable)'
        ],
        permits: [
          'Architectural plans completed',
          'Site survey completed',
          'Building permit application submitted',
          'Building permit approved',
          'Impact fees paid',
          'Utility connection fees paid',
          'Septic permit (if applicable)',
          'HOA approval (if applicable)'
        ],
        cleanup: [
          'Construction debris removed',
          'Dumpster hauled off',
          'Interior deep clean',
          'Windows cleaned',
          'Punch list walkthrough',
          'All punch list items addressed',
          'Final inspection scheduled',
          'Certificate of Occupancy received'
        ]
      };
      return (checklists[phaseKey] || []).map(item => ({ text: item, done: false }));
    },

    // ─── PHASE STATUS MANAGEMENT ─────────────────────────────────
    toggleCheckItem(phaseIndex, itemIndex) {
      const project = this.activeProject;
      if (!project) return;
      project.phases[phaseIndex].checklist[itemIndex].done = 
        !project.phases[phaseIndex].checklist[itemIndex].done;
      project.updatedAt = new Date().toISOString();
      this.persistProjects();
    },

    updatePhaseStatus(phaseIndex, status) {
      const project = this.activeProject;
      if (!project) return;
      project.phases[phaseIndex].status = status;
      project.updatedAt = new Date().toISOString();
      this.updateProjectStatus();
      this.persistProjects();
    },

    updatePhaseActualCost(phaseIndex, cost) {
      const project = this.activeProject;
      if (!project) return;
      project.phases[phaseIndex].actualCost = parseFloat(cost) || 0;
      project.updatedAt = new Date().toISOString();
      this.persistProjects();
    },

    updatePhaseNotes(phaseIndex, notes) {
      const project = this.activeProject;
      if (!project) return;
      project.phases[phaseIndex].notes = notes;
      project.updatedAt = new Date().toISOString();
      this.persistProjects();
    },

    updateProjectStatus() {
      const project = this.activeProject;
      if (!project) return;
      const phases = project.phases;
      const allDone = phases.every(p => p.status === 'completed');
      const anyStarted = phases.some(p => p.status !== 'not-started');
      
      if (allDone) project.status = 'completed';
      else if (anyStarted) project.status = 'in-progress';
      else project.status = 'planning';
    },

    getPhaseProgress(project) {
      if (!project.phases) return 0;
      const completed = project.phases.filter(p => p.status === 'completed').length;
      return Math.round((completed / project.phases.length) * 100);
    },

    getActualTotal(project) {
      if (!project.phases) return 0;
      return project.phases.reduce((sum, p) => sum + (p.actualCost || 0), 0);
    },

    getChecklistProgress(phase) {
      if (!phase.checklist || phase.checklist.length === 0) return 0;
      const done = phase.checklist.filter(c => c.done).length;
      return Math.round((done / phase.checklist.length) * 100);
    },

    // ─── ESTIMATE GENERATION ─────────────────────────────────────
    generateEstimate() {
      const config = {
        sqft: parseInt(this.form.sqft),
        stateCode: this.form.stateCode,
        cityKey: this.form.cityKey || null,
        builderType: this.form.builderType,
        qualityTier: this.form.qualityTier,
        homeType: this.form.homeType,
        foundationType: this.form.foundationType,
        garageType: this.form.garageType,
        contingencyRate: this.form.contingencyRate / 100
      };
      this.estimate = Calculator.calculateFullEstimate(config);
      this.comparison = Calculator.compareBuilderTypes(config);
    },

    toggleComparison() {
      this.showComparison = !this.showComparison;
    },

    // ─── FORMATTING HELPERS ──────────────────────────────────────
    fmt(amount) {
      return Calculator.formatMoney(amount);
    },

    fmtDate(dateStr) {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });
    },

    statusColor(status) {
      const colors = {
        'not-started': 'bg-gray-200 text-gray-700',
        'in-progress': 'bg-blue-100 text-blue-800',
        'completed': 'bg-green-100 text-green-800',
        'planning': 'bg-yellow-100 text-yellow-800'
      };
      return colors[status] || colors['not-started'];
    },

    statusIcon(status) {
      const icons = {
        'not-started': '○',
        'in-progress': '◐',
        'completed': '●',
        'planning': '◇'
      };
      return icons[status] || '○';
    },

    // ─── EXPORT / PRINT ──────────────────────────────────────────
    printEstimate() {
      window.print();
    },

    exportProject() {
      const project = this.activeProject;
      if (!project) return;
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '-')}-project.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    importProject(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const project = JSON.parse(e.target.result);
          if (project.name && project.estimate) {
            project.id = Date.now().toString();
            project.importedAt = new Date().toISOString();
            this.projects.unshift(project);
            this.persistProjects();
            this.openProject(project.id);
          } else {
            alert('Invalid project file');
          }
        } catch {
          alert('Could not read project file');
        }
      };
      reader.readAsText(file);
    }
  }));
});
