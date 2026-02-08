// ============================================================================
// FINANCE DASHBOARD - FORCED EMPTY DATA VERSION
// ============================================================================

// FORCE EMPTY INITIAL DATA
const FORCE_EMPTY_DATA = true;

// ============================================================================
// CONSTANTS & UTILITIES
// ============================================================================

const MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
const CURRENT_YEAR = 2026;

const getMonthlyBudget = (category, month) => {
  return category.monthlyBudgets?.[month] ?? category.defaultBudget ?? 0;
};

const getCategoryById = (categories, categoryId) => {
  return categories.find(c => c.id === categoryId);
};

// ============================================================================
// BILLING PERIOD UTILITIES (V2.6 - KSIĘGOWO POPRAWNE, ZERO PODWÓJNEGO LICZENIA)
// ============================================================================

/**
 * 1️⃣ CRITICAL: Normalizacja daty do midnight UTC-safe
 * Eliminuje problemy ze strefami czasowymi
 */
const normalizeDate = (dateInput) => {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Całkowita liczba dni w okresie (INCLUSIVE obu końców)
 * Przykład: 2026-01-01 do 2026-01-31 = 31 dni
 * Formula: (end - start) / MS_PER_DAY + 1
 */
const getTotalBillingDays = (startDate, endDate) => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  const diffMs = end - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 bo inclusive
};

/**
 * Upłynęło dni (INCLUSIVE dzisiejszego dnia)
 * Przykład: Start 2026-01-01, dziś 2026-01-10 = 10 dni
 * Formula: (today - start) / MS_PER_DAY + 1
 * 
 * KSIĘGOWA ZASADA: Dzień dzisiejszy to PEŁNY dzień upłynięty
 */
const getElapsedBillingDays = (startDate, endDate) => {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  const today = normalizeDate(new Date());
  
  if (today < start) return 0;
  
  const effectiveToday = today > end ? end : today;
  const diffMs = effectiveToday - start;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 bo inclusive dzisiejszego
};

/**
 * FIX: Pozostało dni (INCLUSIVE dzisiejszego dnia!)
 * 
 * Przykład: Dziś 2026-02-01, koniec 2026-02-10
 * - Dni pozostałe: 1,2,3,4,5,6,7,8,9,10 = 10 dni
 * 
 * WYMAGANIE BIZNESOWE:
 * - Dzień dzisiejszy LICZY SIĘ jako pozostały
 * - Ostatni dzień okresu = 1 (nie 0)
 * 
 * Formula: (end - today) / MS_PER_DAY + 1
 */
const getRemainingBillingDays = (endDate) => {
  const end = normalizeDate(endDate);
  const today = normalizeDate(new Date());
  
  if (today > end) return 0; // Okres zakończony
  
  const diffMs = end - today;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1; // FIX: +1 bo today się liczy jako pozostały!
};

/**
 * Status okresu
 */
const getBillingPeriodStatus = (endDate) => {
  const remaining = getRemainingBillingDays(endDate);
  
  if (remaining === 0) return 'closed';
  if (remaining === 1) return 'lastDay';
  return 'active';
};

// ============================================================================
// FIX: THEME & LANGUAGE HOOKS
// ============================================================================

// FIX: Minimal translations object
const translations = {
  pl: {
    // Core
    settings: 'Ustawienia Aplikacji',
    language: 'Język',
    theme: 'Motyw',
    darkMode: 'Ciemny',
    lightMode: 'Jasny',
    selectLanguage: 'Wybierz język interfejsu aplikacji',
    selectTheme: 'Wybierz schemat kolorów aplikacji',
    categoryManagementMoved: 'Zarządzanie kategoriami budżetowymi zostało przeniesione do osobnej zakładki',
    dashboard: 'Dashboard',
    currentPeriod: 'Bieżący Okres',
    transactions: 'Transakcje',
    goals: 'Cele',
    categories: 'Kategorie',
    add: 'Dodaj',
    save: 'Zapisz',
    delete: 'Usuń',
    edit: 'Edytuj',
    cancel: 'Anuluj',
    confirm: 'Potwierdź',
    close: 'Zamknij',
    undo: 'Cofnij',
    archive: 'Archiwizuj',
    selectIcon: 'Wybierz ikonę',
    periodBalance: 'Bilans okresu',
    daysRemaining: 'Dni pozostałe',
    budgetPercent: '% Budżetu',
    avgDailyExpense: 'Śr. dzienny wydatek',
    income: 'Przychody',
    expenses: 'Wydatki',
    balance: 'Bilans',
    projection: 'Prognoza',
    avgBalance: 'Śr. bilans',
    spent: 'Wydano (PLN)',
    budgetUtilization: 'Wykorzystanie budżetu',
    safeDailySpend: 'Bezpieczny dzienny wydatek do końca okresu',
    billingPeriod: 'Okres rozliczeniowy',
    active: 'Aktywny',
    lastDay: 'Ostatni dzień',
    closed: 'Zamknięty',
    periodEnd: 'Data końca okresu',
    closePeriod: 'Zamknij okres i rozpocznij nowy',
    periodClosed: 'Okres jest zamknięty (read-only)',
    periodClosedDesc: 'Ten okres rozliczeniowy został zamknięty. Aby dodać nowe transakcje, rozpocznij nowy okres.',
    startNewPeriod: 'Rozpocznij nowy okres',
    elapsed: 'upłynęło',
    remaining: 'pozostało',
    totalDays: 'dni okresu',
    description: 'Opis',
    amount: 'Kwota',
    category: 'Kategoria',
    goal: 'Cel',
    categoryName: 'Nazwa kategorii',
    goalName: 'Nazwa celu',
    targetAmount: 'Kwota docelowa',
    defaultBudget: 'Domyślny budżet',
    date: 'Data',
    type: 'Typ',
    priority: 'Priorytet',
    categoryType: 'Typ kategorii',
    fixed: 'Stały',
    variable: 'Zmienny',
    addTransaction: 'Dodaj transakcję',
    expense: 'Wydatek',
    incomeLabel: 'Przychód',
    depositToGoal: 'Wpłata na cel',
    withdrawFromGoal: 'Wypłata z celu',
    allTransactions: 'Wszystkie transakcje',
    noTransactions: 'Brak transakcji w tym okresie',
    activeGoals: 'Aktywne cele',
    archivedGoals: 'Cele zarchiwizowane',
    addGoal: 'Dodaj cel',
    goalProgress: 'Postęp',
    current: 'Zebrano',
    target: 'Cel',
    availableForWithdrawal: 'Dostępne do wypłaty',
    noGoals: 'Brak aktywnych celów',
    noArchivedGoals: 'Brak zarchiwizowanych celów',
    budgetPerCategory: 'Budżet per Kategoria',
    addCategory: 'Dodaj kategorię',
    monthlyBudget: 'Budżet miesięczny',
    remainingBudget: 'Pozostało',
    budgetExceeded: 'Przekroczono budżet o',
    reorderCategories: 'Zmień kolejność kategorii',
    moveUp: 'Przesuń w górę',
    moveDown: 'Przesuń w dół',
    warnings: 'Ostrzeżenia',
    smartInsights: 'Inteligentne Podpowiedzi',
    negativeBalance: 'W tym okresie wydałeś więcej niż zarobiłeś',
    budgetExceededWarning: 'Przy obecnym tempie wydatków przekroczysz budżet',
    budgetExceededIn: 'Przy obecnym tempie wydatków przekroczysz budżet za',
    days: 'dni',
    highestExpense: 'Największy wydatek w okresie',
    expensesHigher: 'Wydatki wyższe o',
    expensesLower: 'Wydatki niższe o',
    vsPrevious: 'vs poprzedni okres',
    deleteGoal: 'Usuń cel',
    deleteGoalConfirm: 'Usunięcie celu usunie również wszystkie powiązane transakcje. Tej operacji nie można cofnąć. Czy na pewno chcesz kontynuować?',
    deleteTransaction: 'Usuń transakcję',
    deleteTransactionConfirm: 'Usunięcie tej transakcji zmieni bilans oraz postęp celów. Czy na pewno chcesz kontynuować?',
    deleteCategory: 'Usuń kategorię',
    deleteCategoryConfirm: 'Czy na pewno chcesz archiwizować tę kategorię?',
    archiveGoal: 'Archiwizuj cel',
    archiveCategory: 'Archiwizuj kategorię',
    languageChanged: 'Język zmieniony na',
    themeChanged: 'Motyw zmieniony na',
    polish: 'Polski',
    english: 'English',
    orTypeEmoji: 'lub wpisz emoji',
    allTypes: 'Wszystkie typy',
    allCategories: 'Wszystkie kategorie',
    allGoals: 'Wszystkie cele',
    noGoal: 'Bez celu (normalny wydatek)',
    allMonths: 'Wszystkie miesiące',
    close: 'Zamknij',
    periodClosedNewStarted: 'Okres zamknięty. Rozpoczęto nowy okres.',
    avgIncome: 'Śr. przychody',
    avgExpenses: 'Śr. wydatki',
    avgBalanceLabel: 'Śr. bilans',
    monthly: 'miesięcznie',
    forLast: 'za ostatnie',
    months: 'mies.',
    period: 'Okres',
    // Errors & Validation
    cannotModifyClosed: 'Nie można modyfikować zamkniętego okresu',
    endDateRequired: 'Data końca nie może być pusta',
    endDateMustBeAfterStart: 'Data końca musi być późniejsza niż data początku',
    cannotAddToClosedPeriod: 'Nie można dodawać transakcji do zamkniętego okresu',
    cannotWithdrawMore: 'Nie można wypłacić więcej niż zgromadzono na celu',
    cannotModifyClosedTransaction: 'Nie można modyfikować transakcji z zamkniętego okresu',
    cannotDeleteClosedTransaction: 'Nie można usuwać transakcji z zamkniętego okresu',
    budgetWillBeExceeded: 'Przy obecnym tempie wydatków przekroczysz budżet.',
    spentMoreThanEarned: 'W tym okresie wydałeś więcej niż zarobiłeś.',
    goalsHeavySpending: 'Znaczna część wydatków trafia do celów – sprawdź bieżący bilans.',
    higher: 'wyższe',
    lower: 'niższe',
    transactionDeleted: 'Transakcja usunięta',
  },
  en: {
    // Core
    settings: 'Application Settings',
    language: 'Language',
    theme: 'Theme',
    darkMode: 'Dark',
    lightMode: 'Light',
    selectLanguage: 'Select application interface language',
    selectTheme: 'Select application color scheme',
    categoryManagementMoved: 'Budget category management has been moved to a separate tab',
    dashboard: 'Dashboard',
    currentPeriod: 'Current Period',
    transactions: 'Transactions',
    goals: 'Goals',
    categories: 'Categories',
    add: 'Add',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    undo: 'Undo',
    archive: 'Archive',
    selectIcon: 'Select icon',
    periodBalance: 'Period Balance',
    daysRemaining: 'Days Remaining',
    budgetPercent: '% of Budget',
    avgDailyExpense: 'Avg. Daily Expense',
    income: 'Income',
    expenses: 'Expenses',
    balance: 'Balance',
    projection: 'Projection',
    avgBalance: 'Avg. Balance',
    spent: 'Spent (PLN)',
    budgetUtilization: 'Budget Utilization',
    safeDailySpend: 'Safe daily spending until end of period',
    billingPeriod: 'Billing Period',
    active: 'Active',
    lastDay: 'Last Day',
    closed: 'Closed',
    periodEnd: 'Period end date',
    closePeriod: 'Close period and start new',
    periodClosed: 'Period is closed (read-only)',
    periodClosedDesc: 'This billing period has been closed. To add new transactions, start a new period.',
    startNewPeriod: 'Start new period',
    elapsed: 'elapsed',
    remaining: 'remaining',
    totalDays: 'period days',
    description: 'Description',
    amount: 'Amount',
    category: 'Category',
    goal: 'Goal',
    categoryName: 'Category Name',
    goalName: 'Goal Name',
    targetAmount: 'Target Amount',
    defaultBudget: 'Default Budget',
    date: 'Date',
    type: 'Type',
    priority: 'Priority',
    categoryType: 'Category Type',
    fixed: 'Fixed',
    variable: 'Variable',
    addTransaction: 'Add Transaction',
    expense: 'Expense',
    incomeLabel: 'Income',
    depositToGoal: 'Deposit to Goal',
    withdrawFromGoal: 'Withdraw from Goal',
    allTransactions: 'All Transactions',
    noTransactions: 'No transactions in this period',
    activeGoals: 'Active Goals',
    archivedGoals: 'Archived Goals',
    addGoal: 'Add Goal',
    goalProgress: 'Progress',
    current: 'Current',
    target: 'Target',
    availableForWithdrawal: 'Available for withdrawal',
    noGoals: 'No active goals',
    noArchivedGoals: 'No archived goals',
    budgetPerCategory: 'Budget per Category',
    addCategory: 'Add Category',
    monthlyBudget: 'Monthly Budget',
    remainingBudget: 'Remaining',
    budgetExceeded: 'Budget exceeded by',
    reorderCategories: 'Reorder categories',
    moveUp: 'Move up',
    moveDown: 'Move down',
    warnings: 'Warnings',
    smartInsights: 'Smart Insights',
    negativeBalance: 'You spent more than you earned this period',
    budgetExceededWarning: 'At current spending rate you will exceed budget',
    budgetExceededIn: 'At current spending rate you will exceed budget in',
    days: 'days',
    highestExpense: 'Highest expense in period',
    expensesHigher: 'Expenses higher by',
    expensesLower: 'Expenses lower by',
    vsPrevious: 'vs previous period',
    deleteGoal: 'Delete Goal',
    deleteGoalConfirm: 'Deleting this goal will also remove all associated transactions. This action cannot be undone. Are you sure you want to continue?',
    deleteTransaction: 'Delete Transaction',
    deleteTransactionConfirm: 'Deleting this transaction will affect balance and goal progress. Are you sure you want to continue?',
    deleteCategory: 'Delete Category',
    deleteCategoryConfirm: 'Are you sure you want to archive this category?',
    archiveGoal: 'Archive Goal',
    archiveCategory: 'Archive Category',
    languageChanged: 'Language changed to',
    themeChanged: 'Theme changed to',
    polish: 'Polski',
    english: 'English',
    orTypeEmoji: 'or type emoji',
    allTypes: 'All types',
    allCategories: 'All categories',
    allGoals: 'All goals',
    noGoal: 'No goal (normal expense)',
    allMonths: 'All months',
    close: 'Close',
    periodClosedNewStarted: 'Period closed. New period started.',
    avgIncome: 'Avg. Income',
    avgExpenses: 'Avg. Expenses',
    avgBalanceLabel: 'Avg. Balance',
    monthly: 'monthly',
    forLast: 'for last',
    months: 'months',
    period: 'Period',
    // Errors & Validation
    cannotModifyClosed: 'Cannot modify closed period',
    endDateRequired: 'End date cannot be empty',
    endDateMustBeAfterStart: 'End date must be later than start date',
    cannotAddToClosedPeriod: 'Cannot add transactions to closed period',
    cannotWithdrawMore: 'Cannot withdraw more than accumulated in goal',
    cannotModifyClosedTransaction: 'Cannot modify transaction from closed period',
    cannotDeleteClosedTransaction: 'Cannot delete transaction from closed period',
    budgetWillBeExceeded: 'At current spending rate you will exceed budget.',
    spentMoreThanEarned: 'You spent more than you earned this period.',
    goalsHeavySpending: 'Significant portion of expenses goes to goals – check balance.',
    selectIcon: 'Select icon',
    lower: 'lower',
    transactionDeleted: 'Transaction deleted',
  }
};

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
});

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('finance-theme') || 'dark';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Sync to localStorage
    localStorage.setItem('finance-theme', theme);
    
    // Set class on <html>
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================================
// LANGUAGE CONTEXT & PROVIDER
// ============================================================================

const LanguageContext = createContext({
  language: 'pl',
  setLanguage: () => {},
  t: (key) => key,
});

const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === 'undefined') return 'pl';
    return localStorage.getItem('finance-language') || 'pl';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('finance-language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const setLanguage = (lang) => {
    if (lang === 'pl' || lang === 'en') {
      setLanguageState(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// ============================================================================
// SHARED COMPONENTS (MODAL, TOAST)
// ============================================================================

/**
 * 3️⃣ Icon Picker Component
 * Predefined emoji set for categories with manual input fallback
 */
const IconPicker = ({ value, onChange, className = "", t = (k) => k }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [customIcon, setCustomIcon] = useState(value || '');

  const predefinedIcons = [
    '🏠', '🍔', '🚗', '💡', '🎮', '🏥', '📚', '✈️',
    '🍽️', '⛽', '🏦', '💰', '📱', '👔', '🎬', '🏋️',
    '🐕', '🎨', '🎵', '☕', '🍕', '🛒', '💊', '🚌',
  ];

  const handleIconSelect = (icon) => {
    onChange(icon);
    setCustomIcon(icon);
    setShowPicker(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className={`text-3xl w-14 h-14 flex items-center justify-center bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors ${className}`}
          title={t("selectIcon")}
        >
          {value || '❓'}
        </button>
        <input
          type="text"
          value={customIcon}
          onChange={(e) => {
            setCustomIcon(e.target.value);
            onChange(e.target.value);
          }}
          placeholder={t("orTypeEmoji")}
          className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
          maxLength={2}
        />
      </div>

      {showPicker && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 shadow-2xl z-50 grid grid-cols-8 gap-2">
          {predefinedIcons.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => handleIconSelect(icon)}
              className="text-2xl w-10 h-10 flex items-center justify-center hover:bg-slate-200 dark:bg-slate-700 rounded-lg transition-colors"
            >
              {icon}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowPicker(false)}
            className="col-span-8 mt-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white"
          >
            {t("close")}
          </button>
        </div>
      )}
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, t = (k) => k, confirmColor = 'rose' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
        <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 ${
              confirmColor === 'rose' ? 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600' :
              'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600'
            } text-white font-semibold py-3 px-6 rounded-xl transition-all`}
          >
            {confirmText || t("confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ message, action, onAction, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-8 right-8 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl p-4 shadow-2xl flex items-center gap-4 z-50 animate-slide-up">
      <CheckCircle className="w-5 h-5 text-emerald-400" />
      <p className="text-slate-900 dark:text-white font-medium">{message}</p>
      {action && (
        <>
          <span className="text-slate-500 dark:text-slate-500">•</span>
          <button
            onClick={onAction}
            className="text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1"
          >
            <Undo2 className="w-4 h-4" />
            Cofnij
          </button>
        </>
      )}
      <button onClick={onClose} className="ml-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// ============================================================================
// FINANCE STORE (WITH SAFETY MECHANISMS)
// ============================================================================

const useFinanceStore = () => {
  const getDefaultBillingPeriod = () => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'active', // ETAP 5: active | closed
    };
  };

  const [billingPeriod, setBillingPeriodState] = useState(getDefaultBillingPeriod());
  const [lastDeletedItem, setLastDeletedItem] = useState(null);

  const [categories, setCategories] = useState([]);

  const [transactions, setTransactions] = useState([]);

  const [goals, setGoals] = useState([]);

  /**
   * ETAP 2: Ustawienie okresu rozliczeniowego z walidacją
   * - endDate nie może być < startDate
   * - endDate nie może być puste
   */
  const setBillingPeriod = (startDate, endDate) => {
    // ETAP 6: Zabronione gdy okres zamknięty
    if (billingPeriod.status === 'closed') {
      return { error: t('cannotModifyClosed') };
    }
    
    // Walidacja: endDate nie może być puste
    if (!endDate) {
      return { error: t('endDateRequired') };
    }
    
    // Walidacja: endDate >= startDate
    const start = normalizeDate(startDate);
    const end = normalizeDate(endDate);
    
    if (end < start) {
      return { error: 'Data końca nie może być wcześniejsza niż data startu' };
    }
    
    setBillingPeriodState({ ...billingPeriod, startDate, endDate });
    return { success: true };
  };

  /**
   * 2️⃣ KSIĘGOWY SNAPSHOT - Immutable record zamkniętego okresu
   * Przechowuje stan finansowy na moment zamknięcia
   */
  const [closedPeriods, setClosedPeriods] = useState([]);

  /**
   * 2️⃣ Zamknij obecny okres i rozpocznij nowy (KSIĘGOWO POPRAWNE)
   * 
   * AUDYTOWALNOŚĆ:
   * 1. Zapisz snapshot obecnego okresu (immutable)
   * 2. Oznacz okres jako closed
   * 3. Utwórz nowy okres
   * 4. ŻADNE stare transakcje nie wpływają na nowy okres
   * 
   * SNAPSHOT zawiera:
   * - Daty okresu
   * - Bilans końcowy
   * - Suma kategorii
   * - Timestamp zamknięcia
   */
  const closePeriodAndStartNew = () => {
    const periodTx = getTransactionsInPeriod();
    const budgetExpenses = periodTx.filter(tx => tx.type === 'expense');
    const budgetIncome = periodTx.filter(tx => tx.type === 'income' && !tx.goalId);
    
    const totalExpenses = budgetExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    const totalIncome = budgetIncome.reduce((sum, tx) => sum + tx.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    // Sumy per kategoria
    const periodStart = new Date(billingPeriod.startDate);
    const periodMonth = periodStart.getMonth();
    const categoryTotals = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      spent: budgetExpenses.filter(tx => tx.categoryId === cat.id).reduce((sum, tx) => sum + tx.amount, 0),
      budget: getMonthlyBudget(cat, periodMonth)
    }));
    
    // 1. Zapisz snapshot (IMMUTABLE)
    const snapshot = {
      id: closedPeriods.length + 1,
      startDate: billingPeriod.startDate,
      endDate: billingPeriod.endDate,
      closedAt: new Date().toISOString(),
      balance,
      totalExpenses,
      totalIncome,
      categoryTotals,
      transactionCount: periodTx.length,
    };
    
    setClosedPeriods([...closedPeriods, snapshot]);
    
    // 2. Oblicz daty nowego okresu
    const prevEnd = normalizeDate(billingPeriod.endDate);
    const newStart = new Date(prevEnd);
    newStart.setDate(newStart.getDate() + 1);
    
    const newEnd = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + 1);
    newEnd.setDate(0);
    
    // 3. Ustaw nowy okres (NOWY stan)
    setBillingPeriodState({
      startDate: newStart.toISOString().split('T')[0],
      endDate: newEnd.toISOString().split('T')[0],
      status: 'active',
    });
    
    return { success: true, snapshot };
  };

  // Category CRUD
  const addCategory = (category) => {
    const maxId = Math.max(0, ...categories.map(c => c.id));
    const maxOrder = Math.max(0, ...categories.map(c => c.order));
    setCategories([...categories, { ...category, id: maxId + 1, order: maxOrder + 1, isArchived: false }]);
  };

  const updateCategory = (id, updates) => {
    setCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const archiveCategory = (id) => {
    setCategories(categories.map(c => c.id === id ? { ...c, isArchived: true } : c));
  };

  const canArchiveCategory = (id) => {
    const hasTransactions = transactions.some(tx => tx.categoryId === id);
    return { allowed: true, hasTransactions };
  };

  const reorderCategory = (id, direction) => {
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) return;
    const newCategories = [...categories];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newCategories.length) return;
    [newCategories[idx], newCategories[targetIdx]] = [newCategories[targetIdx], newCategories[idx]];
    setCategories(newCategories.map((c, i) => ({ ...c, order: i + 1 })));
  };

  // Goal CRUD
  const addGoal = (goal) => {
    const maxId = Math.max(0, ...goals.map(g => g.id));
    setGoals([...goals, { ...goal, id: maxId + 1, status: 'active' }]);
  };

  const updateGoal = (id, updates) => {
    setGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  /**
   * ETAP 1: Archiwizacja celu (tylko ręczna)
   * - Cel znika z UI ale dane pozostają (read-only)
   */
  const archiveGoal = (id) => {
    setGoals(goals.map(g => g.id === id ? { ...g, status: 'archived' } : g));
  };

  const deleteGoal = (id) => {
    const goalTx = transactions.filter(tx => tx.goalId === id);
    setLastDeletedItem({ type: 'goal', data: goals.find(g => g.id === id), transactions: goalTx });
    setTransactions(transactions.filter(tx => tx.goalId !== id));
    setGoals(goals.filter(g => g.id !== id));
  };

  const getGoalCurrent = (goalId) => {
    const goalTransactions = transactions.filter(tx => tx.goalId === goalId);
    const deposits = goalTransactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    const withdrawals = goalTransactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    return deposits - withdrawals;
  };

  /**
   * 1️⃣ V2.7: Goals lifecycle with auto-archiving
   * - Po osiągnięciu target → status = 'completed'
   * - Completed goal → auto-archive (przenieś do archived)
   * - Archived goals: tylko wypłaty, widoczne w osobnej sekcji
   */
  const getEnrichedGoals = () => {
    return goals.map(goal => {
      const current = getGoalCurrent(goal.id);
      
      // Auto-complete gdy osiągnięto cel (ale tylko jeśli status to 'active')
      let status = goal.status;
      if (status === 'active' && current >= goal.target) {
        status = 'completed';
        // 1️⃣ Auto-archive completed goal
        setTimeout(() => {
          setGoals(prevGoals => 
            prevGoals.map(g => 
              g.id === goal.id && g.status === 'active' && current >= goal.target
                ? { ...g, status: 'archived' } // Changed from 'completed' to 'archived'
                : g
            )
          );
        }, 0);
      }
      
      return {
        ...goal,
        current,
        status: status === 'completed' ? 'archived' : status, // Ensure consistency
      };
    });
  };

  // Transaction CRUD with validation
  const validateTransaction = (tx) => {
    const errors = [];
    
    /**
     * ETAP 6: Zabronione operacje na zamkniętym okresie
     * Transakcja należy do okresu jeśli jej data mieści się w okresie
     */
    if (billingPeriod.status === 'closed') {
      const txDate = tx.date;
      if (txDate >= billingPeriod.startDate && txDate <= billingPeriod.endDate) {
        errors.push({
          field: 'period',
          message: 'Nie można dodawać transakcji do zamkniętego okresu. Rozpocznij nowy okres w zakładce "Bieżący Okres".',
          severity: 'error'
        });
      }
    }
    
    /**
     * 1️⃣ V2.7 KSIĘGOWA ZASADA: Archived goals
     * - Archived goal = tylko wypłaty
     * - Wpłaty (expense) są zablokowane
     * - Wypłaty (income) dozwolone do limitu salda
     */
    if (tx.type === 'expense' && tx.goalId) {
      const goal = goals.find(g => g.id === tx.goalId);
      if (goal && goal.status === 'archived') {
        errors.push({
          field: 'goalId',
          message: `Cel "${goal.name}" jest zarchiwizowany. Możliwe tylko wypłaty.`,
          severity: 'error'
        });
      }
    }
    
    // Goal withdrawal validation (for any goal)
    if (tx.goalId && tx.type === 'income') {
      const goalCurrent = getGoalCurrent(tx.goalId);
      if (tx.amount > goalCurrent) {
        errors.push({
          field: 'amount',
          message: t('cannotWithdrawMore'),
          severity: 'error'
        });
      }
    }
    
    return { valid: errors.length === 0, errors };
  };

  const addTransaction = (tx) => {
    const validation = validateTransaction(tx);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }
    
    const maxId = Math.max(0, ...transactions.map(t => t.id));
    setTransactions([...transactions, { ...tx, id: maxId + 1 }]);
    return { success: true };
  };

  const updateTransaction = (id, updates) => {
    const tx = transactions.find(t => t.id === id);
    
    /**
     * ETAP 6: Zabronione modyfikacje transakcji w zamkniętym okresie
     */
    if (billingPeriod.status === 'closed' && tx) {
      if (tx.date >= billingPeriod.startDate && tx.date <= billingPeriod.endDate) {
        return { error: 'Nie można modyfikować transakcji z zamkniętego okresu' };
      }
    }
    
    setTransactions(transactions.map(t => t.id === id ? { ...t, ...updates } : t));
    return { success: true };
  };

  const deleteTransaction = (id) => {
    const tx = transactions.find(t => t.id === id);
    
    /**
     * ETAP 6: Zabronione usuwanie transakcji z zamkniętego okresu
     */
    if (billingPeriod.status === 'closed' && tx) {
      if (tx.date >= billingPeriod.startDate && tx.date <= billingPeriod.endDate) {
        return { error: 'Nie można usuwać transakcji z zamkniętego okresu' };
      }
    }
    
    setLastDeletedItem({ type: 'transaction', data: tx });
    setTransactions(transactions.filter(t => t.id !== id));
    return { success: true };
  };

  const undoLastDelete = () => {
    if (!lastDeletedItem) return;
    
    if (lastDeletedItem.type === 'transaction') {
      setTransactions([...transactions, lastDeletedItem.data]);
    } else if (lastDeletedItem.type === 'goal') {
      setGoals([...goals, lastDeletedItem.data]);
      if (lastDeletedItem.transactions) {
        setTransactions([...transactions, ...lastDeletedItem.transactions]);
      }
    }
    
    setLastDeletedItem(null);
  };

  const getTransactionsInPeriod = () => {
    return transactions.filter(tx => {
      return tx.date >= billingPeriod.startDate && tx.date <= billingPeriod.endDate;
    });
  };

  const getInsights = () => {
    const periodTx = getTransactionsInPeriod();
    
    /**
     * ETAP 2: Wpłaty na cele MUSZĄ wpływać na okres
     * - Wszystkie expenses (nawet z goalId) liczą się do budżetu
     * - Wpływają na tempo dzienne, bilans, insighty
     */
    const budgetExpenses = periodTx.filter(tx => tx.type === 'expense'); // Usunięto !tx.goalId
    const budgetIncome = periodTx.filter(tx => tx.type === 'income' && !tx.goalId);
    
    const totalExpenses = budgetExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    const totalIncome = budgetIncome.reduce((sum, tx) => sum + tx.amount, 0);
    
    const periodStart = new Date(billingPeriod.startDate);
    const periodMonth = periodStart.getMonth();
    const totalBudget = categories.filter(c => !c.isArchived).reduce((sum, c) => sum + getMonthlyBudget(c, periodMonth), 0);
    
    const totalBillingDays = getTotalBillingDays(billingPeriod.startDate, billingPeriod.endDate);
    const elapsedDays = getElapsedBillingDays(billingPeriod.startDate, billingPeriod.endDate);
    const remainingDays = getRemainingBillingDays(billingPeriod.endDate);
    
    const avgDailyExpense = elapsedDays > 0 ? totalExpenses / elapsedDays : 0;
    const projectedExpenses = avgDailyExpense * totalBillingDays;
    const daysUntilBudgetExceeded = totalBudget > totalExpenses && avgDailyExpense > 0 
      ? Math.floor((totalBudget - totalExpenses) / avgDailyExpense) 
      : 0;

    const periodLength = totalBillingDays;
    const prevEndDate = new Date(billingPeriod.startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodLength + 1);
    
    const prevTx = transactions.filter(tx => {
      const txDate = tx.date;
      return txDate >= prevStartDate.toISOString().split('T')[0] && 
             txDate <= prevEndDate.toISOString().split('T')[0] &&
             tx.type === 'expense'; // Usunięto !tx.goalId - liczymy wszystkie wydatki
    });
    const prevExpenses = prevTx.reduce((sum, tx) => sum + tx.amount, 0);
    const expenseChange = prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses) * 100 : 0;

    const sortedExpenses = budgetExpenses.sort((a, b) => b.amount - a.amount);
    const highestExpense = sortedExpenses[0] || null;

    return {
      totalBillingDays,
      elapsedDays,
      remainingDays,
      daysUntilBudgetExceeded,
      projectedExpenses,
      avgDailyExpense,
      expenseChange,
      highestExpense,
      isOnTrack: projectedExpenses <= totalBudget,
    };
  };

  // Smart warnings
  const getWarnings = () => {
    const warnings = [];
    const periodTx = getTransactionsInPeriod();
    
    /**
     * ETAP 2: Wszystkie wydatki (z goalId i bez) wpływają na bilans i warnings
     */
    const allExpenses = periodTx.filter(tx => tx.type === 'expense');
    const budgetIncome = periodTx.filter(tx => tx.type === 'income' && !tx.goalId);
    const goalExpenses = periodTx.filter(tx => tx.type === 'expense' && tx.goalId);
    
    const totalExpenses = allExpenses.reduce((sum, tx) => sum + tx.amount, 0); // WSZYSTKIE wydatki
    const totalIncome = budgetIncome.reduce((sum, tx) => sum + tx.amount, 0);
    const totalGoalDeposits = goalExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    const balance = totalIncome - totalExpenses; // Balance uwzględnia cele!
    
    const periodStart = new Date(billingPeriod.startDate);
    const periodMonth = periodStart.getMonth();
    const totalBudget = categories.filter(c => !c.isArchived).reduce((sum, c) => sum + getMonthlyBudget(c, periodMonth), 0);
    const remainingBudget = totalBudget - totalExpenses;
    const remainingDays = getRemainingBillingDays(billingPeriod.endDate);
    const safeDailySpend = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    
    const insights = getInsights();
    const avgDailyExpense = insights.avgDailyExpense;
    
    // Warning 1: Unsafe spending pace
    if (remainingDays > 0 && safeDailySpend < avgDailyExpense) {
      warnings.push({
        id: 'unsafe-pace',
        severity: 'warning',
        message: t('budgetWillBeExceeded')
      });
    }
    
    // Warning 2: Negative balance
    if (balance < 0) {
      warnings.push({
        id: 'negative-balance',
        severity: 'danger',
        message: t('spentMoreThanEarned')
      });
    }
    
    // Warning 3: Goals draining balance
    const goalShare = totalExpenses > 0 ? (totalGoalDeposits / totalExpenses) * 100 : 0;
    if (goalShare > 30 && (balance < 500 || balance < 0)) {
      warnings.push({
        id: 'goals-draining',
        severity: 'info',
        message: 'Znaczna część wydatków trafia do celów – sprawdź bieżący bilans.'
      });
    }
    
    return warnings;
  };

  return {
    billingPeriod,
    setBillingPeriod,
    categories: categories.filter(c => !c.isArchived),
    transactions,
    goals: getEnrichedGoals(),
    rawGoals: goals,
    lastDeletedItem,
    addCategory,
    updateCategory,
    archiveCategory,
    canArchiveCategory,
    reorderCategory,
    addGoal,
    updateGoal,
    archiveGoal, // ETAP 1
    deleteGoal,
    getGoalCurrent,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    undoLastDelete,
    validateTransaction,
    getTransactionsInPeriod,
    getInsights,
    getWarnings,
    closePeriodAndStartNew, // ETAP 5
    closedPeriods, // 2️⃣ Historia zamkniętych okresów (snapshots)
  };
};

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

const KPICard = ({ icon: Icon, label, value, sublabel, color = 'emerald', trend }) => {
  const colorClasses = {
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-400',
    rose: 'from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-400',
    violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/20 text-violet-400',
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-400',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${colorClasses[color]} backdrop-blur-sm p-6 transition-all duration-300 hover:scale-105`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <Icon className={`w-8 h-8 ${colorClasses[color].split(' ')[3]}`} />
          {trend !== undefined && (
            <span className={`text-xs font-bold flex items-center gap-1 ${trend >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(trend).toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
        {sublabel && <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">{sublabel}</p>}
      </div>
    </div>
  );
};

const InsightCard = ({ icon: Icon, text, type = 'info' }) => {
  const styles = {
    info: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    danger: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${styles[type]}`}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
};

const WarningsPanel = ({ warnings }) => {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-white/90 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200 dark:border-slate-300 dark:border-slate-700/50 rounded-3xl p-8">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Bell className="w-7 h-7 text-amber-400" />
        Ostrzeżenia
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warnings.map(warning => (
          <InsightCard
            key={warning.id}
            icon={AlertCircle}
            type={warning.severity}
            text={warning.message}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// TAB 1: CURRENT MONTH
// ============================================================================

const CurrentMonthTab = ({ store, showToast, theme = "dark", t = (k) => k, language = "pl" }) => {
  const [periodError, setPeriodError] = useState(null);
  
  const periodTx = store.getTransactionsInPeriod();
  const budgetExpenses = periodTx.filter(tx => tx.type === 'expense' && !tx.goalId);
  const budgetIncome = periodTx.filter(tx => tx.type === 'income' && !tx.goalId);

  const totalExpenses = budgetExpenses.reduce((sum, tx) => sum + tx.amount, 0);
  const totalIncome = budgetIncome.reduce((sum, tx) => sum + tx.amount, 0);
  const balance = totalIncome - totalExpenses;

  const insights = store.getInsights();
  const { totalBillingDays, elapsedDays, remainingDays } = insights;
  const warnings = store.getWarnings();

  const periodStart = new Date(store.billingPeriod.startDate);
  const periodMonth = periodStart.getMonth();
  const periodStatus = getBillingPeriodStatus(store.billingPeriod.endDate);

  const categoryAnalysis = store.categories.map(cat => {
    const monthlyBudget = getMonthlyBudget(cat, periodMonth);
    const spent = budgetExpenses.filter(tx => tx.categoryId === cat.id).reduce((sum, tx) => sum + tx.amount, 0);
    const remaining = monthlyBudget - spent;
    const percentage = monthlyBudget > 0 ? (spent / monthlyBudget) * 100 : 0;
    const safeDailySpend = remainingDays > 0 ? remaining / remainingDays : 0;

    return {
      ...cat,
      monthlyBudget,
      spent,
      remaining,
      percentage,
      safeDailySpend,
      status: percentage < 80 ? 'safe' : percentage < 95 ? 'warning' : 'danger'
    };
  }).filter(cat => cat.monthlyBudget > 0);

  const totalBudget = categoryAnalysis.reduce((sum, cat) => sum + cat.monthlyBudget, 0);
  const budgetPercentage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

  const statusBadge = {
    active: { text: t('active'), color: 'bg-emerald-500/20 text-emerald-400' },
    lastDay: { text: t('lastDay'), color: 'bg-amber-500/20 text-amber-400' },
    closed: { text: t('closed'), color: 'bg-slate-500/20 text-slate-400' }
  };

  const isPeriodClosed = store.billingPeriod.status === 'closed';

  const handleClosePeriod = () => {
    const result = store.closePeriodAndStartNew();
    if (result.success) {
      showToast && showToast(t('periodClosedNewStarted') || 'Okres zamknięty. Rozpoczęto nowy okres.');
    }
  };

  return (
    <div className="space-y-8">
      {/* ETAP 6: Warning for closed period */}
      {isPeriodClosed && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-400 mb-2">Okres jest zamknięty (read-only)</h3>
              <p className="text-sm text-amber-300 mb-4">
                Ten okres rozliczeniowy został zamknięty. Nie można edytować, dodawać ani usuwać transakcji z tego okresu. 
                Aby dodać nowe transakcje, rozpocznij nowy okres.
              </p>
              <button
                onClick={handleClosePeriod}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-slate-900 dark:text-white font-semibold py-2 px-6 rounded-xl transition-all"
              >
                Rozpocznij nowy okres
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Period Editor */}
      <div className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/30 rounded-2xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-violet-400" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-600 dark:text-slate-400">Okres rozliczeniowy</p>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusBadge[periodStatus].color}`}>
                  {statusBadge[periodStatus].text}
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {new Date(store.billingPeriod.startDate).toLocaleDateString('pl-PL')} - {new Date(store.billingPeriod.endDate).toLocaleDateString('pl-PL')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {!isPeriodClosed && (
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Data końca okresu</label>
                <input
                  type="date"
                  value={store.billingPeriod.endDate}
                  onChange={(e) => {
                    const result = store.setBillingPeriod(store.billingPeriod.startDate, e.target.value);
                    if (result.error) {
                      setPeriodError(result.error);
                    } else {
                      setPeriodError(null);
                    }
                  }}
                  className="bg-slate-200 dark:bg-slate-200 dark:bg-slate-700/50 border border-slate-400 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                {periodError && (
                  <p className="text-xs text-rose-400 mt-1">{periodError}</p>
                )}
              </div>
            )}
            
            {/* ETAP 5: Close period button */}
            {!isPeriodClosed && remainingDays === 0 && (
              <button
                onClick={handleClosePeriod}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                <Clock className="w-5 h-5" />
                Zamknij okres i rozpocznij nowy
              </button>
            )}
            
            <div className="text-right">
              <p className="text-xs text-slate-600 dark:text-slate-400">Upłynęło/Pozostało</p>
              <p className="text-2xl font-bold text-violet-400">{elapsedDays}/{remainingDays}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">{totalBillingDays} dni okresu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      <WarningsPanel warnings={warnings} />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          icon={Wallet}
          label="Bilans okresu"
          value={`${balance.toFixed(0)} PLN`}
          sublabel={`Przychody: ${totalIncome.toFixed(0)} PLN`}
          color={balance > 0 ? 'emerald' : 'rose'}
        />
        <KPICard
          icon={Clock}
          label="Dni pozostałe"
          value={`${remainingDays}`}
          sublabel={`upłynęło ${elapsedDays} dni`}
          color="cyan"
        />
        <KPICard
          icon={AlertCircle}
          label="% Budżetu"
          value={`${budgetPercentage.toFixed(1)}%`}
          sublabel={`${totalExpenses.toFixed(0)} / ${totalBudget.toFixed(0)} PLN`}
          color={budgetPercentage < 80 ? 'emerald' : budgetPercentage < 95 ? 'amber' : 'rose'}
          trend={insights.expenseChange}
        />
        <KPICard
          icon={Activity}
          label="Śr. dzienny wydatek"
          value={`${insights.avgDailyExpense.toFixed(0)} PLN`}
          sublabel={`Prognoza: ${insights.projectedExpenses.toFixed(0)} PLN`}
          color={insights.isOnTrack ? 'violet' : 'amber'}
        />
      </div>

      {/* Smart Insights */}
      <div className="bg-white/90 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200 dark:border-slate-300 dark:border-slate-700/50 rounded-3xl p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Zap className="w-7 h-7 text-amber-400" />
          Inteligentne Podpowiedzi
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.daysUntilBudgetExceeded > 0 && (
            <InsightCard
              icon={Bell}
              type={insights.daysUntilBudgetExceeded < 7 ? 'warning' : 'info'}
              text={`Przy obecnym tempie wydatków przekroczysz budżet za ${insights.daysUntilBudgetExceeded} dni.`}
            />
          )}
          {insights.highestExpense && (
            <InsightCard
              icon={TrendingDown}
              type="info"
              text={`Największy wydatek w okresie: ${insights.highestExpense.description} (${insights.highestExpense.amount.toFixed(0)} PLN)`}
            />
          )}
          {insights.expenseChange !== 0 && (
            <InsightCard
              icon={Activity}
              type={insights.expenseChange > 0 ? 'warning' : 'success'}
              text={`Wydatki ${insights.expenseChange > 0 ? 'wyższe' : 'niższe'} o ${Math.abs(insights.expenseChange).toFixed(1)}% vs poprzedni okres`}
            />
          )}
          {!insights.isOnTrack && (
            <InsightCard
              icon={AlertCircle}
              type="danger"
              text={`Uwaga! Prognozowane wydatki (${insights.projectedExpenses.toFixed(0)} PLN) przekroczą budżet.`}
            />
          )}
        </div>
      </div>

      {/* Category Progress */}
      <div className="bg-white/90 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200 dark:border-slate-300 dark:border-slate-700/50 rounded-3xl p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-violet-400" />
          Budżet per Kategoria
        </h2>
        <div className="space-y-6">
          {categoryAnalysis.map(cat => (
            <div key={cat.id} className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-200 dark:bg-slate-700/30 border border-slate-300 dark:border-slate-400 dark:border-slate-600/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{cat.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{cat.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{cat.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{cat.spent.toFixed(0)} PLN</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">z {cat.monthlyBudget.toFixed(0)} PLN</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Wykorzystanie</span>
                  <span className={`font-bold ${
                    cat.status === 'safe' ? 'text-emerald-400' :
                    cat.status === 'warning' ? 'text-amber-400' :
                    'text-rose-400'
                  }`}>{cat.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      cat.status === 'safe' ? 'bg-gradient-to-r from-emerald-500 to-cyan-500' :
                      cat.status === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                      'bg-gradient-to-r from-rose-500 to-red-500'
                    }`}
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-white/95 dark:bg-slate-800/50 border border-slate-400 dark:border-slate-600/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Bezpieczny dzienny wydatek</span>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${cat.safeDailySpend > 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                      {cat.safeDailySpend.toFixed(2)} PLN/dzień
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">na {remainingDays} dni</p>
                  </div>
                </div>
                {cat.remaining < 0 && (
                  <p className="mt-2 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Przekroczono budżet o {Math.abs(cat.remaining).toFixed(0)} PLN!
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 2: GLOBAL DASHBOARD (unchanged from V2.2)
// ============================================================================

const GlobalDashboardTab = ({ store, theme = "dark", t = (k) => k, language = "pl" }) => {
  const [period, setPeriod] = useState(3);
  const today = new Date();
  const currentMonth = today.getMonth();

  const monthsData = [];
  for (let i = period - 1; i >= 0; i--) {
    const targetMonth = currentMonth - i;
    const targetYear = CURRENT_YEAR + Math.floor(targetMonth / 12);
    const normalizedMonth = ((targetMonth % 12) + 12) % 12;

    const monthlyTx = store.transactions.filter(tx => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === normalizedMonth && txDate.getFullYear() === targetYear && !tx.goalId;
    });

    const expenses = monthlyTx.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
    const income = monthlyTx.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
    const budget = store.categories.reduce((sum, c) => sum + getMonthlyBudget(c, normalizedMonth), 0);

    monthsData.push({
      month: MONTHS[normalizedMonth],
      expenses,
      income,
      budget,
      balance: income - expenses,
    });
  }

  const avgIncome = monthsData.reduce((sum, m) => sum + m.income, 0) / period;
  const avgExpenses = monthsData.reduce((sum, m) => sum + m.expenses, 0) / period;

  const last3MonthsTx = store.transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const monthDiff = (today.getFullYear() - txDate.getFullYear()) * 12 + (today.getMonth() - txDate.getMonth());
    return monthDiff < 3 && tx.type === 'expense' && !tx.goalId;
  });

  const categorySpending = store.categories.map(cat => {
    const spent = last3MonthsTx.filter(tx => tx.categoryId === cat.id).reduce((sum, tx) => sum + tx.amount, 0);
    return { ...cat, spent };
  }).sort((a, b) => b.spent - a.spent).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Okres:</span>
        {[3, 6, 12].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              period === p
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {p} mies.
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          icon={TrendingUp}
          label={t("avgIncome")}
          value={`${avgIncome.toFixed(0)} PLN`}
          sublabel={`${t("forLast")} ${period} ${t("months")}`}
          color="emerald"
        />
        <KPICard
          icon={TrendingDown}
          label={t("avgExpenses")}
          value={`${avgExpenses.toFixed(0)} PLN`}
          sublabel={`${t("forLast")} ${period} ${t("months")}`}
          color="rose"
        />
        <KPICard
          icon={Wallet}
          label={t("avgBalanceLabel")}
          value={`${(avgIncome - avgExpenses).toFixed(0)} PLN`}
          sublabel={t("monthly")}
          color={avgIncome > avgExpenses ? 'violet' : 'amber'}
        />
      </div>

      <div className="bg-white/90 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200 dark:border-slate-300 dark:border-slate-700/50 rounded-3xl p-8">
        <h2 className="text-2xl font-bold mb-6">Trend Finansowy</h2>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={monthsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10b981" name="Przychody" strokeWidth={2} />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Wydatki" strokeWidth={2} />
            <Line type="monotone" dataKey="balance" stroke="#8b5cf6" name="Bilans" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white/90 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200 dark:border-slate-300 dark:border-slate-700/50 rounded-3xl p-8">
        <h2 className="text-2xl font-bold mb-6">Top Kategorie (3 mies.)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categorySpending} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" tick={{ fill: '#94a3b8' }} />
            <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={100} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="spent" fill="#8b5cf6" name="Wydano (PLN)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ============================================================================
// TAB 3: TRANSACTIONS (WITH VALIDATION & CONFIRMATIONS)
// ============================================================================

const TransactionsTab = ({ store, showToast, theme = "dark", t = (k) => k, language = "pl" }) => {
  const [filter, setFilter] = useState({ type: 'all', categoryId: 'all', goalId: 'all', month: 'all' });
  const [newTx, setNewTx] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    categoryId: null,
    categoryName: '',
    goalId: null,
    description: '',
    amount: ''
  });
  const [validationError, setValidationError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleAdd = () => {
    if (newTx.type === 'expense' && !newTx.categoryId && !newTx.goalId) return;
    if (newTx.type === 'income' && !newTx.categoryName && !newTx.goalId) return;
    if (!newTx.amount) return;

    const result = store.addTransaction({
      ...newTx,
      amount: parseFloat(newTx.amount),
    });

    if (!result.success) {
      setValidationError(result.errors[0].message);
      return;
    }

    setValidationError(null);
    setNewTx({
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      categoryId: null,
      categoryName: '',
      goalId: null,
      description: '',
      amount: ''
    });
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAction = () => {
    store.deleteTransaction(confirmDelete);
    setConfirmDelete(null);
    showToast('Usunięto transakcję');
  };

  // Inline validation for goal withdrawals
  const getGoalMaxWithdrawal = () => {
    if (newTx.goalId && newTx.type === 'income') {
      return store.getGoalCurrent(newTx.goalId);
    }
    return null;
  };

  const maxWithdrawal = getGoalMaxWithdrawal();
  const exceedsGoalBalance = maxWithdrawal !== null && parseFloat(newTx.amount || 0) > maxWithdrawal;

  const filtered = store.transactions.filter(tx => {
    if (filter.type !== 'all' && tx.type !== filter.type) return false;
    if (filter.categoryId !== 'all' && tx.categoryId !== parseInt(filter.categoryId)) return false;
    if (filter.goalId !== 'all') {
      const goalIdNum = filter.goalId === 'none' ? null : parseInt(filter.goalId);
      if (tx.goalId !== goalIdNum) return false;
    }
    if (filter.month !== 'all' && new Date(tx.date).getMonth() !== filter.month) return false;
    return true;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalIncome = filtered.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = filtered.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-8">
      <div className="bg-white/90 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200 dark:border-slate-300 dark:border-slate-700/50 rounded-3xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
            <p className="text-sm text-slate-600 dark:text-slate-400 uppercase mb-2">Przychody</p>
            <p className="text-3xl font-bold text-emerald-400">+{totalIncome.toFixed(0)} PLN</p>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20">
            <p className="text-sm text-slate-600 dark:text-slate-400 uppercase mb-2">Wydatki</p>
            <p className="text-3xl font-bold text-rose-400">-{totalExpenses.toFixed(0)} PLN</p>
          </div>
          <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-500/20">
            <p className="text-sm text-slate-600 dark:text-slate-400 uppercase mb-2">Bilans</p>
            <p className={`text-3xl font-bold ${totalIncome - totalExpenses >= 0 ? 'text-violet-400' : 'text-amber-400'}`}>
              {(totalIncome - totalExpenses).toFixed(0)} PLN
            </p>
          </div>
        </div>

        <div className="flex gap-4 mb-6 flex-wrap">
          <select
            value={filter.type}
            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            className="bg-slate-200 dark:bg-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white text-sm"
          >
            <option value="all">{t("allTypes")}</option>
            <option value="income">Przychody</option>
            <option value="expense">Wydatki</option>
          </select>
          <select
            value={filter.categoryId}
            onChange={(e) => setFilter({ ...filter, categoryId: e.target.value })}
            className="bg-slate-200 dark:bg-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white text-sm"
          >
            <option value="all">{t("allCategories")}</option>
            {store.categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
          <select
            value={filter.goalId}
            onChange={(e) => setFilter({ ...filter, goalId: e.target.value })}
            className="bg-slate-200 dark:bg-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white text-sm"
          >
            <option value="all">{t("allGoals")}</option>
            <option value="none">{t("noGoal")}</option>
            {store.rawGoals.map(goal => (
              <option key={goal.id} value={goal.id}>🎯 {goal.name}</option>
            ))}
          </select>
          <select
            value={filter.month}
            onChange={(e) => setFilter({ ...filter, month: e.target.value === 'all' ? 'all' : parseInt(e.target.value) })}
            className="bg-slate-200 dark:bg-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white text-sm"
          >
            <option value="all">{t("allMonths")}</option>
            {MONTHS.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
          </select>
        </div>

        <div className={`flex gap-4 p-4 rounded-xl border-2 mb-6 flex-wrap ${
          exceedsGoalBalance || validationError ? 'bg-rose-500/10 border-rose-500/30' : 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/30'
        }`}>
          <input
            type="date"
            value={newTx.date}
            onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
            className="bg-slate-200 dark:bg-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
          />
          <select
            value={newTx.type}
            onChange={(e) => setNewTx({ ...newTx, type: e.target.value })}
            className="bg-slate-200 dark:bg-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
          >
            <option value="expense">Wydatek</option>
            <option value="income">Przychód</option>
          </select>
          
          <select
            value={newTx.goalId || ''}
            onChange={(e) => {
              setNewTx({ ...newTx, goalId: e.target.value ? parseInt(e.target.value) : null });
              setValidationError(null);
            }}
            className="flex-1 min-w-[200px] bg-slate-200 dark:bg-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
          >
            <option value="">Bez celu (normalny {newTx.type === 'expense' ? 'wydatek' : 'przychód'})</option>
            {store.rawGoals.map(goal => (
              <option key={goal.id} value={goal.id}>
                🎯 {newTx.type === 'expense' ? 'Wpłać na' : 'Wypłać z'}: {goal.name}
              </option>
            ))}
          </select>

          {!newTx.goalId && newTx.type === 'expense' && (
            <select
              value={newTx.categoryId || ''}
              onChange={(e) => setNewTx({ ...newTx, categoryId: parseInt(e.target.value) })}
              className="flex-1 min-w-[200px] bg-slate-200 dark:bg-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
            >
              <option value="">Wybierz kategorię</option>
              {store.categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          )}
          
          {!newTx.goalId && newTx.type === 'income' && (
            <input
              type="text"
              value={newTx.categoryName}
              onChange={(e) => setNewTx({ ...newTx, categoryName: e.target.value })}
              className="flex-1 min-w-[200px] bg-slate-200 dark:bg-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
              placeholder="Źródło (np. Wynagrodzenie)"
            />
          )}
          
          <input
            type="text"
            value={newTx.description}
            onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
            className="flex-1 min-w-[200px] bg-slate-200 dark:bg-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
            placeholder="Opis"
          />
          <input
            type="number"
            step="0.01"
            value={newTx.amount}
            onChange={(e) => {
              setNewTx({ ...newTx, amount: e.target.value });
              setValidationError(null);
            }}
            className={`w-32 bg-slate-700 rounded-lg px-3 py-2 text-white text-sm ${
              exceedsGoalBalance ? 'border-2 border-rose-500' : ''
            }`}
            placeholder="Kwota"
          />
          <button
            onClick={handleAdd}
            disabled={exceedsGoalBalance}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-slate-900 dark:text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          {(exceedsGoalBalance || validationError) && (
            <div className="w-full flex items-center gap-2 text-rose-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <p>{validationError || `Nie możesz wypłacić więcej niż zgromadzono na celu (max: ${maxWithdrawal?.toFixed(2)} PLN)`}</p>
            </div>
          )}
        </div>

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filtered.map(tx => {
            const cat = tx.categoryId ? getCategoryById(store.categories, tx.categoryId) : null;
            const goal = tx.goalId ? store.rawGoals.find(g => g.id === tx.goalId) : null;
            const isIncome = tx.type === 'income';

            return (
              <div
                key={tx.id}
                className={`flex items-center gap-4 p-4 rounded-xl border ${
                  goal ? 'bg-violet-500/5 border-violet-500/20' :
                  isIncome ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'
                }`}
              >
                <span className="text-3xl">{goal ? '🎯' : isIncome ? '💰' : (cat?.icon || '💸')}</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">{tx.description}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {goal ? `${isIncome ? 'Wypłata z' : 'Wpłata na'} cel: ${goal.name}` : 
                     isIncome ? tx.categoryName : cat?.name} • {new Date(tx.date).toLocaleDateString('pl-PL')}
                  </p>
                </div>
                <p className={`font-bold w-40 text-right ${
                  goal && !isIncome ? 'text-violet-400' :
                  goal && isIncome ? 'text-amber-400' :
                  isIncome ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {isIncome ? '+' : '-'}{tx.amount.toFixed(2)} PLN
                </p>
                <button onClick={() => handleDelete(tx.id)} className="text-rose-400 hover:text-rose-300">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Usuń transakcję"
        message="Usunięcie tej transakcji zmieni bilans oraz postęp celów. Czy na pewno chcesz kontynuować?"
        confirmText="Usuń"
      />
    </div>
  );
};

// ============================================================================
// TAB 4: GOALS (READ-ONLY WITH CONFIRMATIONS)
// ============================================================================

const GoalsTab = ({ store, showToast, theme = "dark", t = (k) => k, language = "pl" }) => {
  const [editing, setEditing] = useState(null);
  const [newGoal, setNewGoal] = useState({
    name: '',
    target: '',
    priority: 'A',
  });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleAdd = () => {
    if (!newGoal.name || !newGoal.target) return;
    store.addGoal({
      ...newGoal,
      target: parseFloat(newGoal.target),
    });
    setNewGoal({ name: '', target: '', priority: 'A' });
  };

  const handleDelete = (id) => {
    setConfirmDelete(id);
  };

  const confirmDeleteAction = () => {
    store.deleteGoal(confirmDelete);
    setConfirmDelete(null);
    showToast('Usunięto cel');
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/90 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200 dark:border-slate-300 dark:border-slate-700/50 rounded-3xl p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Target className="w-7 h-7 text-amber-400" />
          Cele Oszczędnościowe
        </h2>

        <div className="mb-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
          <p className="text-sm text-cyan-300 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>Aby wpłacić na cel lub wypłacić z celu, użyj zakładki "Transakcje" i wybierz cel przy dodawaniu transakcji.</span>
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {/* ETAP 1: Filtruj cele archived - nie pokazuj w UI */}
          {store.goals.filter(g => g.status !== 'archived').map(goal => {
            const progress = (goal.current / goal.target) * 100;
            const goalTx = store.transactions.filter(tx => tx.goalId === goal.id);
            
            return (
              <div key={goal.id} className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-200 dark:bg-slate-700/30 border border-slate-300 dark:border-slate-400 dark:border-slate-600/50">
                {editing === goal.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      defaultValue={goal.name}
                      onBlur={(e) => store.updateGoal(goal.id, { name: e.target.value })}
                      className="w-full bg-slate-300 dark:bg-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        defaultValue={goal.target}
                        onBlur={(e) => store.updateGoal(goal.id, { target: parseFloat(e.target.value) })}
                        className="bg-slate-300 dark:bg-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                        placeholder="Cel"
                      />
                      <select
                        defaultValue={goal.priority}
                        onBlur={(e) => store.updateGoal(goal.id, { priority: e.target.value })}
                        className="bg-slate-300 dark:bg-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                      >
                        <option value="A">Priorytet A</option>
                        <option value="B">Priorytet B</option>
                        <option value="C">Priorytet C</option>
                      </select>
                    </div>
                    <button onClick={() => setEditing(null)} className="text-emerald-400 font-semibold">
                      <Save className="w-5 h-5 inline mr-2" />
                      Zapisz
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{goal.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          goal.priority === 'A' ? 'bg-rose-500/20 text-rose-400' :
                          goal.priority === 'B' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>{goal.priority}</span>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          goal.current >= goal.target ? 'bg-emerald-500/20 text-emerald-400' :
                          'bg-cyan-500/20 text-cyan-400'
                        }`}>{goal.current >= goal.target ? 'completed' : goal.status}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditing(goal.id)} className="text-blue-400 hover:text-blue-300">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        {/* ETAP 1: Archiwizuj tylko completed cele */}
                        {goal.status === 'completed' && (
                          <button 
                            onClick={() => {
                              store.archiveGoal(goal.id);
                              showToast('Cel zarchiwizowany');
                            }}
                            className="text-amber-400 hover:text-amber-300"
                            title="Archiwizuj cel"
                          >
                            <Save className="w-5 h-5" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(goal.id)} className="text-rose-400 hover:text-rose-300">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Postęp</span>
                        <span className="font-bold text-violet-400">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-500">Zebrano: {goal.current.toLocaleString()} PLN</span>
                        <span className="text-amber-400">Cel: {goal.target.toLocaleString()} PLN</span>
                      </div>
                    </div>

                    {goalTx.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-400 dark:border-slate-600">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Historia transakcji ({goalTx.length})</p>
                        <div className="space-y-2">
                          {goalTx.slice(0, 3).map(tx => (
                            <div key={tx.id} className="flex justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">
                                {new Date(tx.date).toLocaleDateString('pl-PL')} • {tx.description}
                              </span>
                              <span className={tx.type === 'expense' ? 'text-emerald-400' : 'text-amber-400'}>
                                {tx.type === 'expense' ? '+' : '-'}{tx.amount} PLN
                              </span>
                            </div>
                          ))}
                          {goalTx.length > 3 && (
                            <p className="text-xs text-slate-500 dark:text-slate-500">... i {goalTx.length - 3} więcej</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* 1️⃣ ARCHIVED GOALS SECTION */}
        {store.goals.filter(g => g.status === 'archived').length > 0 && (
          <div className="mb-6 p-6 rounded-2xl bg-white/95 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Save className="w-6 h-6 text-amber-400" />
              Cele Zarchiwizowane (Osiągnięte)
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Te cele zostały osiągnięte i automatycznie zarchiwizowane. Możliwe są tylko wypłaty zgromadzonych środków.
            </p>
            <div className="space-y-3">
              {store.goals.filter(g => g.status === 'archived').map(goal => {
                const goalTx = store.transactions.filter(tx => tx.goalId === goal.id);
                const progress = (goal.current / goal.target) * 100;
                return (
                  <div key={goal.id} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-200 dark:bg-slate-700/30 border border-slate-400 dark:border-slate-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-slate-200">{goal.name}</h4>
                        <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400">
                          ✓ Osiągnięty
                        </span>
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{goalTx.length} transakcji</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Postęp: {progress.toFixed(0)}%</span>
                        <span className="text-emerald-400 font-semibold">
                          {goal.current.toLocaleString()} PLN / {goal.target.toLocaleString()} PLN
                        </span>
                      </div>
                      {goal.current > 0 && (
                        <p className="text-xs text-amber-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Dostępne do wypłaty: {goal.current.toLocaleString()} PLN
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-6 rounded-2xl bg-slate-200 dark:bg-slate-200 dark:bg-slate-700/50 border-2 border-dashed border-slate-400 dark:border-slate-600">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Dodaj Nowy Cel</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={newGoal.name}
              onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
              className="bg-slate-300 dark:bg-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              placeholder="Nazwa celu"
            />
            <input
              type="number"
              value={newGoal.target}
              onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
              className="bg-slate-300 dark:bg-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              placeholder="Kwota docelowa"
            />
            <select
              value={newGoal.priority}
              onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
              className="bg-slate-300 dark:bg-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="A">Priorytet A</option>
              <option value="B">Priorytet B</option>
              <option value="C">Priorytet C</option>
            </select>
          </div>
          <button
            onClick={handleAdd}
            className="mt-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-slate-900 dark:text-white px-6 py-2 rounded-lg font-semibold"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Dodaj Cel
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Usuń cel"
        message="Usunięcie celu usunie również wszystkie powiązane transakcje. Tej operacji nie można cofnąć. Czy na pewno chcesz kontynuować?"
        confirmText="Usuń cel"
      />
    </div>
  );
};

// ============================================================================
// TAB 5: CATEGORIES (MOVED FROM SETTINGS)
// ============================================================================

/**
 * ETAP 3: Kategorie jako osobna zakładka
 * - CRUD kategorii
 * - Sortowanie  
 * - Budżety miesięczne
 * - Wybór ikoni (emoji)
 */
const CategoriesTab = ({ store, showToast, theme = "dark", t = (k) => k, language = "pl" }) => {
  const [selected, setSelected] = useState(null);
  const [newCat, setNewCat] = useState({
    name: '',
    icon: '💰',
    type: 'fixed',
    defaultBudget: ''
  });
  const [confirmArchive, setConfirmArchive] = useState(null);

  const handleAddCategory = () => {
    if (!newCat.name || !newCat.defaultBudget) return;
    
    const monthlyBudgets = {};
    const budget = parseFloat(newCat.defaultBudget);
    for (let i = 0; i < 12; i++) {
      monthlyBudgets[i] = budget;
    }

    store.addCategory({
      ...newCat,
      defaultBudget: budget,
      monthlyBudgets,
    });

    setNewCat({ name: '', icon: '💰', type: 'fixed', defaultBudget: '' });
  };

  const handleArchive = (id) => {
    setConfirmArchive(id);
  };

  const confirmArchiveAction = () => {
    store.archiveCategory(confirmArchive);
    setConfirmArchive(null);
    showToast('Zarchiwizowano kategorię');
  };

  const archiveInfo = confirmArchive ? store.canArchiveCategory(confirmArchive) : null;

  return (
    <div className="space-y-8">
      <div className="bg-white/90 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200 dark:border-slate-300 dark:border-slate-700/50 rounded-3xl p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-violet-400" />
          Zarządzanie Kategoriami
        </h2>

        <div className="space-y-4 mb-6">
          {store.categories.map((cat, idx) => (
            <div key={cat.id} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-200 dark:bg-slate-700/30 border border-slate-300 dark:border-slate-400 dark:border-slate-600/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{cat.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{cat.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => store.reorderCategory(cat.id, 'up')}
                    disabled={idx === 0}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => store.reorderCategory(cat.id, 'down')}
                    disabled={idx === store.categories.length - 1}
                    className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelected(selected === cat.id ? null : cat.id)}
                    className="text-violet-400 hover:text-violet-300 ml-2"
                  >
                    <ChevronRight className={`w-5 h-5 transition-transform ${selected === cat.id ? 'rotate-90' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleArchive(cat.id)}
                    className="text-rose-400 hover:text-rose-300 ml-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {selected === cat.id && (
                <div className="mt-4 pt-4 border-t border-slate-400 dark:border-slate-600">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Budżet Miesięczny ({CURRENT_YEAR})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {MONTHS.map((month, idx) => (
                      <div key={idx}>
                        <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">{month}</label>
                        <input
                          type="number"
                          value={cat.monthlyBudgets?.[idx] || 0}
                          onChange={(e) => {
                            const newBudgets = { ...cat.monthlyBudgets, [idx]: parseFloat(e.target.value) || 0 };
                            store.updateCategory(cat.id, { monthlyBudgets: newBudgets });
                          }}
                          className="w-full bg-slate-300 dark:bg-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 rounded-2xl bg-slate-200 dark:bg-slate-200 dark:bg-slate-700/50 border-2 border-dashed border-slate-400 dark:border-slate-600">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Dodaj Kategorię</h3>
          <div className="grid grid-cols-1 gap-4">
            {/* 3️⃣ Icon Picker */}
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-2">Ikona kategorii</label>
              <IconPicker
                value={newCat.icon}
                onChange={(icon) => setNewCat({ ...newCat, icon })}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                className="bg-slate-300 dark:bg-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                placeholder="Nazwa kategorii"
              />
              <select
                value={newCat.type}
                onChange={(e) => setNewCat({ ...newCat, type: e.target.value })}
                className="bg-slate-300 dark:bg-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
              >
                <option value="fixed">Stały</option>
                <option value="variable">Zmienny</option>
                <option value="occasional">Okazjonalny</option>
              </select>
              <input
                type="number"
                value={newCat.defaultBudget}
                onChange={(e) => setNewCat({ ...newCat, defaultBudget: e.target.value })}
                className="bg-slate-300 dark:bg-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
                placeholder="Domyślny budżet"
              />
            </div>
          </div>
          <button
            onClick={handleAddCategory}
            className="mt-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-slate-900 dark:text-white px-6 py-2 rounded-lg font-semibold"
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Dodaj Kategorię
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmArchive !== null}
        onClose={() => setConfirmArchive(null)}
        onConfirm={confirmArchiveAction}
        title="Archiwizuj kategorię"
        message={`Archiwizacja kategorii nie usuwa danych historycznych. ${
          archiveInfo?.hasTransactions 
            ? 'Ta kategoria ma powiązane transakcje, które pozostaną w systemie.' 
            : ''
        } Zarchiwizowaną kategorię można później przywrócić.`}
        confirmText="Archiwizuj"
        confirmColor="violet"
      />
    </div>
  );
};

// ============================================================================
// TAB 6: SETTINGS (NEW SIMPLE VERSION)
// ============================================================================

/**
 * ETAP 3: Nowe ustawienia - tylko język i motyw
 * Kategorie przeniesione do osobnej zakładki
 */
const SettingsTab = ({ store, showToast, theme, setTheme, language, setLanguage, t }) => {
  // FIX: Removed local state - using props from parent

  const handleLanguageChange = (lang) => {
    setLanguage(lang); // FIX: Uses prop from parent
    showToast(`Język zmieniony na: ${lang === 'pl' ? 'Polski' : 'English'}`);
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme); // FIX: Uses prop from parent
    showToast(`Motyw zmieniony na: ${newTheme === 'dark' ? 'Ciemny' : 'Jasny'}`);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white/90 dark:bg-slate-800/30 backdrop-blur-sm border border-slate-200 dark:border-slate-300 dark:border-slate-700/50 rounded-3xl p-8">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Settings className="w-7 h-7 text-violet-400" />
          {t('settings')} {/* FIX: Use translation */}
        </h2>

        <div className="space-y-6">
          {/* Language Setting */}
          <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-200 dark:bg-slate-700/30 border border-slate-300 dark:border-slate-400 dark:border-slate-600/50">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🌐</span>
              {t('language')} {/* FIX: Use translation */}
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleLanguageChange('pl')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                  language === 'pl'
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                🇵🇱 Polski
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
              Wybierz język interfejsu aplikacji
            </p>
          </div>

          {/* Theme Setting */}
          <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-200 dark:bg-slate-700/30 border border-slate-300 dark:border-slate-400 dark:border-slate-600/50">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🎨</span>
              {t('theme')} {/* FIX: Use translation */}
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                🌙 {t('darkMode')} {/* FIX: Use translation */}
              </button>
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                  theme === 'light'
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white'
                    : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                }`}
              >
                ☀️ {t('lightMode')} {/* FIX: Use translation */}
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3">
              Wybierz schemat kolorów aplikacji
            </p>
          </div>

          {/* Info */}
          <div className="p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/30">
            <p className="text-sm text-cyan-300 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>
                Zarządzanie kategoriami budżetowymi zostało przeniesione do osobnej zakładki <strong>"Kategorie"</strong>.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================

const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('currentMonth');
  const store = useFinanceStore();
  const [toast, setToast] = useState(null);
  
  // FIX: Add theme and language hooks
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const showToast = (message) => {
    setToast({ message });
  };

  const handleUndo = () => {
    store.undoLastDelete();
    setToast(null);
  };

  /**
   * ETAP 4: Nowa kolejność zakładek
   * 1. Dashboard
   * 2. Bieżący okres
   * 3. Transakcje
   * 4. Cele
   * 5. Kategorie (NOWA)
   * 6. Ustawienia
   */
  const tabs = [
    { id: 'dashboard', name: t('dashboard'), icon: Home },
    { id: 'currentMonth', name: t('currentPeriod'), icon: Clock },
    { id: 'transactions', name: t('transactions'), icon: DollarSign },
    { id: 'goals', name: t('goals'), icon: Target },
    { id: 'categories', name: t('categories'), icon: BarChart3 },
    { id: 'settings', name: t('settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-white via-violet-200 to-fuchsia-200 bg-clip-text text-transparent">
            Finance Dashboard V2.7
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Goals Lifecycle + Icon Picker + Accounting Fixes</p>
        </header>

        <div className="flex gap-2 mb-8 bg-white/90 dark:bg-slate-800/30 backdrop-blur-sm p-2 rounded-2xl border border-slate-200 dark:border-slate-300 dark:border-slate-700/50 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'dashboard' && <GlobalDashboardTab store={store} theme={theme} t={t} language={language} />}
        {activeTab === 'currentMonth' && <CurrentMonthTab store={store} showToast={showToast} theme={theme} t={t} language={language} />}
        {activeTab === 'transactions' && <TransactionsTab store={store} showToast={showToast} theme={theme} t={t} language={language} />}
        {activeTab === 'goals' && <GoalsTab store={store} showToast={showToast} theme={theme} t={t} language={language} />}
        {activeTab === 'categories' && <CategoriesTab store={store} showToast={showToast} theme={theme} t={t} language={language} />}
        {activeTab === 'settings' && <SettingsTab store={store} showToast={showToast} theme={theme} setTheme={setTheme} language={language} setLanguage={setLanguage} t={t} />}
      </div>

      {toast && store.lastDeletedItem && (
        <Toast
          message={toast.message}
          action={t("undo")}
          onAction={handleUndo}
          onClose={() => setToast(null)}
        />
      )}

      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(51, 65, 85, 0.3); border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.5); border-radius: 10px; }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
};

// ============================================================================
// APP WITH PROVIDERS
// ============================================================================

const App = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <FinanceDashboard />
      </LanguageProvider>
    </ThemeProvider>
  );
};

// App component ready
