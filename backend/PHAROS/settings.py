from pathlib import Path
from datetime import timedelta

# =============================================================
# CHEMINS DE BASE
# =============================================================
BASE_DIR = Path(__file__).resolve().parent.parent

# =============================================================
# SÉCURITÉ
# =============================================================
SECRET_KEY = 'django-insecure-transcargo-bj-2026-change-en-production'
DEBUG = True
ALLOWED_HOSTS = ['*']

# =============================================================
# APPLICATIONS INSTALLÉES
# =============================================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Packages tiers
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    # Nos applications
    'accounts',
    'demandes',
    'offres',
    'livraisons',
    'paiements',
    'evaluations',
    'notifications',
    'litiges',
    'negociations',
]

# =============================================================
# MIDDLEWARES
# =============================================================
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS en premier
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'Benin_Transport.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Benin_Transport.wsgi.application'

# =============================================================
# BASE DE DONNÉES — PostgreSQL
# =============================================================
DATABASES = {
 'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'transportbenin',
        'USER': 'postgres',
        'PASSWORD': 'admin123',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'client_encoding': 'UTF8',
        },
    }
}

# =============================================================
# AUTHENTIFICATION — Modèle utilisateur personnalisé
# =============================================================
AUTH_USER_MODEL = 'accounts.CustomUser'

# =============================================================
# DJANGO REST FRAMEWORK
# =============================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# =============================================================
# JWT — Configuration des tokens
# =============================================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),   # expire après 30 min
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# =============================================================
# CORS — Autoriser le frontend React
# =============================================================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5173",
    "http://localhost:5174",  # C'est pour la connexion avec react de prisodev
]
# =============================================================
# INTERNATIONALISATION
# =============================================================
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Porto-Novo'  # fuseau horaire du Bénin
USE_I18N = True
USE_TZ = True

# =============================================================
# FICHIERS STATIQUES ET MÉDIAS
# =============================================================
STATIC_URL = '/static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'  # pour les documents uploadés (IFU, RCCM, etc.)

# =============================================================
# CLÉ PRIMAIRE PAR DÉFAUT
# =============================================================
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'