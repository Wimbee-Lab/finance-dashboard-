// ============================================================================
// FINANCE DASHBOARD V3.0 - WITH SUPABASE AUTH & CLOUD SYNC
// ============================================================================

const { useState, useEffect, createContext, useContext, useRef } = React;
const { createClient } = supabase;

// Supabase Configuration
const SUPABASE_URL = 'https://idpdohprayrjibjuxprm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkcGRvaHByYXlyamlianV4cHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTI3MTQsImV4cCI6MjA4NTc4ODcxNH0.wHC_C-TJtgOvtbBv-te7Qs5pDiKZzr9oN2FJg2fX368';

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Context for Auth
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    const { data, error } = await supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  };

  return React.createElement(AuthContext.Provider, { value: { user, loading, signUp, signIn, signOut } }, children);
};

const useAuth = () => useContext(AuthContext);

// Auth Components
const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setError('Check your email to confirm your account!');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return React.createElement('div', { 
    className: 'min-h-screen flex items-center justify-center',
    style: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
  },
    React.createElement('div', { className: 'bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md' },
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement('h1', { className: 'text-3xl font-bold text-slate-900 dark:text-white mb-2' }, '💰 Finance Dashboard'),
        React.createElement('p', { className: 'text-slate-600 dark:text-slate-400' }, isLogin ? 'Sign in to your account' : 'Create a new account')
      ),
      
      error && React.createElement('div', { 
        className: 'mb-4 p-3 rounded-lg ' + (error.includes('email') ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800')
      }, error),
      
      React.createElement('form', { onSubmit: handleSubmit, className: 'space-y-4' },
        React.createElement('div', {},
          React.createElement('label', { className: 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2' }, 'Email'),
          React.createElement('input', {
            type: 'email',
            value: email,
            onChange: (e) => setEmail(e.target.value),
            className: 'w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white',
            placeholder: 'your@email.com',
            required: true
          })
        ),
        
        React.createElement('div', {},
          React.createElement('label', { className: 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2' }, 'Password'),
          React.createElement('input', {
            type: 'password',
            value: password,
            onChange: (e) => setPassword(e.target.value),
            className: 'w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white',
            placeholder: '••••••••',
            required: true,
            minLength: 6
          })
        ),
        
        React.createElement('button', {
          type: 'submit',
          disabled: loading,
          className: 'w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50'
        }, loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Sign Up'))
      ),
      
      React.createElement('div', { className: 'mt-6 text-center' },
        React.createElement('button', {
          onClick: () => { setIsLogin(!isLogin); setError(''); },
          className: 'text-purple-600 dark:text-purple-400 hover:underline'
        }, isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In')
      )
    )
  );
};

// Main App Component with Supabase
const App = () => {
  const { user, loading, signOut } = useAuth();
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [syncing, setSyncing] = useState(true);

  // Load data from Supabase
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setSyncing(true);
      try {
        const [categoriesRes, transactionsRes, goalsRes] = await Promise.all([
          supabaseClient.from('categories').select('*').eq('user_id', user.id),
          supabaseClient.from('transactions').select('*').eq('user_id', user.id),
          supabaseClient.from('goals').select('*').eq('user_id', user.id)
        ]);

        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (transactionsRes.data) setTransactions(transactionsRes.data);
        if (goalsRes.data) setGoals(goalsRes.data);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setSyncing(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-slate-900' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'spinner', style: { 
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}),
        React.createElement('p', { className: 'text-white text-xl' }, 'Loading...')
      )
    );
  }

  if (!user) {
    return React.createElement(AuthScreen);
  }

  if (syncing) {
    return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-slate-900' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'spinner', style: { 
          border: '4px solid rgba(255,255,255,0.3)',
          borderTop: '4px solid white',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}),
        React.createElement('p', { className: 'text-white text-xl' }, 'Syncing your data...')
      )
    );
  }

  // Main Dashboard
  return React.createElement('div', { className: 'min-h-screen bg-slate-900 text-white p-8' },
    React.createElement('div', { className: 'max-w-7xl mx-auto' },
      React.createElement('div', { className: 'flex justify-between items-center mb-8' },
        React.createElement('h1', { className: 'text-4xl font-bold' }, '💰 Finance Dashboard'),
        React.createElement('div', { className: 'flex gap-4 items-center' },
          React.createElement('span', { className: 'text-sm text-slate-400' }, user.email),
          React.createElement('button', {
            onClick: signOut,
            className: 'px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition'
          }, 'Sign Out')
        )
      ),
      
      React.createElement('div', { className: 'bg-slate-800 rounded-2xl p-8 mb-8' },
        React.createElement('h2', { className: 'text-2xl font-bold mb-4' }, '☁️ Cloud Sync Active'),
        React.createElement('div', { className: 'grid grid-cols-3 gap-4' },
          React.createElement('div', { className: 'bg-slate-700 p-4 rounded-lg' },
            React.createElement('p', { className: 'text-slate-400 text-sm' }, 'Categories'),
            React.createElement('p', { className: 'text-3xl font-bold' }, categories.length)
          ),
          React.createElement('div', { className: 'bg-slate-700 p-4 rounded-lg' },
            React.createElement('p', { className: 'text-slate-400 text-sm' }, 'Transactions'),
            React.createElement('p', { className: 'text-3xl font-bold' }, transactions.length)
          ),
          React.createElement('div', { className: 'bg-slate-700 p-4 rounded-lg' },
            React.createElement('p', { className: 'text-slate-400 text-sm' }, 'Goals'),
            React.createElement('p', { className: 'text-3xl font-bold' }, goals.length)
          )
        )
      ),
      
      React.createElement('div', { className: 'bg-green-900/50 border border-green-500 rounded-xl p-6' },
        React.createElement('h3', { className: 'text-xl font-bold mb-2' }, '✅ Full Version Coming Soon!'),
        React.createElement('p', { className: 'text-slate-300' }, 'Authentication works! Full dashboard features are being integrated now...'),
        React.createElement('ul', { className: 'mt-4 space-y-2 text-slate-400' },
          React.createElement('li', {}, '✅ User authentication'),
          React.createElement('li', {}, '✅ Cloud database connected'),
          React.createElement('li', {}, '✅ Real-time sync ready'),
          React.createElement('li', {}, '🔄 Dashboard UI integration (in progress)'),
          React.createElement('li', {}, '🔄 Full CRUD operations (in progress)')
        )
      )
    )
  );
};

// Root Component
const Root = () => {
  return React.createElement(AuthProvider, {},
    React.createElement(App)
  );
};

window.App = Root;
