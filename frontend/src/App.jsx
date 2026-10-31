import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Camera,
  Apple,
  Activity,
  ChefHat,
  ShieldCheck,
  Server,
  Zap,
  AlertCircle,
  Clock,
  Award,
  Layers,
  RefreshCw,
  TrendingUp,
  UploadCloud,
  Upload,
  Trash2,
  Image as ImageIcon,
  FileText,
  Info,
  RotateCcw,
} from 'lucide-react';
import './App.css';

const PRESET_DISHES = [
  {
    id: 'avocado_toast',
    name: 'Artisanal Avocado & Poached Egg Toast',
    subtitle: 'Microgreens & Sesame Sourdough',
    image: '/images/avocado_toast.jpg',
  },
  {
    id: 'salmon_bowl',
    name: 'Pacific Salmon Poke & Quinoa Bowl',
    subtitle: 'Omega-3 Superfood Protein Bowl',
    image: '/images/salmon_bowl.jpg',
  },
  {
    id: 'fresh_produce',
    name: 'Farm-Fresh Mediterranean Harvest',
    subtitle: 'Organic Vine Tomatoes, Basil & Broccoli',
    image: '/images/fresh_produce.jpg',
  },
];

const SUPPORTED_PRODUCE = [
  'Bean',
  'Bitter Gourd',
  'Bottle Gourd',
  'Brinjal',
  'Broccoli',
  'Cabbage',
  'Capsicum',
  'Carrot',
  'Cauliflower',
  'Cucumber',
  'Papaya',
  'Potato',
  'Pumpkin',
  'Radish',
  'Tomato',
];

const API_BASE = 'http://127.0.0.1:8000';

const fetchBackendStatus = async () => {
  const start = performance.now();
  const response = await fetch(`${API_BASE}/api/health`);
  if (!response.ok) {
    return { online: false, ping: null, info: null };
  }
  const info = await response.json();
  return {
    online: true,
    ping: Math.round(performance.now() - start),
    info,
  };
};

const getServiceErrorMessage = (error, service) => {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return `Unable to connect to the ${service} service. Check that the backend is running at ${API_BASE}.`;
  }
  return error instanceof Error ? error.message : `Unable to reach the ${service} service.`;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedDishId, setSelectedDishId] = useState('avocado_toast');
  const [backendStatus, setBackendStatus] = useState({ online: false, ping: null, info: null });

  const [portionGrams, setPortionGrams] = useState(250);
  const [nutritionResult, setNutritionResult] = useState(null);
  const [nutritionError, setNutritionError] = useState('');
  const [loadingNutrition, setLoadingNutrition] = useState(false);

  const [freshnessItem, setFreshnessItem] = useState('Ripe Vine Tomatoes');
  const [freshnessResult, setFreshnessResult] = useState(null);
  const [freshnessError, setFreshnessError] = useState('');
  const [loadingFreshness, setLoadingFreshness] = useState(false);

  const [pantryIngredients, setPantryIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [dietaryChoice, setDietaryChoice] = useState('Vegetarian');
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [recipeError, setRecipeError] = useState('');
  const [generatingRecipe, setGeneratingRecipe] = useState(false);

  const [facilityName, setFacilityName] = useState('');
  const [inspectionZone, setInspectionZone] = useState('');
  const [surfaceScore, setSurfaceScore] = useState(null);
  const [tempScore, setTempScore] = useState(null);
  const [contaminationScore, setContaminationScore] = useState(null);
  const [auditResult, setAuditResult] = useState(null);
  const [auditError, setAuditError] = useState('');
  const [runningAudit, setRunningAudit] = useState(false);

  const [diagnosticsLog, setDiagnosticsLog] = useState([]);
  const [runningDiag, setRunningDiag] = useState(false);

  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzingUpload, setIsAnalyzingUpload] = useState(false);
  const [uploadPrediction, setUploadPrediction] = useState(null);

  const currentDish = PRESET_DISHES.find((d) => d.id === selectedDishId) || PRESET_DISHES[0];

  // Clean up object URLs created for image previews to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const checkHealth = async () => {
    try {
      setBackendStatus(await fetchBackendStatus());
    } catch {
      setBackendStatus({ online: false, ping: null, info: null });
    }
  };

  useEffect(() => {
    let active = true;
    fetchBackendStatus()
      .then((status) => {
        if (active) setBackendStatus(status);
      })
      .catch(() => {
        if (active) setBackendStatus({ online: false, ping: null, info: null });
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);


  const handleSelectDish = (id) => {
    setSelectedDishId(id);
  };

  const handleAddIngredient = (e) => {
    e.preventDefault();
    if (ingredientInput.trim() && !pantryIngredients.includes(ingredientInput.trim())) {
      setPantryIngredients([...pantryIngredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (ing) => {
    setPantryIngredients(pantryIngredients.filter((i) => i !== ing));
  };

  const handleAnalyzeFreshness = async () => {
    if (!freshnessItem.trim()) {
      setFreshnessError('Enter a food or produce name to continue.');
      setFreshnessResult(null);
      return;
    }

    setLoadingFreshness(true);
    setFreshnessError('');
    setFreshnessResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/freshness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_name: freshnessItem.trim(), storage_type: 'refrigerated' }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || 'Freshness assessment could not be completed.');
      }
      setFreshnessResult(await res.json());
    } catch (error) {
      setFreshnessError(getServiceErrorMessage(error, 'freshness'));
    } finally {
      setLoadingFreshness(false);
    }
  };

  const handleAnalyzeNutrition = async () => {
    setLoadingNutrition(true);
    setNutritionError('');
    setNutritionResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/nutrition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: selectedDishId === 'fresh_produce' ? 'fresh produce' : currentDish.name,
          portion_grams: portionGrams,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || 'Nutrition information could not be loaded.');
      }
      setNutritionResult(await res.json());
    } catch (error) {
      setNutritionError(getServiceErrorMessage(error, 'nutrition'));
    } finally {
      setLoadingNutrition(false);
    }
  };

  const handleGenerateRecipe = async () => {
    setRecipeError('');
    setGeneratedRecipe(null);
    setGeneratingRecipe(true);
    try {
      const res = await fetch(`${API_BASE}/api/cooking-assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: pantryIngredients,
          dietary_preference: dietaryChoice,
          user_prompt: 'Create a vibrant gourmet meal',
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || 'The recipe service could not create a recipe.');
      }
      const data = await res.json();
      if (!data.recipe) {
        throw new Error('The recipe service did not return a recipe.');
      }
      setGeneratedRecipe(data.recipe);
    } catch (error) {
      setRecipeError(getServiceErrorMessage(error, 'recipe'));
    } finally {
      setGeneratingRecipe(false);
    }
  };

  const handleRunAudit = async () => {
    const scores = [surfaceScore, tempScore, contaminationScore];
    if (scores.some((score) => score === null || !Number.isInteger(score) || score < 0 || score > 100)) {
      setAuditError('Enter a whole-number score from 0 to 100 in all three fields.');
      setAuditResult(null);
      return;
    }

    setAuditError('');
    setAuditResult(null);
    setRunningAudit(true);
    try {
      const res = await fetch(`${API_BASE}/api/hygiene-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(facilityName.trim() && { facility_name: facilityName.trim() }),
          ...(inspectionZone.trim() && { inspection_zone: inspectionZone.trim() }),
          surface_cleanliness: surfaceScore,
          temperature_control: tempScore,
          cross_contamination_prevention: contaminationScore,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || 'The hygiene assessment could not be completed.');
      }
      setAuditResult(await res.json());
    } catch (error) {
      setAuditError(getServiceErrorMessage(error, 'hygiene'));
    } finally {
      setRunningAudit(false);
    }
  };

  // Run full system diagnostics
  const handleRunDiagnostics = async () => {
    setRunningDiag(true);
    const logs = [];

    const endpoints = [
      { name: 'Health Check', path: '/api/health', method: 'GET' },
      { name: 'App Info', path: '/api/', method: 'GET' },
      {
        name: 'Vision Recognition',
        path: '/api/recognize',
        method: 'POST',
        body: { dish_id: 'avocado_toast' },
      },
      {
        name: 'Freshness Analyzer',
        path: '/api/freshness',
        method: 'POST',
        body: { item_name: 'Atlantic Salmon' },
      },
      {
        name: 'Nutrition Profiler',
        path: '/api/nutrition',
        method: 'POST',
        body: { food_name: 'Salmon Bowl', portion_grams: 250 },
      },
    ];

    for (const ep of endpoints) {
      const t0 = performance.now();
      try {
        const res = await fetch(`${API_BASE}${ep.path}`, {
          method: ep.method,
          headers: ep.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
          body: ep.body ? JSON.stringify(ep.body) : undefined,
        });
        const elapsed = Math.round(performance.now() - t0);
        const data = await res.json();
        logs.push({
          name: ep.name,
          path: ep.path,
          method: ep.method,
          status: res.status,
          latency: elapsed,
          success: res.ok,
          payload: data,
        });
      } catch (err) {
        logs.push({
          name: ep.name,
          path: ep.path,
          method: ep.method,
          status: 'Error',
          latency: 0,
          success: false,
          payload: { message: err.message },
        });
      }
    }

    setDiagnosticsLog(logs);
    setRunningDiag(false);
  };

  // Food image upload handlers (Phase 1)
  const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleProcessFile = (file) => {
    if (!file) return;

    const isSupportedImage =
      /\.(jpe?g|png|webp|bmp|jfif)$/i.test(file.name) &&
      (!file.type || file.type.startsWith('image/'));

    if (!isSupportedImage) {
      setUploadError('Choose a supported image format: JPG, PNG, WEBP, BMP, or JFIF.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setUploadError(`File size exceeds 10 MB limit (${sizeMb} MB). Please choose a smaller image.`);
      return;
    }

    setUploadError('');
    setUploadPrediction(null);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadedFile(file);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      e.target.value = '';
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setUploadedFile(null);
    setUploadError('');
    setUploadPrediction(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeClick = async () => {
    if (!uploadedFile) {
      setUploadError('No image selected. Please choose or drag an image first.');
      return;
    }

    setIsAnalyzingUpload(true);
    setUploadError('');
    setUploadPrediction(null);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await fetch(`${API_BASE}/api/recognize-upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        let errorDetail = 'Failed to analyze uploaded image.';
        try {
          const errData = await res.json();
          if (errData && errData.detail) {
            errorDetail = errData.detail;
          }
        } catch {
          errorDetail = `Inference failed with status ${res.status} (${res.statusText})`;
        }
        setUploadError(errorDetail);
        return;
      }

      const data = await res.json();
      setUploadPrediction(data);
    } catch {
      setUploadError(
        'Unable to connect to the FoodVerse AI backend server. Please verify the FastAPI service is running at http://127.0.0.1:8000.'
      );
    } finally {
      setIsAnalyzingUpload(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="brand-wrapper">
          <div className="brand-icon-box">
            <Apple size={21} />
          </div>
          <div>
            <div className="brand-title">Food Verse AI</div>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Main navigation">
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'home' ? 'active' : ''}`}
            aria-current={activeTab === 'home' ? 'page' : undefined}
            onClick={() => setActiveTab('home')}
          >
            Home
          </button>
          <button
            id="tab-vision-btn"
            type="button"
            className={`nav-tab-btn ${activeTab === 'vision' ? 'active' : ''}`}
            aria-current={activeTab === 'vision' ? 'page' : undefined}
            onClick={() => setActiveTab('vision')}
          >
            <Camera size={15} /> Recognize
          </button>
          <button
            id="tab-nutrition-btn"
            type="button"
            className={`nav-tab-btn ${activeTab === 'nutrition' ? 'active' : ''}`}
            aria-current={activeTab === 'nutrition' ? 'page' : undefined}
            onClick={() => setActiveTab('nutrition')}
          >
            <Activity size={15} /> Nutrition
          </button>
          <button
            id="tab-chef-btn"
            type="button"
            className={`nav-tab-btn ${activeTab === 'chef' ? 'active' : ''}`}
            aria-current={activeTab === 'chef' ? 'page' : undefined}
            onClick={() => setActiveTab('chef')}
          >
            <ChefHat size={15} /> Recipes
          </button>
          <button
            id="tab-freshness-btn"
            type="button"
            className={`nav-tab-btn ${activeTab === 'freshness' ? 'active' : ''}`}
            aria-current={activeTab === 'freshness' ? 'page' : undefined}
            onClick={() => setActiveTab('freshness')}
          >
            <Apple size={15} /> Freshness
          </button>
          <button
            id="tab-hygiene-btn"
            type="button"
            className={`nav-tab-btn ${activeTab === 'hygiene' ? 'active' : ''}`}
            aria-current={activeTab === 'hygiene' ? 'page' : undefined}
            onClick={() => setActiveTab('hygiene')}
          >
            <ShieldCheck size={15} /> Hygiene
          </button>
          <button
            id="tab-api-btn"
            type="button"
            className={`nav-tab-btn ${activeTab === 'api' ? 'active' : ''}`}
            aria-current={activeTab === 'api' ? 'page' : undefined}
            onClick={() => setActiveTab('api')}
          >
            <Server size={15} /> API status
          </button>
        </nav>

        <button
          type="button"
          className="header-status-box"
          onClick={checkHealth}
          aria-label="Refresh backend connection status"
          title="Refresh backend status"
        >
          <span className={`pulse-dot ${backendStatus.online ? '' : 'offline'}`} />
          <span>
            {backendStatus.online ? `Service online · ${backendStatus.ping} ms` : 'Service offline'}
          </span>
          <RefreshCw size={13} aria-hidden="true" />
        </button>
      </header>

      <main className="main-content">
        {activeTab === 'home' && (
          <section className="home-page" aria-labelledby="home-heading">
            <div className="home-hero">
              <div className="home-hero-copy">
                <span className="hero-tag"><Apple size={15} /> A little more insight at every meal</span>
                <h1 className="hero-headline" id="home-heading">Know Your Produce.</h1>
                <p className="hero-description">
                  Identify vegetables, explore their nutritional value, check freshness, and discover new ways to cook.
                </p>
                <div className="hero-actions">
                  <button type="button" className="btn-primary" onClick={() => setActiveTab('vision')}>
                    <Camera size={17} /> Identify Produce
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setActiveTab('nutrition')}>
                    Explore Nutrition
                  </button>
                </div>
                <details className="supported-classes">
                  <summary>See the 15 supported produce classes</summary>
                  <div className="supported-scope-bar">
                    {SUPPORTED_PRODUCE.map((produce) => (
                      <span key={produce} className="supported-tag-pill">{produce}</span>
                    ))}
                  </div>
                </details>
              </div>
              <img
                className="home-hero-image"
                src="/images/fresh_produce.jpg"
                alt="Fresh tomatoes, broccoli, peppers, and herbs"
                fetchPriority="high"
              />
            </div>

            <section className="home-tools" aria-labelledby="tools-heading">
              <div className="section-heading">
                <div>
                  <h2 id="tools-heading">Explore Food Verse</h2>
                  <p>Choose a tool to get started.</p>
                </div>
              </div>
              <div className="home-tools-grid">
                <button type="button" className="home-tool-card" onClick={() => setActiveTab('vision')}>
                  <Camera size={19} /><span><strong>Recognize</strong><small>Identify produce from a photo</small></span>
                </button>
                <button type="button" className="home-tool-card" onClick={() => setActiveTab('nutrition')}>
                  <Activity size={19} /><span><strong>Nutrition</strong><small>Explore a portion-based profile</small></span>
                </button>
                <button type="button" className="home-tool-card" onClick={() => setActiveTab('freshness')}>
                  <Apple size={19} /><span><strong>Freshness</strong><small>View a produce assessment</small></span>
                </button>
                <button type="button" className="home-tool-card" onClick={() => setActiveTab('chef')}>
                  <ChefHat size={19} /><span><strong>Recipes</strong><small>Find ideas from your ingredients</small></span>
                </button>
                <button type="button" className="home-tool-card" onClick={() => setActiveTab('hygiene')}>
                  <ShieldCheck size={19} /><span><strong>Hygiene audit</strong><small>Review submitted kitchen scores</small></span>
                </button>
                <button type="button" className="home-tool-card" onClick={() => setActiveTab('api')}>
                  <Server size={19} /><span><strong>API status</strong><small>Check service availability</small></span>
                </button>
              </div>
            </section>
          </section>
        )}

        {activeTab === 'vision' && (
          <section className="tab-panel-container">
            {/* Primary Produce Recognition Section */}
            <section className="glass-card upload-food-section" id="upload-food-section" aria-label="Upload Food Image">
              <div className="upload-section-header">
                <div className="upload-header-left">
                  <div className="upload-header-icon">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <h2 className="upload-section-title">Produce Image Recognition</h2>
                    <p className="upload-section-subtitle">
                      Upload or drag a produce photo to identify with MobileNetV3-Large neural model
                    </p>
                  </div>
                </div>
                <span className={`badge ${backendStatus.info?.vision_model_status?.startsWith('loaded') ? 'badge-emerald' : 'badge-amber'}`}>
                  {backendStatus.info?.vision_model_status?.startsWith('loaded')
                    ? 'Vision model ready'
                    : backendStatus.online
                      ? 'Vision model unavailable'
                      : 'Backend offline'}
                </span>
              </div>

              {/* Real HTML file input with accept="image/*" */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.bmp,.jfif,image/jpeg,image/png,image/webp,image/bmp"
                id="food-image-input"
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />

              {/* STATE 1: No image selected */}
              {!previewUrl ? (
                <button
                  type="button"
                  id="upload-dropzone"
                  className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-drop-icon">
                    <UploadCloud size={28} />
                  </div>
                  <div className="upload-drop-text">
                    Drag and drop your produce image here, or browse
                  </div>
                  <div className="upload-drop-subtext">
                    JPG, PNG, WEBP, BMP, JFIF · Maximum 10 MB
                  </div>
                  <span className="upload-choose-btn"><Upload size={16} /> Browse images</span>
                </button>
              ) : !uploadPrediction ? (
                /* STATE 2: Image selected & previewed (Before recognition) */
                <div className="upload-preview-card" id="upload-preview-card">
                  <div className="upload-preview-media">
                    <img
                      src={previewUrl}
                      alt={uploadedFile?.name || 'Selected food preview'}
                      className="upload-preview-img"
                      id="upload-preview-img"
                    />
                  </div>

                  <div className="upload-preview-meta">
                    <div className="upload-file-title" id="selected-file-name">
                      {uploadedFile?.name}
                    </div>

                    <div className="upload-file-specs">
                      <span className="upload-spec-pill" id="selected-file-size">
                        <FileText size={13} /> {formatFileSize(uploadedFile?.size)}
                      </span>
                      <span className="upload-spec-pill">
                        <ImageIcon size={13} /> {uploadedFile?.type || 'Image'}
                      </span>
                      <span className="badge badge-emerald">Ready for Recognition</span>
                    </div>

                    <div className="upload-actions-row">
                      <button
                        type="button"
                        id="analyze-food-btn"
                        className="btn-primary"
                        onClick={handleAnalyzeClick}
                        disabled={isAnalyzingUpload}
                        title="Identify produce with MobileNetV3-Large neural model"
                      >
                        {isAnalyzingUpload ? (
                          <>
                            <RefreshCw size={16} className="spin-animation" /> Identifying Produce...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} /> Identify Produce
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        id="choose-image-btn"
                        className="btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isAnalyzingUpload}
                        title="Select a different image"
                      >
                        <Upload size={14} /> Change Image
                      </button>

                      <button
                        type="button"
                        id="remove-image-btn"
                        className="btn-danger-outline"
                        onClick={handleRemoveImage}
                        disabled={isAnalyzingUpload}
                        title="Remove selected image and clear preview"
                      >
                        <Trash2 size={16} /> Remove Image
                      </button>
                    </div>

                  </div>
                </div>
              ) : (
                /* STATE 3: Successful prediction (Split view on desktop) */
                <div className="prediction-split-layout">
                  {/* Left Column: Image Preview & Control Actions */}
                  <div className="prediction-image-pane" id="upload-preview-card">
                    <div className="prediction-image-wrapper">
                      <img
                        src={previewUrl}
                        alt={uploadedFile?.name || 'Selected produce preview'}
                        className="upload-preview-img"
                        id="upload-preview-img"
                      />
                    </div>

                    <div className="prediction-image-meta">
                      <div className="upload-file-title" id="selected-file-name">
                        {uploadedFile?.name}
                      </div>
                      <div className="upload-file-specs">
                        <span className="upload-spec-pill" id="selected-file-size">
                          <FileText size={13} /> {formatFileSize(uploadedFile?.size)}
                        </span>
                        <span className="badge badge-emerald">Identified</span>
                      </div>
                    </div>

                    <div className="upload-actions-row">
                      <button
                        type="button"
                        id="try-another-image-btn"
                        className="btn-primary"
                        onClick={handleRemoveImage}
                        title="Reset and analyze another produce image"
                      >
                        <RotateCcw size={15} /> Try Another Image
                      </button>

                      <button
                        type="button"
                        id="choose-image-btn"
                        className="btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        title="Select a different image"
                      >
                        <Upload size={14} /> Change Image
                      </button>

                      <button
                        type="button"
                        id="remove-image-btn"
                        className="btn-danger-outline"
                        onClick={handleRemoveImage}
                        title="Clear image"
                      >
                        <Trash2 size={14} /> Clear
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Prediction Results Card */}
                  <div className="upload-prediction-card animate-fade-in" id="upload-prediction-result" style={{ marginTop: 0 }}>
                    <div className="prediction-header-bar">
                      <div className="prediction-title-group">
                        <span className="badge badge-emerald">
                          <Sparkles size={12} /> Live MobileNetV3 Prediction
                        </span>
                        <h3 className="prediction-dish-name" id="predicted-class-name">
                          {uploadPrediction.display_name}
                        </h3>
                        <span className="prediction-category-tag">
                          {[uploadPrediction.nutrition_profile?.category, uploadPrediction.nutrition_profile?.cuisine].filter(Boolean).join(' · ')}
                        </span>
                      </div>

                      <div className="prediction-metrics-group">
                        <div className="confidence-pill-wrapper">
                          <span className="confidence-value-pill" id="predicted-confidence-pill">
                            <Award size={14} /> {uploadPrediction.model_confidence_pct}% Confidence
                          </span>
                          <span className="confidence-note-disclaimer">
                            Model confidence is not a guarantee of correctness.
                          </span>
                        </div>
                        {uploadPrediction.inference_latency_ms != null && (
                          <div className="latency-badge">
                            <Zap size={13} /> {uploadPrediction.inference_latency_ms} ms CPU latency
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Conservative Heuristic Uncertainty Advisory */}
                    {uploadPrediction.advisory?.triggered && (
                      <div className="prediction-heuristic-advisory animate-fade-in" id="prediction-heuristic-advisory">
                        <AlertCircle size={18} color="var(--accent-amber)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div className="heuristic-advisory-content">
                          <div className="heuristic-advisory-tag">
                            <span className="badge badge-amber">Heuristic Advisory</span>
                            <span className="heuristic-tag-text">{uploadPrediction.advisory.reason}</span>
                          </div>
                          <p className="heuristic-advisory-message">
                            {uploadPrediction.advisory.message}
                          </p>
                          <div className="heuristic-advisory-tip">
                            <strong>Recommendation:</strong> {uploadPrediction.advisory.recommendation}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Top-3 distribution breakdown */}
                    {uploadPrediction.top3_predictions && uploadPrediction.top3_predictions.length > 0 && (
                      <div className="top3-container" id="prediction-top3-distribution">
                        <div className="top3-title">
                          <TrendingUp size={14} /> Class Confidence Distribution (Top 3):
                        </div>
                        <div className="top3-bars-list">
                          {uploadPrediction.top3_predictions.map((item, idx) => (
                            <div key={idx} className="top3-bar-item">
                              <div className="top3-label-row">
                                <span className="top3-class-name">
                                  #{idx + 1} {item.display_name}
                                </span>
                                <span className="top3-pct">{item.confidence}%</span>
                              </div>
                              <div className="top3-progress-track">
                                <div
                                  className="top3-progress-fill"
                                  style={{
                                    width: `${Math.max(item.confidence, 1.5)}%`,
                                    background: idx === 0 ? 'var(--gradient-emerald)' : 'rgba(148, 163, 184, 0.45)',
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Nutritional & Freshness Intelligence Grid */}
                    {uploadPrediction.nutrition_profile && (
                      <div className="prediction-details-grid">
                        <div className="macro-chip">
                          <span className="macro-chip-label">Energy</span>
                          <span className="macro-chip-value">{uploadPrediction.nutrition_profile.calories} kcal</span>
                          <span className="macro-chip-sub">per 100g</span>
                        </div>
                        <div className="macro-chip">
                          <span className="macro-chip-label">Protein</span>
                          <span className="macro-chip-value">{uploadPrediction.nutrition_profile.protein_g}g</span>
                          <span className="macro-chip-sub">plant amino acids</span>
                        </div>
                        <div className="macro-chip">
                          <span className="macro-chip-label">Carbs</span>
                          <span className="macro-chip-value">{uploadPrediction.nutrition_profile.carbs_g}g</span>
                          <span className="macro-chip-sub">clean carbs</span>
                        </div>
                        <div className="macro-chip">
                          <span className="macro-chip-label">Dietary Fiber</span>
                          <span className="macro-chip-value">{uploadPrediction.nutrition_profile.fiber_g}g</span>
                          <span className="macro-chip-sub">digestive fiber</span>
                        </div>
                        <div className="macro-chip">
                          <span className="macro-chip-label">Freshness Index</span>
                          <span className="macro-chip-value" style={{ color: 'var(--accent-emerald)' }}>
                            {uploadPrediction.nutrition_profile.freshness_score}/100
                          </span>
                          <span className="macro-chip-sub">Grade {uploadPrediction.nutrition_profile.health_score}</span>
                        </div>
                      </div>
                    )}

                    {/* Culinary & Storage Advisory */}
                    {uploadPrediction.nutrition_profile?.chef_note && (
                      <div className="prediction-chef-advisory">
                        <div className="chef-advisory-title">
                          <ChefHat size={14} color="#166534" /> Culinary & Storage Advisory
                        </div>
                        <p className="chef-advisory-text">
                          {uploadPrediction.nutrition_profile.chef_note}
                        </p>
                        <div className="shelf-life-note">
                          <Clock size={13} /> {uploadPrediction.nutrition_profile.shelf_life_note}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Validation / Network Error Banner with Retry */}
              {uploadError && (
                <div className="upload-error-banner animate-fade-in" id="upload-error-banner">
                  <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <span>{uploadError}</span>
                    {uploadedFile && (
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '4px 12px', background: '#ffffff' }}
                        onClick={handleAnalyzeClick}
                        disabled={isAnalyzingUpload}
                      >
                        <RefreshCw size={13} className={isAnalyzingUpload ? 'spin-animation' : ''} /> Retry Recognition
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Reference Samples & Demo Explorer (Preserved & Accessible, Non-competing) */}
            <section className="demo-section-wrapper" aria-label="Explore Reference Samples">
              <div className="section-heading">
                <div>
                  <h2>Reference images</h2>
                  <p>These images are for browsing only; they are not analyzed or scored.</p>
                </div>
                <Layers size={19} aria-hidden="true" />
              </div>

              <div className="sample-presets-container">
                <div className="sample-grid">
                  {PRESET_DISHES.map((dish) => (
                    <button
                      type="button"
                      key={dish.id}
                      id={`preset-${dish.id}`}
                      className={`sample-card ${selectedDishId === dish.id ? 'active' : ''}`}
                      aria-pressed={selectedDishId === dish.id}
                      onClick={() => handleSelectDish(dish.id)}
                    >
                      <img src={dish.image} alt={dish.name} className="sample-thumbnail" />
                      <div className="sample-card-info">
                        <strong>{dish.name}</strong>
                        <small>{dish.subtitle}</small>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="reference-image-card">
                <img src={currentDish.image} alt={currentDish.name} className="preview-image" />
                <p><strong>{currentDish.name}</strong> <span>Reference image</span></p>
              </div>
            </section>
          </section>
        )}

        {/* TAB 2: FRESHNESS & SHELF LIFE */}
        {activeTab === 'freshness' && (
          <section className="tab-panel-container">
            <div className="dashboard-grid">
              <div className="glass-card details-panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">About freshness estimates</h2>
                    <p className="panel-description">Use the result as general guidance, not a safety guarantee.</p>
                  </div>
                  <Info size={20} aria-hidden="true" />
                </div>
                <p className="assessment-note">
                  This assessment uses a name and a selected storage type. It does not inspect a photo, measure
                  the food, or detect spoilage. Check the food directly and follow local food-safety guidance.
                </p>
                {freshnessResult?.storage_protocol && (
                  <div className="chef-quote-card">
                    <strong>Storage recommendation</strong>
                    <p>{freshnessResult.storage_protocol}</p>
                  </div>
                )}
              </div>

              <div className="glass-card details-panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Freshness assessment</h2>
                    <p className="panel-description">Enter a food or produce name for an estimate.</p>
                  </div>
                  <span className="badge badge-emerald">Service estimate</span>
                </div>

                <form
                  className="interactive-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleAnalyzeFreshness();
                  }}
                >
                  <div className="form-group">
                    <label className="form-label" htmlFor="freshness-item-input">Food or produce</label>
                    <input
                      id="freshness-item-input"
                      type="text"
                      className="form-input"
                      value={freshnessItem}
                      onChange={(e) => setFreshnessItem(e.target.value)}
                      placeholder="e.g. Atlantic Salmon, Ripe Strawberries, Spinach"
                    />
                  </div>

                  <button
                    type="submit"
                    id="analyze-freshness-btn"
                    className="btn-primary"
                    disabled={loadingFreshness || !freshnessItem.trim()}
                  >
                    {loadingFreshness ? <RefreshCw size={16} className="spin-animation" /> : <Apple size={16} />}
                    {loadingFreshness ? 'Checking estimate…' : 'Check freshness'}
                  </button>
                </form>

                {freshnessError && (
                  <div className="upload-error-banner" role="alert">
                    <AlertCircle size={17} aria-hidden="true" /> {freshnessError}
                  </div>
                )}
                {loadingFreshness && <p className="empty-state" aria-live="polite">Loading freshness estimate…</p>}
                {freshnessResult && (
                  <div className="feature-results">
                    <div className="panel-header">
                      <h3 className="panel-title">Estimate for {freshnessResult.item_name}</h3>
                      <span className="badge badge-emerald">{freshnessResult.grade}</span>
                    </div>
                    <div className="macro-grid">
                      <div className="macro-box">
                        <div className="macro-num">{freshnessResult.freshness_index}/100</div>
                        <div className="macro-label">Estimated freshness score</div>
                      </div>
                      <div className="macro-box">
                        <div className="macro-num">{freshnessResult.estimated_shelf_life_days} Days</div>
                        <div className="macro-label">Estimated shelf life</div>
                      </div>
                    </div>
                    <h3 className="preset-title-label">Indicators returned by the service</h3>
                    <ul className="result-list">
                      {(freshnessResult.visual_indicators || []).map((ind) => (
                        <li key={ind}>{ind}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'nutrition' && (
          <section className="tab-panel-container">
            <div className="dashboard-grid">
              <div className="glass-card vision-showcase-box">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Nutrition profile</h2>
                    <p className="panel-description">Choose a reference item and serving size.</p>
                  </div>
                  <span className="badge badge-emerald">Service estimates</span>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="nutrition-food-name">Reference food</label>
                  <select
                    id="nutrition-food-name"
                    className="form-input"
                    value={selectedDishId}
                    onChange={(event) => {
                      setSelectedDishId(event.target.value);
                      setNutritionResult(null);
                      setNutritionError('');
                    }}
                  >
                    {PRESET_DISHES.map((dish) => (
                      <option key={dish.id} value={dish.id}>{dish.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <div className="range-label-row">
                    <label className="form-label" htmlFor="portion-slider">Serving size</label>
                    <strong>{portionGrams} g</strong>
                  </div>
                  <input
                    id="portion-slider"
                    type="range"
                    min="50"
                    max="500"
                    step="25"
                    value={portionGrams}
                    onChange={(event) => {
                      setPortionGrams(Number(event.target.value));
                      setNutritionResult(null);
                      setNutritionError('');
                    }}
                  />
                  <div className="range-label-row"><span>50 g</span><span>500 g</span></div>
                </div>
                <p className="assessment-note">
                  Nutrition values are estimates returned by the existing service, not laboratory measurements.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAnalyzeNutrition}
                  disabled={loadingNutrition}
                >
                  {loadingNutrition && <RefreshCw size={16} className="spin-animation" />}
                  {loadingNutrition ? 'Loading profile…' : 'Load nutrition profile'}
                </button>
              </div>

              <div className="glass-card details-panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">{nutritionResult?.food_name || 'Nutrition details'}</h2>
                    <p className="panel-description">
                      {nutritionResult ? `Per ${nutritionResult.portion_grams} g serving` : 'Load a profile to see the service response.'}
                    </p>
                  </div>
                  <Activity size={20} aria-hidden="true" />
                </div>
                {nutritionError && (
                  <div className="upload-error-banner" role="alert">
                    <AlertCircle size={17} aria-hidden="true" /> {nutritionError}
                  </div>
                )}
                {nutritionResult?.nutrition ? (
                  <div className="feature-results">
                    <div className="nutrition-results-grid">
                      <div className="macro-box"><div className="macro-num">{nutritionResult.nutrition.calories}</div><div className="macro-label">Calories (kcal)</div></div>
                      <div className="macro-box"><div className="macro-num">{nutritionResult.nutrition.protein_g} g</div><div className="macro-label">Protein</div></div>
                      <div className="macro-box"><div className="macro-num">{nutritionResult.nutrition.carbs_g} g</div><div className="macro-label">Carbohydrates</div></div>
                      <div className="macro-box"><div className="macro-num">{nutritionResult.nutrition.fat_g} g</div><div className="macro-label">Fat</div></div>
                      <div className="macro-box"><div className="macro-num">{nutritionResult.nutrition.fiber_g} g</div><div className="macro-label">Fiber</div></div>
                      <div className="macro-box"><div className="macro-num">{nutritionResult.nutrition.sugar_g} g</div><div className="macro-label">Sugar</div></div>
                      <div className="macro-box"><div className="macro-num">{nutritionResult.nutrition.sodium_mg} mg</div><div className="macro-label">Sodium</div></div>
                      <div className="macro-box"><div className="macro-num">{nutritionResult.nutrition.potassium_mg} mg</div><div className="macro-label">Potassium</div></div>
                    </div>
                    {nutritionResult.nutrition.glycemic_index && (
                      <p className="result-detail">
                        <strong>Glycemic index:</strong> {nutritionResult.nutrition.glycemic_index}
                      </p>
                    )}
                    {nutritionResult.nutrition.allergens?.length > 0 && (
                      <p className="result-detail">
                        <strong>Allergens returned by the service:</strong> {nutritionResult.nutrition.allergens.join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  !nutritionError && (
                    <p className="empty-state" aria-live="polite">
                      {loadingNutrition ? 'Loading nutrition profile…' : 'Your requested nutrition profile will appear here.'}
                    </p>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: SMART CHEF ASSISTANT */}
        {activeTab === 'chef' && (
          <section className="tab-panel-container">
            <div className="dashboard-grid">
              {/* Left Column: Pantry Inputs */}
              <div className="glass-card vision-showcase-box">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Recipe assistant</h2>
                    <p className="panel-description">Add ingredients and choose a dietary preference.</p>
                  </div>
                  <ChefHat size={21} aria-hidden="true" />
                </div>

                <form onSubmit={handleAddIngredient} className="ingredient-form">
                  <input
                    id="ingredient-input"
                    type="text"
                    className="form-input"
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    aria-label="Add an ingredient"
                    placeholder="Add ingredient (e.g. Avocado, Quinoa, Salmon)..."
                  />
                  <button type="submit" className="btn-secondary">
                    Add
                  </button>
                </form>

                {/* Ingredients Pill Cloud */}
                <div>
                  <div className="preset-title-label">Ingredients ({pantryIngredients.length})</div>
                  {pantryIngredients.length > 0 ? (
                    <div className="ingredients-list">
                      {pantryIngredients.map((ing) => (
                        <button
                          key={ing}
                          type="button"
                          className="ingredient-chip"
                          onClick={() => handleRemoveIngredient(ing)}
                          aria-label={`Remove ${ing}`}
                          title={`Remove ${ing}`}
                        >
                          {ing} <span aria-hidden="true">×</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">Add the ingredients you have on hand.</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="dietary-select">Dietary preference</label>
                  <select
                    id="dietary-select"
                    className="form-input"
                    value={dietaryChoice}
                    onChange={(e) => setDietaryChoice(e.target.value)}
                  >
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="High-Protein">High-Protein Fitness</option>
                    <option value="Keto">Keto / Low-Carb</option>
                    <option value="Vegan">Vegan Wholefood</option>
                    <option value="Mediterranean">Mediterranean Heart-Healthy</option>
                  </select>
                </div>

                <button
                  id="generate-recipe-btn"
                  type="button"
                  className="btn-primary"
                  onClick={handleGenerateRecipe}
                  disabled={generatingRecipe || pantryIngredients.length === 0}
                >
                  {generatingRecipe ? <RefreshCw size={16} className="spin-animation" /> : <Sparkles size={16} />}
                  {generatingRecipe ? 'Getting recipe…' : 'Find a recipe'}
                </button>
              </div>

              {/* Right Column: Generated Culinary Recipe */}
              <div className="glass-card details-panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">{generatedRecipe?.recipe_title || 'Recipe'}</h2>
                    <p className="panel-description">Recipes returned by the existing service.</p>
                  </div>
                  {generatedRecipe?.difficulty && <span className="badge badge-emerald">{generatedRecipe.difficulty}</span>}
                </div>

                {recipeError && (
                  <div className="upload-error-banner" role="alert">
                    <AlertCircle size={17} aria-hidden="true" /> {recipeError}
                  </div>
                )}
                {generatedRecipe ? (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="meta-pill-row">
                      <span className="badge badge-emerald">Prep: {generatedRecipe.prep_time}</span>
                      <span className="badge badge-cyan">Cook: {generatedRecipe.cook_time}</span>
                      <span className="badge badge-amber">{generatedRecipe.calories_est} Calories</span>
                    </div>

                    <div className="preset-title-label">Step-by-Step Cooking Technique</div>
                    <div className="recipe-steps-list">
                      {generatedRecipe.steps.map((step, idx) => (
                        <div key={idx} className="step-card">
                          <div className="step-number">{idx + 1}</div>
                          <div className="step-text">{step}</div>
                        </div>
                      ))}
                    </div>

                    <div className="chef-quote-card">
                      <strong>Executive Chef Secret:</strong> {generatedRecipe.pro_tip}
                    </div>
                  </div>
                ) : (
                  !recipeError && (
                    <p className="empty-state" aria-live="polite">
                      {generatingRecipe ? 'Looking for a recipe…' : 'Add ingredients and request a recipe to see the service response here.'}
                    </p>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: HYGIENE & FOOD SAFETY AUDITOR */}
        {activeTab === 'hygiene' && (
          <section className="tab-panel-container">
            <div className="dashboard-grid">
              <div className="glass-card vision-showcase-box">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Kitchen self-assessment</h2>
                    <p className="panel-description">Enter your own scores for a service assessment.</p>
                  </div>
                  <ShieldCheck size={22} color="var(--accent-emerald)" />
                </div>

                <div className="interactive-form">
                  <div className="form-group">
                    <label className="form-label" htmlFor="facility-name">Kitchen or facility name (optional)</label>
                    <input
                      id="facility-name"
                      type="text"
                      className="form-input"
                      value={facilityName}
                      onChange={(event) => {
                        setFacilityName(event.target.value);
                        setAuditResult(null);
                        setAuditError('');
                      }}
                      placeholder="Enter a facility name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="inspection-zone">Inspection zone (optional)</label>
                    <input
                      id="inspection-zone"
                      type="text"
                      className="form-input"
                      value={inspectionZone}
                      onChange={(event) => {
                        setInspectionZone(event.target.value);
                        setAuditResult(null);
                        setAuditError('');
                      }}
                      placeholder="Enter a kitchen area"
                    />
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className="form-label" htmlFor="surface-score">Surface cleanliness score</label>
                      <strong style={{ color: 'var(--accent-emerald)' }}>{surfaceScore == null ? '—' : `${surfaceScore}%`}</strong>
                    </div>
                    <input
                      id="surface-score"
                      className="form-input"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={surfaceScore ?? ''}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSurfaceScore(value === '' ? null : Number(value));
                        setAuditResult(null);
                        setAuditError('');
                      }}
                      placeholder="Enter a score (0–100)"
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className="form-label" htmlFor="temperature-score">Temperature control score</label>
                      <strong style={{ color: 'var(--accent-cyan)' }}>{tempScore == null ? '—' : `${tempScore}%`}</strong>
                    </div>
                    <input
                      id="temperature-score"
                      className="form-input"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={tempScore ?? ''}
                      onChange={(event) => {
                        const value = event.target.value;
                        setTempScore(value === '' ? null : Number(value));
                        setAuditResult(null);
                        setAuditError('');
                      }}
                      placeholder="Enter a score (0–100)"
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label className="form-label" htmlFor="contamination-score">Cross-contamination prevention score</label>
                      <strong style={{ color: 'var(--accent-purple)' }}>{contaminationScore == null ? '—' : `${contaminationScore}%`}</strong>
                    </div>
                    <input
                      id="contamination-score"
                      className="form-input"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={contaminationScore ?? ''}
                      onChange={(event) => {
                        const value = event.target.value;
                        setContaminationScore(value === '' ? null : Number(value));
                        setAuditResult(null);
                        setAuditError('');
                      }}
                      placeholder="Enter a score (0–100)"
                    />
                  </div>

                  <p className="assessment-note">
                    Enter self-assessed scores from 0–100. This tool cannot measure conditions or perform an official inspection.
                  </p>
                  {auditError && (
                    <div className="upload-error-banner" role="alert">
                      <AlertCircle size={17} aria-hidden="true" /> {auditError}
                    </div>
                  )}
                  <button
                    id="run-audit-btn"
                    type="button"
                    className="btn-primary"
                    onClick={handleRunAudit}
                    disabled={runningAudit}
                  >
                    {runningAudit && <RefreshCw size={16} className="spin-animation" />}
                    {runningAudit ? 'Checking assessment…' : 'Run self-assessment'}
                  </button>
                </div>
              </div>

              {/* Right Column: Audit Findings & Checklist */}
              <div className="glass-card details-panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Assessment results</h2>
                    <p className="panel-description">
                      {auditResult?.facility ? `${auditResult.facility} · ${auditResult.zone}` : 'Results will appear after you submit your scores.'}
                    </p>
                  </div>
                  {auditResult && (
                    <span className="badge badge-emerald">
                      {auditResult.overall_hygiene_score}/100
                    </span>
                  )}
                </div>

                {auditResult ? (
                  <div className="feature-results">
                    {auditResult.certification_grade && <p className="result-detail"><strong>Service assessment:</strong> {auditResult.certification_grade}</p>}
                    {Array.isArray(auditResult.inspection_checklist) && auditResult.inspection_checklist.length > 0 && (
                      <ul className="result-list">
                        {auditResult.inspection_checklist.map((item) => (
                          <li key={item.item}>
                            <strong>{item.item}</strong>{' '}
                            {item.status && <span>· {item.status}</span>}
                            {item.value && <span>· {item.value}</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {auditResult.ai_recommendation && (
                      <p className="result-detail"><strong>Recommendation:</strong> {auditResult.ai_recommendation}</p>
                    )}
                    <p className="assessment-note">This is an automated estimate based on self-reported scores, not a regulatory inspection.</p>
                  </div>
                ) : (
                  !auditError && !runningAudit && (
                    <p className="empty-state">Your submitted-score assessment will appear here.</p>
                  )
                )}
              </div>
            </div>
          </section>
        )}

        {/* TAB 6: BACKEND API HEALTH & DIAGNOSTICS */}
        {activeTab === 'api' && (
          <section className="tab-panel-container">
            <div className="glass-card vision-showcase-box" style={{ marginBottom: '2rem' }}>
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Backend health & endpoints</h2>
                          <p className="panel-description">
                            Check the FastAPI service and its available routes.
                  </p>
                </div>
                <button
                  id="run-diagnostics-btn"
                  className="btn-primary"
                  onClick={handleRunDiagnostics}
                  disabled={runningDiag}
                >
                  {runningDiag ? <RefreshCw size={16} className="spin-animation" /> : <Zap size={16} />}
                  {runningDiag ? 'Testing endpoints…' : 'Test endpoints'}
                </button>
              </div>

              <div className="macro-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="macro-box">
                  <div className="macro-num" style={{ color: backendStatus.online ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                    {backendStatus.online ? 'ONLINE' : 'STANDBY'}
                  </div>
                  <div className="macro-label">FastAPI Status</div>
                </div>
                <div className="macro-box">
                  <div className="macro-num">{backendStatus.ping != null ? `${backendStatus.ping} ms` : '—'}</div>
                  <div className="macro-label">Response Latency</div>
                </div>
                <div className="macro-box">
                  <div className="macro-num">{backendStatus.info?.vision_model_status?.startsWith('loaded') ? 'Ready' : '—'}</div>
                  <div className="macro-label">Vision model</div>
                </div>
                <div className="macro-box">
                  <div className="macro-num">{backendStatus.info?.uptime || '—'}</div>
                  <div className="macro-label">Service uptime</div>
                </div>
              </div>

              {/* API Endpoints Catalog */}
              <div className="preset-title-label">Available OpenAPI Endpoints</div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-get">GET</span>
                  <span className="endpoint-path">/api/health</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time service health check</span>
              </div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-get">GET</span>
                  <span className="endpoint-path">/api/</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Metadata & phase capability info</span>
              </div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-post">POST</span>
                  <span className="endpoint-path">/api/recognize</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Preset dish response</span>
              </div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-post">POST</span>
                  <span className="endpoint-path">/api/freshness</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Name-based freshness and storage estimate</span>
              </div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-post">POST</span>
                  <span className="endpoint-path">/api/nutrition</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Portion-based nutrition estimate</span>
              </div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-post">POST</span>
                  <span className="endpoint-path">/api/cooking-assistant</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Recipe assistant</span>
              </div>

              <div className="api-spec-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="method-badge method-post">POST</span>
                  <span className="endpoint-path">/api/hygiene-audit</span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Score-based hygiene assessment</span>
              </div>

              {/* Diagnostics Output */}
              {diagnosticsLog.length > 0 && (
                <div className="diagnostics-section">
                  <div className="preset-title-label">Live Test Execution Logs</div>
                  <div className="diagnostics-output" aria-live="polite">
                    {diagnosticsLog.map((log) => (
                      <div key={`${log.method}-${log.path}`} className="diagnostic-entry">
                        <span>
                          <strong className={log.success ? 'diagnostic-success' : 'diagnostic-failure'}>[{log.status}]</strong> {log.name} ({log.method} {log.path})
                        </span>
                        <span>{log.latency} ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div>
          <strong>Food Verse AI</strong> — Produce and nutrition tools
        </div>
        <div className="footer-tech">
          <span>FastAPI</span>
          <span>React</span>
          <span>Vite</span>
        </div>
      </footer>
    </div>
  );
}
